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
 * If Church Center is unreachable, the last good copy is served (marked
 * "stale": true) so the site keeps showing events.
 *
 * Requirements: PHP 7.0+ with either the curl extension or
 * allow_url_fopen enabled (standard on InterServer shared hosting).
 */

// ---- Settings -------------------------------------------------------
const CC_BASE      = 'https://rccgjhsv.churchcenter.com';
const CC_API_VER   = '2020-06-16';
const CACHE_TTL    = 900;   // seconds between Church Center refreshes (15 min)
const MAX_EVENTS   = 12;    // the pages show at most 3 (home) / 6 (events)
const HTTP_TIMEOUT = 8;     // seconds per request to Church Center

// Only these hosts are passed through to the browser.
const IMAGE_PREFIX = 'https://images.planningcenterusercontent.com/';
const LINK_PREFIX  = CC_BASE . '/';

// ---- Response headers -----------------------------------------------
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex');

$method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';
if ($method !== 'GET' && $method !== 'HEAD') {
    http_response_code(405);
    header('Allow: GET, HEAD');
    echo '{"error":"method_not_allowed"}';
    exit;
}

$cacheDir   = jhsv_cache_dir();
$cacheFile  = $cacheDir . '/events.json';
$tokenFile  = $cacheDir . '/token.json';
$lockFile   = $cacheDir . '/refresh.lock';

// 1. Fresh cache? Serve it.
$cached = jhsv_read_json($cacheFile);
if ($cached && isset($cached['fetched_at']) && (time() - $cached['fetched_at']) < CACHE_TTL) {
    jhsv_send($cached, false);
}

// 2. Refresh, one request at a time (others wait for the lock, then
//    re-read the cache the first request just wrote).
$lock = @fopen($lockFile, 'c');
if ($lock) { @flock($lock, LOCK_EX); }

$cached = jhsv_read_json($cacheFile);
if ($cached && isset($cached['fetched_at']) && (time() - $cached['fetched_at']) < CACHE_TTL) {
    jhsv_unlock($lock);
    jhsv_send($cached, false);
}

try {
    $events  = jhsv_fetch_events($tokenFile);
    $payload = array(
        'source'     => 'church-center',
        'fetched_at' => time(),
        'events'     => $events,
    );
    jhsv_write_json($cacheFile, $payload);
    jhsv_unlock($lock);
    jhsv_send($payload, false);
} catch (Exception $e) {
    jhsv_unlock($lock);
    error_log('[api/events.php] Church Center fetch failed: ' . $e->getMessage());
    if ($cached && isset($cached['events'])) {
        jhsv_send($cached, true);   // last good copy beats an empty grid
    }
    http_response_code(502);
    header('Cache-Control: no-store');
    echo '{"source":"church-center","events":[],"error":"unavailable"}';
    exit;
}

// =====================================================================

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
    if ($token === '') {
        throw new Exception('token: missing in response');
    }
    $exp = isset($data['data']['attributes']['expires_at'])
        ? strtotime($data['data']['attributes']['expires_at']) : false;
    jhsv_write_json($tokenFile, array(
        'token'   => $token,
        'expires' => $exp ? $exp : time() + 3600,
    ));
    return $token;
}

function jhsv_http($method, $url, $bearer)
{
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
        curl_setopt_array($ch, array(
            CURLOPT_CUSTOMREQUEST  => $method,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_CONNECTTIMEOUT => HTTP_TIMEOUT,
            CURLOPT_TIMEOUT        => HTTP_TIMEOUT,
        ));
        if ($method === 'POST') { curl_setopt($ch, CURLOPT_POSTFIELDS, ''); }
        $body   = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err    = curl_error($ch);
        curl_close($ch);
        if ($body === false) { throw new Exception('curl: ' . $err); }
        return array('status' => $status, 'body' => $body);
    }

    $ctx = stream_context_create(array('http' => array(
        'method'        => $method,
        'header'        => implode("\r\n", $headers) . ($method === 'POST' ? "\r\nContent-Length: 0" : ''),
        'timeout'       => HTTP_TIMEOUT,
        'ignore_errors' => true,
        'follow_location' => 0,
    )));
    $body = @file_get_contents($url, false, $ctx);
    if ($body === false) { throw new Exception('http: request failed'); }
    $status = 0;
    if (isset($http_response_header[0]) && preg_match('#\s(\d{3})\s#', $http_response_header[0] . ' ', $m)) {
        $status = (int) $m[1];
    }
    return array('status' => $status, 'body' => $body);
}

/** Writable cache folder: api/cache/ if possible, else the system temp dir. */
function jhsv_cache_dir()
{
    $dir = __DIR__ . '/cache';
    if ((is_dir($dir) || @mkdir($dir, 0755, true)) && is_writable($dir)) {
        return $dir;
    }
    $tmp = rtrim(sys_get_temp_dir(), '/\\') . '/rccgjhsv-events';
    if (!is_dir($tmp)) { @mkdir($tmp, 0700, true); }
    return $tmp;
}

function jhsv_read_json($file)
{
    if (!is_file($file)) { return null; }
    $raw = @file_get_contents($file);
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
    // Browsers / proxies may reuse a response for 5 minutes.
    header('Cache-Control: public, max-age=' . ($stale ? 60 : 300));
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
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
