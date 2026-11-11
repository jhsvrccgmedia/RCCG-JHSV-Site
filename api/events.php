<?php
/**
 * /api/events.php — upcoming events from Church Center, as JSON.
 *
 * The homepage "What's happening" grid and the Events page "Upcoming"
 * grid call this endpoint (see initEventsPage in scripts.js). It fetches
 * the same feed the Church Center calendar gallery uses
 * (https://rccgjhsv.churchcenter.com/calendar?view=gallery), trims it to
 * what the cards need (title, start/end, flyer, location, link), and
 * caches the result on disk so Church Center is called at most once per
 * CACHE_TTL no matter how many people visit.
 *
 * Why server-side: Church Center only serves the feed with a short-lived
 * anonymous token, and browsers on rccgjhsv.org are not allowed to
 * request that token. PHP can, so it does that step here.
 *
 * Safety design
 * -------------
 * - Takes no input. Query strings, cookies and request bodies are
 *   ignored, and the only outbound requests go to the fixed CC_BASE
 *   host over HTTPS. Nothing a visitor sends can change what is fetched.
 * - Read-only, no database, no secrets. The Church Center token is the
 *   same anonymous token any visitor to Church Center receives.
 * - Only answers our own pages: browser requests from other websites
 *   are refused (Sec-Fetch-Site / Origin checks), and no CORS headers
 *   are sent, so other sites' scripts can't read the response.
 * - Flood protection: per-IP rate limit, and Church Center is called at
 *   most once per CACHE_TTL (once per FAIL_COOLDOWN after an error), so
 *   heavy traffic is answered from the cache file.
 * - Never hangs: while one request refreshes the cache, others get the
 *   previous copy immediately instead of waiting.
 * - Errors are logged, never shown (no file paths or PHP details leak).
 * - api/.htaccess blocks every file in /api/ except this one, and
 *   api/cache/.htaccess blocks the cache folder entirely.
 *
 * If Church Center is unreachable, the last good copy is served (marked
 * "stale": true) so the site keeps showing events.
 *
 * Requirements: PHP 7.0+ with either the curl extension or
 * allow_url_fopen enabled (standard on InterServer shared hosting).
 */

// ---- Settings -------------------------------------------------------
const CC_BASE       = 'https://rccgjhsv.churchcenter.com';
const CC_API_VER    = '2020-06-16';
const CACHE_TTL     = 900;    // seconds between Church Center refreshes (15 min)
const FAIL_COOLDOWN = 120;    // after a failed refresh, wait this long before retrying
const MAX_EVENTS    = 12;     // the pages show at most 3 (home) / 6 (events)
const HTTP_TIMEOUT  = 8;      // seconds per request to Church Center
const MAX_BODY      = 2097152; // ignore Church Center responses over 2 MB

// Per-IP limit. Generous on purpose: a whole congregation on the church
// Wi-Fi shares one IP, and each browser only calls this about once per
// 10 minutes (responses are cached in the browser).
const RATE_LIMIT    = 120;    // requests ...
const RATE_WINDOW   = 60;     // ... per this many seconds

// Pages allowed to call this from a browser (besides same-origin).
const ALLOWED_ORIGINS = array('https://rccgjhsv.org', 'https://www.rccgjhsv.org');

// Only these hosts are passed through to the browser.
const IMAGE_PREFIX = 'https://images.planningcenterusercontent.com/';
const LINK_PREFIX  = CC_BASE . '/';

// ---- Hardening ------------------------------------------------------
@ini_set('display_errors', '0');
@ini_set('log_errors', '1');
@ini_set('default_socket_timeout', (string) HTTP_TIMEOUT);
@set_time_limit(30);
umask(0077);   // cache files readable by this hosting account only

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex');
header('Cross-Origin-Resource-Policy: same-origin');
header('Referrer-Policy: no-referrer');

// ---- Gatekeeping ----------------------------------------------------
$method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';
if ($method !== 'GET' && $method !== 'HEAD') {
    header('Allow: GET, HEAD');
    jhsv_fail(405, 'method_not_allowed');
}

if (!jhsv_request_is_from_our_site()) {
    jhsv_fail(403, 'forbidden');
}

$cacheDir  = jhsv_cache_dir();
$cacheFile = $cacheDir . '/events.json';
$tokenFile = $cacheDir . '/token.json';
$lockFile  = $cacheDir . '/refresh.lock';
$failFile  = $cacheDir . '/last-failure';

if (!jhsv_rate_limit_ok($cacheDir)) {
    header('Retry-After: ' . RATE_WINDOW);
    jhsv_fail(429, 'too_many_requests');
}

// ---- Serve --------------------------------------------------------------
// 1. Fresh cache? Serve it.
$cached = jhsv_read_json($cacheFile);
if (jhsv_is_fresh($cached)) {
    jhsv_send($cached, false);
}

// 2. Church Center failed recently? Don't hammer it; serve what we have.
if (is_file($failFile) && (time() - (int) @filemtime($failFile)) < FAIL_COOLDOWN) {
    if ($cached) { jhsv_send($cached, true); }
    jhsv_fail(503, 'unavailable', 60);
}

// 3. Refresh. Only one request does this at a time. If someone else is
//    already refreshing and we have an older copy, serve that right away
//    instead of waiting. (With no copy at all, wait for theirs.)
$lock = @fopen($lockFile, 'c');
if ($lock) {
    if (!@flock($lock, LOCK_EX | LOCK_NB)) {
        if ($cached) { jhsv_send($cached, false); }
        @flock($lock, LOCK_EX);
        $cached = jhsv_read_json($cacheFile);
        if (jhsv_is_fresh($cached)) { jhsv_unlock($lock); jhsv_send($cached, false); }
    }
}

try {
    $events  = jhsv_fetch_events($tokenFile);
    $payload = array(
        'source'     => 'church-center',
        'fetched_at' => time(),
        'events'     => $events,
    );
    jhsv_write_json($cacheFile, $payload);
    @unlink($failFile);
    jhsv_unlock($lock);
    jhsv_send($payload, false);
} catch (Exception $e) {
    @touch($failFile);
    jhsv_unlock($lock);
    error_log('[api/events.php] Church Center fetch failed: ' . $e->getMessage());
    if ($cached && isset($cached['events'])) {
        jhsv_send($cached, true);   // last good copy beats an empty grid
    }
    jhsv_fail(502, 'unavailable', 60);
}

// =====================================================================

/**
 * Browsers label every request with where it came from. Our own pages
 * send "same-origin"; typing the URL in the address bar sends "none"
 * (handy for checking the feed). Anything else is another website.
 * Older browsers without Sec-Fetch-Site fall back to the Origin check.
 * Non-browser tools (curl, bots) send neither header and can't be told
 * apart from a visitor, but they only get the same public event list
 * that Church Center already publishes, under the rate limit.
 */
function jhsv_request_is_from_our_site()
{
    $site = isset($_SERVER['HTTP_SEC_FETCH_SITE']) ? strtolower($_SERVER['HTTP_SEC_FETCH_SITE']) : '';
    if ($site === 'same-site') {
        // e.g. www.rccgjhsv.org -> rccgjhsv.org: allowed only from our listed origins.
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? strtolower(rtrim($_SERVER['HTTP_ORIGIN'], '/')) : '';
        return in_array($origin, ALLOWED_ORIGINS, true);
    }
    if ($site !== '' && $site !== 'same-origin' && $site !== 'none') {
        return false;
    }
    if (!empty($_SERVER['HTTP_ORIGIN'])) {
        $origin = strtolower(rtrim($_SERVER['HTTP_ORIGIN'], '/'));
        $host   = isset($_SERVER['HTTP_HOST']) ? strtolower($_SERVER['HTTP_HOST']) : '';
        $self   = array('https://' . $host, 'http://' . $host);
        if (!in_array($origin, ALLOWED_ORIGINS, true) && !in_array($origin, $self, true)) {
            return false;
        }
    }
    return true;
}

/** Fixed-window counter per IP, stored as one tiny file per hashed IP. */
function jhsv_rate_limit_ok($cacheDir)
{
    $ip  = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
    $dir = $cacheDir . '/ratelimit';
    if (!is_dir($dir) && !@mkdir($dir, 0700, true)) {
        return true;   // can't track: fail open rather than break the site
    }

    // Occasionally sweep counters for IPs not seen in the last hour.
    if (mt_rand(1, 200) === 1) {
        foreach ((array) @glob($dir . '/*.cnt') as $f) {
            if (is_file($f) && time() - (int) @filemtime($f) > 3600) { @unlink($f); }
        }
    }

    $file = $dir . '/' . hash('sha256', $ip . '|' . __FILE__) . '.cnt';
    $fh = @fopen($file, 'c+');
    if (!$fh) { return true; }
    @flock($fh, LOCK_EX);
    $parts  = explode(' ', trim((string) stream_get_contents($fh)));
    $start  = isset($parts[0]) ? (int) $parts[0] : 0;
    $count  = isset($parts[1]) ? (int) $parts[1] : 0;
    $now    = time();
    if ($now - $start >= RATE_WINDOW) { $start = $now; $count = 0; }
    $count++;
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, $start . ' ' . $count);
    @flock($fh, LOCK_UN);
    fclose($fh);
    return $count <= RATE_LIMIT;
}

function jhsv_fetch_events($tokenFile)
{
    $query = http_build_query(array(
        'include'  => 'location',
        'filter'   => 'upcoming,first_occurrence',
        'order'    => 'visible_starts_at',
        'per_page' => 25,
    ));
    $url = CC_BASE . '/~ccapi/calendar/v2/events?' . $query;

    $token = jhsv_token($tokenFile, false);
    $res   = jhsv_http('GET', $url, $token);
    if ($res['status'] === 401) {               // token revoked early: get a new one, retry once
        $token = jhsv_token($tokenFile, true);
        $res   = jhsv_http('GET', $url, $token);
    }
    if ($res['status'] !== 200) {
        throw new Exception('events HTTP ' . $res['status']);
    }

    $data = json_decode($res['body'], true);
    if (!is_array($data) || !isset($data['data']) || !is_array($data['data'])) {
        throw new Exception('events: unexpected response shape');
    }

    // Index included Location records by id.
    $locations = array();
    if (!empty($data['included']) && is_array($data['included'])) {
        foreach ($data['included'] as $inc) {
            if (isset($inc['type'], $inc['id']) && $inc['type'] === 'Location') {
                $locations[$inc['id']] = isset($inc['attributes']) ? $inc['attributes'] : array();
            }
        }
    }

    $out = array();
    foreach ($data['data'] as $item) {
        $a = isset($item['attributes']) ? $item['attributes'] : array();
        if (!empty($a['canceled_at']) || empty($a['starts_at']) || empty($a['name'])) {
            continue;
        }

        $loc = null;
        $locId = isset($item['relationships']['location']['data']['id'])
            ? $item['relationships']['location']['data']['id'] : null;
        if ($locId !== null && isset($locations[$locId])) {
            $l = $locations[$locId];
            $loc = array(
                'name'    => jhsv_str($l, 'name'),
                'address' => jhsv_str($l, 'full_formatted_address'),
            );
        }

        $image = jhsv_str($a, 'image_url');
        if (strpos($image, IMAGE_PREFIX) !== 0) { $image = ''; }

        $link = jhsv_str($a, 'public_url');
        if (strpos($link, LINK_PREFIX) !== 0) {
            $path = jhsv_str($a, 'show_page_path');
            $link = ($path !== '' && $path[0] === '/') ? CC_BASE . $path : '';
        }

        $out[] = array(
            'id'          => (string) (isset($item['id']) ? $item['id'] : ''),
            'title'       => trim(jhsv_str($a, 'name')),
            'description' => jhsv_plain_text(jhsv_str($a, 'description')),
            'start'       => jhsv_str($a, 'starts_at'),
            'end'         => jhsv_str($a, 'ends_at') !== '' ? jhsv_str($a, 'ends_at') : jhsv_str($a, 'starts_at'),
            'allDay'      => !empty($a['all_day_event']),
            'multiDay'    => !empty($a['multi_day_event']),
            'recurring'   => !empty($a['recurring']),
            'recurrence'  => jhsv_str($a, 'recurrence_description'),
            'featured'    => !empty($a['featured']),
            'image'       => $image,
            'url'         => $link,
            'location'    => $loc,
        );
        if (count($out) >= MAX_EVENTS) { break; }
    }
    return $out;
}

/** Anonymous Church Center token, reused until 5 minutes before it expires. */
function jhsv_token($tokenFile, $forceNew)
{
    if (!$forceNew) {
        $t = jhsv_read_json($tokenFile);
        if ($t && !empty($t['token']) && isset($t['expires']) && $t['expires'] - 300 > time()) {
            return $t['token'];
        }
    }
    $res = jhsv_http('POST', CC_BASE . '/sessions/tokens', null);
    if ($res['status'] !== 200) {
        throw new Exception('token HTTP ' . $res['status']);
    }
    $data  = json_decode($res['body'], true);
    $token = isset($data['data']['attributes']['token']) ? $data['data']['attributes']['token'] : '';
    if ($token === '' || !preg_match('/^[A-Za-z0-9_\-]{10,200}$/', $token)) {
        throw new Exception('token: missing or malformed in response');
    }
    $exp = isset($data['data']['attributes']['expires_at'])
        ? strtotime($data['data']['attributes']['expires_at']) : false;
    jhsv_write_json($tokenFile, array(
        'token'   => $token,
        'expires' => $exp ? $exp : time() + 3600,
    ));
    return $token;
}

/** HTTPS request to Church Center only. $url is always built from CC_BASE. */
function jhsv_http($method, $url, $bearer)
{
    if (strpos($url, CC_BASE . '/') !== 0) {
        throw new Exception('http: refusing non-Church Center URL');
    }
    $headers = array(
        'Accept: application/json',
        'User-Agent: rccgjhsv.org events widget',
    );
    if ($bearer !== null) {
        $headers[] = 'Authorization: Bearer ' . $bearer;
        $headers[] = 'X-PCO-API-Version: ' . CC_API_VER;
    }

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        $opts = array(
            CURLOPT_CUSTOMREQUEST  => $method,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_CONNECTTIMEOUT => HTTP_TIMEOUT,
            CURLOPT_TIMEOUT        => HTTP_TIMEOUT,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        );
        if (defined('CURLOPT_PROTOCOLS')) { $opts[CURLOPT_PROTOCOLS] = CURLPROTO_HTTPS; }
        curl_setopt_array($ch, $opts);
        if ($method === 'POST') { curl_setopt($ch, CURLOPT_POSTFIELDS, ''); }
        $body   = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err    = curl_error($ch);
        curl_close($ch);
        if ($body === false) { throw new Exception('curl: ' . $err); }
    } else {
        $ctx = stream_context_create(array(
            'http' => array(
                'method'          => $method,
                'header'          => implode("\r\n", $headers) . ($method === 'POST' ? "\r\nContent-Length: 0" : ''),
                'timeout'         => HTTP_TIMEOUT,
                'ignore_errors'   => true,
                'follow_location' => 0,
            ),
            'ssl' => array('verify_peer' => true, 'verify_peer_name' => true),
        ));
        $body = @file_get_contents($url, false, $ctx, 0, MAX_BODY + 1);
        if ($body === false) { throw new Exception('http: request failed'); }
        $status = 0;
        if (isset($http_response_header[0]) && preg_match('#\s(\d{3})\s#', $http_response_header[0] . ' ', $m)) {
            $status = (int) $m[1];
        }
    }

    if (strlen($body) > MAX_BODY) {
        throw new Exception('http: response too large');
    }
    return array('status' => $status, 'body' => $body);
}

/** Writable cache folder: api/cache/ if possible, else a private temp folder. */
function jhsv_cache_dir()
{
    $dir = __DIR__ . '/cache';
    if ((is_dir($dir) || @mkdir($dir, 0700, true)) && is_writable($dir)) {
        return $dir;
    }
    $tmp = rtrim(sys_get_temp_dir(), '/\\') . '/rccgjhsv-events-' . substr(hash('sha256', __DIR__), 0, 12);
    if (!is_dir($tmp)) { @mkdir($tmp, 0700, true); }
    return $tmp;
}

function jhsv_is_fresh($cached)
{
    return $cached && isset($cached['fetched_at'], $cached['events'])
        && (time() - (int) $cached['fetched_at']) < CACHE_TTL;
}

function jhsv_read_json($file)
{
    if (!is_file($file)) { return null; }
    $raw = @file_get_contents($file, false, null, 0, MAX_BODY);
    $val = $raw === false ? null : json_decode($raw, true);
    return is_array($val) ? $val : null;
}

function jhsv_write_json($file, $value)
{
    $tmp = $file . '.' . getmypid() . '.tmp';
    if (@file_put_contents($tmp, json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)) !== false) {
        @rename($tmp, $file);
    } else {
        @unlink($tmp);
    }
}

function jhsv_send($payload, $stale)
{
    $payload['stale'] = (bool) $stale;
    // Browsers may reuse a response for 5 minutes ("private": not shared caches).
    header('Cache-Control: private, max-age=' . ($stale ? 60 : 300));
    header('Vary: Origin, Sec-Fetch-Site');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function jhsv_fail($status, $code, $retryAfter = 0)
{
    http_response_code($status);
    header('Cache-Control: no-store');
    if ($retryAfter) { header('Retry-After: ' . $retryAfter); }
    echo json_encode(array('source' => 'church-center', 'events' => array(), 'error' => $code));
    exit;
}

function jhsv_unlock($lock)
{
    if ($lock) { @flock($lock, LOCK_UN); @fclose($lock); }
}

function jhsv_str($arr, $key)
{
    return (isset($arr[$key]) && is_scalar($arr[$key])) ? (string) $arr[$key] : '';
}

function jhsv_plain_text($html)
{
    if ($html === '') { return ''; }
    $text = html_entity_decode(strip_tags(preg_replace('#<(br|/p|/div|/li)\b[^>]*>#i', ' ', $html)), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    return trim(preg_replace('/\s+/u', ' ', $text));
}
