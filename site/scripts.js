/* RCCG JHSV — shared site behaviors.
   Loads <header>/<footer> partials first, then initializes UI.
   Edit site/partials/header.html or footer.html once and every page
   updates automatically — no per-page duplication. */

(async function () {

  // ---- 1. Include partials referenced via <div data-include="..."> ----
  await includeAll();

  // ---- 2. Mark active nav link from <body data-page="..."> ----
  setActiveNav();

  // ---- 3. Wire up everything else (mobile nav, magnetic, reveal, etc.) ----
  initUI();

  // ============================================================
  //                         FUNCTIONS
  // ============================================================

  async function includeAll() {
    var nodes = document.querySelectorAll('[data-include]');
    if (!nodes.length) return;
    await Promise.all(Array.prototype.map.call(nodes, async function (el) {
      var url = el.getAttribute('data-include');
      try {
        var res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var html = await res.text();
        var tmp = document.createElement('div');
        tmp.innerHTML = html.trim();
        var inserted = tmp.firstElementChild;
        if (inserted) el.replaceWith(inserted);
      } catch (e) {
        console.error('Failed to load partial:', url, e);
      }
    }));
  }

  function setActiveNav() {
    var page = document.body.dataset.page;
    if (!page) return;
    document.querySelectorAll('[data-page="' + page + '"]').forEach(function (a) {
      a.classList.add('active');
    });
  }

  function initUI() {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---- Dynamic copyright year ----
    var year = new Date().getFullYear();
    document.querySelectorAll('[data-current-year]').forEach(function (el) {
      el.textContent = year;
    });

    // ---- Mobile nav toggle ----
    var topbar = document.querySelector('.topbar');
    var menuBtn = document.querySelector('.topbar .menu-btn');
    if (menuBtn && topbar) {
      menuBtn.addEventListener('click', function () {
        topbar.classList.toggle('menu-open');
        menuBtn.setAttribute(
          'aria-expanded',
          topbar.classList.contains('menu-open') ? 'true' : 'false'
        );
      });
      topbar.querySelectorAll('nav a').forEach(function (a) {
        a.addEventListener('click', function () {
          topbar.classList.remove('menu-open');
        });
      });
    }

    // ---- Spotlight border cards ----
    document.querySelectorAll('.spot-grid').forEach(function (grid) {
      grid.addEventListener('mousemove', function (e) {
        grid.querySelectorAll('.spot-card').forEach(function (card) {
          var r = card.getBoundingClientRect();
          card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
          card.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
      });
    });

    // ---- Magnetic buttons ----
    if (!reduceMotion) {
      document.querySelectorAll('[data-magnetic]').forEach(function (btn) {
        var strength = 0.25;
        btn.addEventListener('mousemove', function (e) {
          var r = btn.getBoundingClientRect();
          var cx = r.left + r.width / 2;
          var cy = r.top + r.height / 2;
          var dx = (e.clientX - cx) * strength;
          var dy = (e.clientY - cy) * strength;
          btn.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        });
        btn.addEventListener('mouseleave', function () {
          btn.style.transform = 'translate(0,0)';
        });
      });
    }

    // ---- Scroll reveal ----
    var revealEls = document.querySelectorAll('.reveal');
    if (revealEls.length && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    }

    // ---- Sticky stack ----
    // Picks the card whose vertical center is closest to a tracking line
    // 42% down the viewport. Recomputed on scroll/resize. This avoids the
    // intersection-threshold flakiness where multiple cards could be
    // partially visible and the "winner" depended on entry order.
    var stack = document.querySelector('[data-stack]');
    if (stack) {
      var cards = Array.prototype.slice.call(stack.querySelectorAll('.stack-card'));
      var states = stack.querySelectorAll('.stack-state');
      var activeFeature = null;
      function activate(num) {
        if (num === activeFeature) return;
        activeFeature = num;
        cards.forEach(function (c) {
          c.classList.toggle('active', c.dataset.feature === num);
        });
        states.forEach(function (s) {
          s.classList.toggle('active', s.dataset.state === num);
        });
      }
      function pickActive() {
        var trackY = window.innerHeight * 0.42;
        var best = null, bestDist = Infinity;
        cards.forEach(function (c) {
          var rect = c.getBoundingClientRect();
          // Skip cards completely off-screen
          if (rect.bottom < 0 || rect.top > window.innerHeight) return;
          var cardCenter = rect.top + rect.height / 2;
          var dist = Math.abs(cardCenter - trackY);
          if (dist < bestDist) {
            bestDist = dist;
            best = c.dataset.feature;
          }
        });
        if (best) activate(best);
      }
      var stackTicking = false;
      function onStackScroll() {
        if (stackTicking) return;
        stackTicking = true;
        window.requestAnimationFrame(function () {
          pickActive();
          stackTicking = false;
        });
      }
      window.addEventListener('scroll', onStackScroll, { passive: true });
      window.addEventListener('resize', pickActive);
      pickActive();
    }

    // ---- Newsletter / form stub ----
    document.querySelectorAll('form[data-stub]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var note = form.querySelector('[data-stub-msg]');
        if (note) {
          note.textContent = 'Thanks — this form is a draft. We\'ll wire it up next.';
          note.style.display = 'block';
        }
      });
    });

    // ---- Ministries grid + morphing modal (About page) ----
    var ministryOverlay = document.getElementById('ministryOverlay');
    if (ministryOverlay) {
      var ministries = {
        ops: {
          name: 'Church Operations & Administration',
          blurb: 'Day-to-day coordination so every Sunday runs without a hitch.',
          depts: [
            { name: 'Service Coordination', lead: 'Bunmi O.' },
            { name: 'Church Project & Building', lead: 'Dami B.' },
            { name: 'Finance Department', lead: null },
            { name: 'Digital Operations', lead: null }
          ]
        },
        hospitality: {
          name: 'Hospitality',
          blurb: 'From the parking lot to the foyer, a welcome that lands.',
          depts: [
            { name: 'Guest Experience', lead: 'Titilope, Chinonso F. & Dayo O.' },
            { name: 'Security & Safety', lead: 'Dayo O.' },
            { name: 'Transportation & Logistics', lead: 'Dishon' },
            { name: 'Sanctuary Keepers', lead: 'Dr. Claire O.' },
            { name: 'Welfare', lead: 'Dupe F.' }
          ]
        },
        events: {
          name: 'Events & Outreaches',
          blurb: 'Conferences, picnics, and the work that takes the gospel beyond our walls.',
          depts: [
            { name: 'Special Events Planning', lead: 'Dami B.' },
            { name: 'Community Outreach & Evangelism', lead: 'Dupe F.' },
            { name: 'Community Development & Engagement', lead: 'Chioma A.' }
          ]
        },
        worship: {
          name: 'Music & Worship',
          blurb: 'The sound of Sunday: choir, band, and worship arts.',
          depts: [
            { name: 'Choir', lead: 'Dr. Nina B.' },
            { name: 'Instrumentalists', lead: null }
          ]
        },
        community: {
          name: 'Community Life & Connections',
          blurb: 'Men, women, youth, teens, kids — the spaces where the family grows.',
          depts: [
            { name: "Men's Ministry", lead: 'Tunde O.' },
            { name: "Women's Ministry", lead: 'Pst. Yemisi A.' },
            { name: 'Youth & Young Adult Ministry', lead: 'Boris T.' },
            { name: 'Youth Training & Mentorship', lead: 'Dami & Kathleen B.' },
            { name: 'Teen Ministry', lead: 'Toun O.' },
            { name: 'Children Ministry', lead: 'Chioma A.' },
            { name: 'New Members Engagement & Integration', lead: null }
          ]
        },
        growth: {
          name: 'Ministry & Spiritual Growth',
          blurb: 'Discipleship, training, and the long obedience of growing in faith.',
          depts: [
            { name: 'Ministers Welfare', lead: 'Paul A.' },
            { name: 'Workers Training', lead: 'Paul A.' },
            { name: 'Discipleship & Bible Study', lead: 'Paul A.' },
            { name: 'Baptism Coordination', lead: null },
            { name: 'Prayer Ministry & Sunday School', lead: 'Tobi A.' }
          ]
        },
        media: {
          name: 'Media & Communications',
          blurb: 'Livestream, photography, social — extending Sunday into the week.',
          depts: [
            { name: 'Media Technical', lead: 'Dr. Obi A.' },
            { name: 'Photography & Videography', lead: null },
            { name: 'Media Outreach', lead: 'Ruth O.' }
          ]
        }
      };

      var detailName = document.getElementById('ministryName');
      var detailBlurb = document.getElementById('ministryBlurb');
      var detailDepts = document.getElementById('ministryDepts');
      var detailContact = document.getElementById('ministryContact');
      var lastFocused = null;

      function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, function (c) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
      }

      function openMinistry(key) {
        var m = ministries[key];
        if (!m) return;
        lastFocused = document.activeElement;
        detailName.textContent = m.name;
        detailBlurb.textContent = m.blurb;
        detailDepts.innerHTML = m.depts.map(function (d) {
          var leadHtml = d.lead
            ? '<span class="dept-lead">' + escapeHtml(d.lead) + '</span>'
            : '';
          return '<li><span class="dept-name">' + escapeHtml(d.name) + '</span>' + leadHtml + '</li>';
        }).join('');
        if (detailContact) {
          detailContact.href = 'mailto:rccgjhsv2013@gmail.com'
            + '?subject=' + encodeURIComponent('Ministry inquiry: ' + m.name);
        }
        ministryOverlay.hidden = false;
        ministryOverlay.classList.add('open');
        // force reflow before adding visible so the transition runs
        void ministryOverlay.offsetHeight;
        ministryOverlay.classList.add('visible');
        document.body.style.overflow = 'hidden';
        var closeBtn = ministryOverlay.querySelector('.ministry-close');
        if (closeBtn) closeBtn.focus();
      }

      function closeMinistry() {
        ministryOverlay.classList.remove('visible');
        document.body.style.overflow = '';
        setTimeout(function () {
          ministryOverlay.classList.remove('open');
          ministryOverlay.hidden = true;
          if (lastFocused && typeof lastFocused.focus === 'function') {
            lastFocused.focus();
          }
        }, 350);
      }

      document.querySelectorAll('[data-ministry]').forEach(function (card) {
        card.addEventListener('click', function () {
          openMinistry(card.dataset.ministry);
        });
      });
      document.querySelectorAll('[data-close-ministry]').forEach(function (btn) {
        btn.addEventListener('click', closeMinistry);
      });
      ministryOverlay.addEventListener('click', function (e) {
        if (e.target === ministryOverlay) closeMinistry();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && ministryOverlay.classList.contains('open')) {
          closeMinistry();
        }
      });
    }

    // ---- YouTube channel hydrate (Live page) ----
    // One fetch of the channel's public RSS feeds the player AND the
    // Recent Broadcasts grid. The first entry powers the player iframe
    // (when the channel goes live, that entry IS the live stream, so
    // it shows the live broadcast natively; when offline, it shows the
    // most recent stream as a fallback rather than YouTube's "stream
    // offline" error page). The top 3 entries fill the broadcasts grid.
    //
    // The RSS endpoint ships no CORS headers, so we tunnel through a
    // public proxy. Two are tried in order so a single proxy outage
    // doesn't leave the page stuck on placeholders. Result is cached
    // in localStorage for 1 hour.
    var livePlayer = document.querySelector('.live-player[data-yt-channel]');
    var broadcastGrid = document.getElementById('broadcastGrid');
    var ytChannelId =
        (livePlayer && livePlayer.dataset.ytChannel) ||
        (broadcastGrid && broadcastGrid.dataset.ytChannel) || '';

    if (ytChannelId && /^UC[A-Za-z0-9_-]{22}$/.test(ytChannelId)) {
      hydrateChannel(ytChannelId, livePlayer, broadcastGrid);
    }

    function hydrateChannel(channelId, player, grid) {
      var cacheKey = 'jhsv_yt_v2_' + channelId;
      var cacheTtl = 60 * 60 * 1000; // 1 hour
      var rssUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + channelId;
      var proxies = [
        function (u) { return 'https://corsproxy.io/?' + encodeURIComponent(u); },
        function (u) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u); }
      ];

      // Try fresh cache first.
      var fresh = readChannelCache(cacheKey, cacheTtl);
      if (fresh) {
        applyChannelData(player, grid, fresh);
        return;
      }

      tryProxies(proxies, rssUrl, 0)
        .then(function (xml) {
          var videos = parseYouTubeFeed(xml);
          if (!videos.length) throw new Error('Empty feed');
          var keep = videos.slice(0, 5);
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              fetchedAt: Date.now(),
              videos: keep
            }));
          } catch (e) { /* quota / private mode */ }
          applyChannelData(player, grid, keep);
        })
        .catch(function (err) {
          if (window.console && console.warn) {
            console.warn('JHSV: YouTube hydrate failed, keeping static fallback.', err);
          }
          var stale = readChannelCache(cacheKey, Infinity);
          if (stale) applyChannelData(player, grid, stale);
        });
    }

    function readChannelCache(key, ttl) {
      try {
        var raw = JSON.parse(localStorage.getItem(key) || 'null');
        if (raw && raw.videos && raw.videos.length
            && Date.now() - (raw.fetchedAt || 0) < ttl) {
          return raw.videos;
        }
      } catch (e) { /* ignore */ }
      return null;
    }

    function tryProxies(proxies, url, idx) {
      if (idx >= proxies.length) return Promise.reject(new Error('All proxies failed'));
      return fetch(proxies[idx](url), { cache: 'no-cache' })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.text();
        })
        .then(function (text) {
          if (!text || text.indexOf('<entry') === -1) {
            throw new Error('Invalid RSS payload');
          }
          return text;
        })
        .catch(function () { return tryProxies(proxies, url, idx + 1); });
    }

    function applyChannelData(player, grid, videos) {
      if (player && videos[0]) renderLivePlayer(player, videos[0]);
      if (grid) renderBroadcasts(grid, videos.slice(0, 3));
    }

    function renderLivePlayer(player, latest) {
      var iframe = document.createElement('iframe');
      // Embed the latest video by ID. When the channel is currently
      // live, that ID is the live stream and YouTube shows the LIVE
      // badge in the player. When offline, the most recent past stream
      // plays in its place — no error state.
      iframe.src = 'https://www.youtube.com/embed/'
        + encodeURIComponent(latest.id)
        + '?rel=0&modestbranding=1';
      iframe.title = latest.title || 'Latest broadcast from Jesus House SV';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.setAttribute('allowfullscreen', '');
      player.innerHTML = '';
      player.appendChild(iframe);
    }

    function parseYouTubeFeed(xml) {
      var doc = new DOMParser().parseFromString(xml, 'text/xml');
      var entries = doc.getElementsByTagName('entry');
      var ytNs = 'http://www.youtube.com/xml/schemas/2015';
      var out = [];
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        var idEls = entry.getElementsByTagNameNS(ytNs, 'videoId');
        var videoId = idEls.length ? (idEls[0].textContent || '').trim() : '';
        if (!videoId) continue;
        var titleEl = entry.getElementsByTagName('title')[0];
        var publishedEl = entry.getElementsByTagName('published')[0];
        out.push({
          id: videoId,
          title: titleEl ? (titleEl.textContent || '').trim() : 'Untitled',
          published: publishedEl ? (publishedEl.textContent || '').trim() : '',
          thumbnail: 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg',
          url: 'https://www.youtube.com/watch?v=' + videoId
        });
      }
      return out;
    }

    function formatBroadcastDate(iso) {
      if (!iso) return '';
      var d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      var months = ['Jan','Feb','Mar','Apr','May','Jun',
                    'Jul','Aug','Sep','Oct','Nov','Dec'];
      return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
    }

    function renderBroadcasts(grid, videos) {
      function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;',
                   '"': '&quot;', "'": '&#39;' }[c];
        });
      }
      grid.innerHTML = videos.map(function (v) {
        return ''
          + '<a class="broadcast-card" href="' + esc(v.url) + '"'
          + ' target="_blank" rel="noopener">'
          +   '<div class="broadcast-thumb">'
          +     '<img src="' + esc(v.thumbnail) + '"'
          +     ' alt="' + esc(v.title) + '" loading="lazy" />'
          +     '<span class="broadcast-play" aria-hidden="true">'
          +       '<svg viewBox="0 0 24 24" fill="currentColor">'
          +       '<path d="M8 5v14l11-7z"/></svg>'
          +     '</span>'
          +   '</div>'
          +   '<div class="broadcast-meta">'
          +     '<h3>' + esc(v.title) + '</h3>'
          +     '<p>' + esc(formatBroadcastDate(v.published)) + '</p>'
          +   '</div>'
          + '</a>';
      }).join('');
    }

    // ---- Add-to-calendar popovers (Live page schedule cards) ----
    var calToggles = document.querySelectorAll('[data-cal-toggle]');
    if (calToggles.length) {
      var closeAllCal = function () {
        document.querySelectorAll('[data-cal-menu]').forEach(function (m) {
          m.hidden = true;
        });
        document.querySelectorAll('[data-cal-toggle]').forEach(function (b) {
          b.setAttribute('aria-expanded', 'false');
        });
      };
      calToggles.forEach(function (btn) {
        var menu = btn.parentElement.querySelector('[data-cal-menu]');
        if (!menu) return;
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var willOpen = menu.hidden;
          closeAllCal();
          if (willOpen) {
            menu.hidden = false;
            btn.setAttribute('aria-expanded', 'true');
          }
        });
      });
      document.addEventListener('click', function (e) {
        if (!e.target.closest('.cal-add')) closeAllCal();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeAllCal();
      });
    }

    // ---- Measure topbar height so the home hero can extend up under it ----
    var topbarEl = document.querySelector('.topbar');
    if (topbarEl) {
      var setTopbarHeight = function () {
        var h = topbarEl.offsetHeight;
        if (h) document.documentElement.style.setProperty('--topbar-height', h + 'px');
      };
      setTopbarHeight();
      window.addEventListener('resize', setTopbarHeight);
      // Re-measure once images / fonts settle
      window.addEventListener('load', setTopbarHeight);
    }

    // ---- Transparent topbar over the home hero ----
    var topbar = document.querySelector('.topbar');
    var heroV2 = document.querySelector('.hero.hero-v2');
    if (topbar && heroV2 && document.body.dataset.page === 'home') {
      var updateTopbar = function () {
        if (window.innerWidth <= 920) {
          topbar.classList.remove('over-hero');
          return;
        }
        var heroBottom = heroV2.offsetTop + heroV2.offsetHeight;
        var threshold = heroBottom - topbar.offsetHeight - 40;
        if (window.scrollY < threshold) {
          topbar.classList.add('over-hero');
        } else {
          topbar.classList.remove('over-hero');
        }
      };
      updateTopbar();
      window.addEventListener('scroll', updateTopbar, { passive: true });
      window.addEventListener('resize', updateTopbar);
    }

    // ---- Family ministries tabs (used on /new for Kids / Teens) ----
    initFamilyTabs();

    // ---- Live Google Calendar feed (used on /events) ----
    initEventsPage();
  }

  // ---------------------------------------------------------------------
  // Tab switcher for the static Kids / Teens modules on /new.
  // Click a .ss-tab to swap which .ss-panel is visible.
  // ---------------------------------------------------------------------
  function initFamilyTabs() {
    var tabs = document.querySelectorAll('.ss-tab');
    var panels = document.querySelectorAll('.ss-panel');
    if (!tabs.length || !panels.length) return;

    function activate(name) {
      tabs.forEach(function (t) {
        var on = t.dataset.panel === name;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panels.forEach(function (p) {
        var on = p.dataset.panel === name;
        p.classList.toggle('is-active', on);
        if (on) { p.removeAttribute('hidden'); }
        else    { p.setAttribute('hidden', ''); }
      });
    }

    tabs.forEach(function (t) {
      t.addEventListener('click', function () { activate(t.dataset.panel); });
    });
  }

  // ---------------------------------------------------------------------
  // /events — Upcoming section
  //
  // 1. Static fallback cards (data-event-* attrs in HTML) get an
  //    "Add to calendar" dropdown immediately so visitors can save any
  //    of them to Google / Outlook / Apple Calendar even if the live
  //    feed is missing or fails.
  // 2. If window.JHSV_CALENDAR.{id, apiKey} are both filled in, we hit
  //    the Google Calendar Data API v3, cache the result for 10 minutes
  //    in localStorage, and replace the grid with the live cards.
  //
  // Failures (no config / network error / quota) are silent — the
  // static fallback stays on screen. See docs/PENDING.md for setup.
  // ---------------------------------------------------------------------
  function initEventsPage() {
    if (document.body.dataset.page !== 'events') return;
    var grid = document.getElementById('upcomingGrid');
    if (!grid) return;

    enhanceStaticEvents(grid);

    var cfg = window.JHSV_CALENDAR;
    if (!cfg || !cfg.id || !cfg.apiKey) return;

    fetchLiveEvents(cfg)
      .then(function (events) {
        if (events && events.length) renderLiveEvents(grid, events);
      })
      .catch(function (err) {
        // Static fallback already on screen — log and move on.
        if (window.console) console.warn('[events] calendar fetch failed; keeping static fallback:', err);
      });
  }

  function enhanceStaticEvents(grid) {
    var cards = grid.querySelectorAll('article.upcoming-event[data-event]');
    cards.forEach(function (card) {
      var ev = readEventFromCard(card);
      var body = card.querySelector('.event-body');
      if (body) body.insertAdjacentHTML('beforeend', renderAddToCalendar(ev));
    });
    bindCalendarToggles(grid);
  }

  function readEventFromCard(card) {
    return {
      title:       card.dataset.eventTitle || '',
      description: card.dataset.eventDesc || '',
      start:       card.dataset.eventStart || '',
      end:         card.dataset.eventEnd || '',
      location:    card.dataset.eventLocation || '',
      isAllDay:    false
    };
  }

  function fetchLiveEvents(cfg) {
    var cacheKey = 'jhsv_cal_v1_' + cfg.id;
    var cached = readCache(cacheKey, 10 * 60 * 1000);
    if (cached) return Promise.resolve(cached);

    var max = cfg.maxResults || 4;
    // Pull a wider window from the API so we have headroom after filtering
    // out recurring weekly services (Sunday Service, Wednesday Bible Study,
    // etc.). Special one-off events float to the top by date order.
    var serverMax = Math.max(25, max * 6);

    var url = 'https://www.googleapis.com/calendar/v3/calendars/' +
      encodeURIComponent(cfg.id) + '/events' +
      '?key=' + encodeURIComponent(cfg.apiKey) +
      '&timeMin=' + encodeURIComponent(new Date().toISOString()) +
      '&maxResults=' + serverMax +
      '&singleEvents=true&orderBy=startTime';

    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        // Drop instances of recurring events. Each instance carries a
        // recurringEventId pointing back to its parent series; one-off
        // events don't. See docs/PENDING.md "Live Google Calendar feed"
        // for the long-term plan to use a separate special-events calendar
        // and remove this filter.
        var oneOffs = (data.items || []).filter(function (ev) {
          return !ev.recurringEventId;
        });
        var events = oneOffs.slice(0, max).map(normalizeApiEvent);
        writeCache(cacheKey, events);
        return events;
      });
  }

  function normalizeApiEvent(ev) {
    return {
      title:       ev.summary || 'Event',
      description: stripHtml(ev.description || ''),
      start:       ev.start.dateTime || ev.start.date,
      end:         ev.end.dateTime || ev.end.date,
      location:    ev.location || '',
      isAllDay:    !ev.start.dateTime
    };
  }

  function renderLiveEvents(grid, events) {
    grid.innerHTML = events.map(renderEventCard).join('');
    bindCalendarToggles(grid);
    grid.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  // Parse a YYYY-MM-DD all-day date as local-noon (avoids the
  // common UTC-midnight-then-shift-back-a-day display bug).
  function parseLocalDate(dateStr) {
    var p = String(dateStr).split('-');
    return new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0, 0);
  }

  function renderEventCard(ev) {
    var TZ = 'America/Los_Angeles';
    var month, day, meta;

    if (ev.isAllDay) {
      var d = parseLocalDate(ev.start);
      month = d.toLocaleString('en-US', { month: 'short' });
      day   = String(d.getDate());
      meta  = d.toLocaleString('en-US', { weekday: 'long' }) + ' · All day';
    } else {
      var start = new Date(ev.start);
      var end   = new Date(ev.end);
      month = start.toLocaleString('en-US', { month: 'short',  timeZone: TZ });
      day   = start.toLocaleString('en-US', { day:   'numeric', timeZone: TZ });
      var t = function (x) {
        return x.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: TZ });
      };
      meta = start.toLocaleString('en-US', { weekday: 'long', timeZone: TZ }) + ' · ' + t(start) + ' to ' + t(end);
    }

    return [
      '<article class="upcoming-event reveal in">',
        '<div class="event-date" aria-hidden="true">',
          '<div class="month">', escHtml(month), '</div>',
          '<div class="day">', escHtml(day), '</div>',
        '</div>',
        '<div class="event-body">',
          '<div class="event-meta">', escHtml(meta), '</div>',
          '<h3>', escHtml(ev.title), '</h3>',
          '<p>', escHtml(truncate(ev.description, 200)), '</p>',
          renderAddToCalendar(ev),
        '</div>',
      '</article>'
    ].join('');
  }

  function renderAddToCalendar(ev) {
    var title = ev.title || 'Event';
    var desc  = ev.description || '';
    var loc   = ev.location || '';

    var gDates, oStart, oEnd;
    if (ev.isAllDay) {
      // Google Calendar accepts YYYYMMDD/YYYYMMDD for all-day. Outlook
      // accepts plain YYYY-MM-DD for startdt/enddt with allday=true.
      gDates = String(ev.start).replace(/-/g, '') + '/' + String(ev.end).replace(/-/g, '');
      oStart = ev.start;
      oEnd   = ev.end;
    } else {
      var start = new Date(ev.start);
      var end   = new Date(ev.end);
      var fmtUtc = function (d) {
        return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
      };
      gDates = fmtUtc(start) + '/' + fmtUtc(end);
      oStart = start.toISOString();
      oEnd   = end.toISOString();
    }

    var gUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text='     + encodeURIComponent(title) +
      '&dates='    + gDates +
      '&details='  + encodeURIComponent(desc) +
      '&location=' + encodeURIComponent(loc);

    var oUrl = 'https://outlook.live.com/calendar/0/deeplink/compose' +
      '?path=%2Fcalendar%2Faction%2Fcompose' +
      '&rru=addevent' +
      '&subject='  + encodeURIComponent(title) +
      '&startdt='  + encodeURIComponent(oStart) +
      '&enddt='    + encodeURIComponent(oEnd) +
      '&location=' + encodeURIComponent(loc) +
      '&body='     + encodeURIComponent(desc) +
      (ev.isAllDay ? '&allday=true' : '');

    var icsHref = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(buildIcs(ev));
    var slug = (title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'event') + '.ics';

    return '<div class="cal-add">' +
      '<button class="cal-cta" type="button" data-cal-toggle aria-expanded="false" aria-haspopup="true">' +
        'Add to calendar' +
        '<svg class="cal-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>' +
      '</button>' +
      '<div class="cal-menu" data-cal-menu role="menu" hidden>' +
        '<a role="menuitem" target="_blank" rel="noopener" href="' + gUrl + '">Google Calendar</a>' +
        '<a role="menuitem" target="_blank" rel="noopener" href="' + oUrl + '">Outlook</a>' +
        '<a role="menuitem" href="' + icsHref + '" download="' + slug + '">Apple / iCal</a>' +
      '</div>' +
    '</div>';
  }

  function buildIcs(ev) {
    var fmtUtc = function (d) {
      var iso = d.toISOString();
      return iso.slice(0,4) + iso.slice(5,7) + iso.slice(8,10) + 'T' +
             iso.slice(11,13) + iso.slice(14,16) + iso.slice(17,19) + 'Z';
    };
    var esc = function (s) {
      return String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, '\\$&');
    };
    var uid = 'jhsv-' + Date.now() + '-' + Math.random().toString(36).slice(2,8) + '@jesushousesv.org';
    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Jesus House SV//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:' + uid,
      'DTSTAMP:' + fmtUtc(new Date())
    ];
    if (ev.isAllDay) {
      // RFC 5545 all-day form: VALUE=DATE with no time component.
      lines.push('DTSTART;VALUE=DATE:' + String(ev.start).replace(/-/g, ''));
      lines.push('DTEND;VALUE=DATE:'   + String(ev.end).replace(/-/g, ''));
    } else {
      lines.push('DTSTART:' + fmtUtc(new Date(ev.start)));
      lines.push('DTEND:'   + fmtUtc(new Date(ev.end)));
    }
    lines.push('SUMMARY:' + esc(ev.title || 'Event'));
    if (ev.description) lines.push('DESCRIPTION:' + esc(ev.description));
    if (ev.location)    lines.push('LOCATION:'    + esc(ev.location));
    lines.push('END:VEVENT', 'END:VCALENDAR');
    return lines.join('\r\n');
  }

  function bindCalendarToggles(scope) {
    var toggles = scope.querySelectorAll('[data-cal-toggle]');
    toggles.forEach(function (btn) {
      if (btn.dataset.calBound === '1') return;
      btn.dataset.calBound = '1';
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var menu = btn.parentElement.querySelector('[data-cal-menu]');
        if (!menu) return;
        var willOpen = menu.hidden;
        document.querySelectorAll('[data-cal-menu]').forEach(function (m) { m.hidden = true; });
        document.querySelectorAll('[data-cal-toggle]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
        if (willOpen) {
          menu.hidden = false;
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // ---- Tiny helpers (scoped to this IIFE) ----
  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function stripHtml(s) {
    var div = document.createElement('div');
    div.innerHTML = s;
    return (div.textContent || '').replace(/\s+/g, ' ').trim();
  }
  function truncate(s, n) {
    s = String(s || '');
    if (s.length <= n) return s;
    return s.slice(0, n).replace(/\s+\S*$/, '') + '…';
  }
  function readCache(key, ttlMs) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return null;
      var entry = JSON.parse(raw);
      if (Date.now() - entry.t > ttlMs) return null;
      return entry.v;
    } catch (_) { return null; }
  }
  function writeCache(key, value) {
    try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), v: value })); } catch (_) {}
  }
})();
