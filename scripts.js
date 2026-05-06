(function () {
  setActiveNav();
  initUI();

  function setActiveNav() {
    var page = document.body.dataset.page;
    if (!page) return;
    document.querySelectorAll('[data-page="' + page + '"]').forEach(function (a) {
      a.classList.add('active');
    });
  }

  function initUI() {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var year = new Date().getFullYear();
    document.querySelectorAll('[data-current-year]').forEach(function (el) {
      el.textContent = year;
    });

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

    document.querySelectorAll('.spot-grid').forEach(function (grid) {
      var cards = grid.querySelectorAll('.spot-card');
      if (!cards.length) return;
      var rafQueued = false;
      var lastX = 0, lastY = 0;
      grid.addEventListener('mousemove', function (e) {
        lastX = e.clientX;
        lastY = e.clientY;
        if (rafQueued) return;
        rafQueued = true;
        window.requestAnimationFrame(function () {
          rafQueued = false;
          for (var i = 0; i < cards.length; i++) {
            var r = cards[i].getBoundingClientRect();
            cards[i].style.setProperty('--mx', (lastX - r.left) + 'px');
            cards[i].style.setProperty('--my', (lastY - r.top) + 'px');
          }
        });
      });
    });

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

    var stack = document.querySelector('[data-stack]');
    if (stack) {
      var stackCards = Array.prototype.slice.call(stack.querySelectorAll('.stack-card'));
      var states = stack.querySelectorAll('.stack-state');
      var activeFeature = null;
      function activate(num) {
        if (num === activeFeature) return;
        activeFeature = num;
        stackCards.forEach(function (c) {
          c.classList.toggle('active', c.dataset.feature === num);
        });
        states.forEach(function (s) {
          s.classList.toggle('active', s.dataset.state === num);
        });
      }
      function pickActive() {
        var trackY = window.innerHeight * 0.42;
        var best = null, bestDist = Infinity;
        stackCards.forEach(function (c) {
          var rect = c.getBoundingClientRect();
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

    document.querySelectorAll('form[data-stub]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var note = form.querySelector('[data-stub-msg]');
        if (note) {
          note.textContent = 'Thanks! Our online forms are being set up — please email info@rccgjhsv.org and we\'ll respond personally.';
          note.style.display = 'block';
        }
      });
    });

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
            { name: 'Digital Operations', lead: 'Excel A.' }
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
            { name: "Men's Ministries", lead: 'Tunde O.' },
            { name: "Women's Ministries", lead: 'Pst. Yemisi A.' },
            { name: 'Youth & Young Adult Ministry', lead: 'Boris T.' },
            { name: 'Youth Training & Mentorship', lead: 'Dami & Kathleen B.' },
            { name: 'Teen Ministry', lead: 'Toun O.' },
            { name: "Children's Ministry", lead: 'Chioma A.' },
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
          detailContact.href = 'mailto:info@rccgjhsv.org'
            + '?subject=' + encodeURIComponent('Ministry inquiry: ' + m.name);
        }
        ministryOverlay.hidden = false;
        ministryOverlay.classList.add('open');
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

    var bioOverlay = document.getElementById('bioOverlay');
    if (bioOverlay) {
      var pastors = {
        bayo: {
          name: 'Pastor Bayo Asogba',
          role: 'Lead Pastor',
          instagram: 'https://www.instagram.com/shepherdscarefound/',
          bio: [
            "Pastor Bayo Asogba is the Lead Pastor of RCCG Jesus House Silicon Valley. Together with his wife, Pastor Yemisi Asogba, he leads the church with a deep love for Scripture, a heart for discipleship, and a commitment to seeing every person grow into the fullness of who God has called them to be.",
            "His teaching is rooted in the Word, practical for everyday life, and aimed at lifting believers into a deeper walk with Christ. Beyond Sunday, he serves the wider Body through Shepherds Care Foundation, supporting Pastors and Church Leaders in seasons of crisis."
          ]
        },
        yemisi: {
          name: 'Pastor Yemisi Asogba',
          role: 'Director of Women & Ministry',
          instagram: 'https://www.instagram.com/yemisi_essential/',
          bio: [
            "Pastor Yemisi Asogba serves as Director of Women & Ministry at Jesus House Silicon Valley. Alongside her husband, Pastor Bayo, she shepherds the church family with warmth, prayer, and a steady focus on raising women who walk in their God-given identity.",
            "She leads the Women's Ministry, mentors leaders across the church, and pours into the next generation through teaching, intercession, and personal discipleship. Her ministry centers on helping people encounter God's presence in a way that transforms their everyday lives."
          ]
        }
      };

      var bioName = document.getElementById('bioName');
      var bioRole = document.getElementById('bioRole');
      var bioBody = document.getElementById('bioBody');
      var bioInstagram = document.getElementById('bioInstagram');
      var lastBioFocus = null;

      function escapeBio(str) {
        return String(str).replace(/[&<>"']/g, function (c) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
      }

      function openBio(key) {
        var p = pastors[key];
        if (!p) return;
        lastBioFocus = document.activeElement;
        bioName.textContent = p.name;
        bioRole.textContent = p.role;
        bioBody.innerHTML = p.bio.map(function (para) {
          return '<p>' + escapeBio(para) + '</p>';
        }).join('');
        bioInstagram.href = p.instagram;
        bioOverlay.hidden = false;
        bioOverlay.classList.add('open');
        void bioOverlay.offsetHeight;
        bioOverlay.classList.add('visible');
        document.body.style.overflow = 'hidden';
        var closeBtn = bioOverlay.querySelector('.bio-close');
        if (closeBtn) closeBtn.focus();
      }

      function closeBio() {
        bioOverlay.classList.remove('visible');
        document.body.style.overflow = '';
        setTimeout(function () {
          bioOverlay.classList.remove('open');
          bioOverlay.hidden = true;
          if (lastBioFocus && typeof lastBioFocus.focus === 'function') {
            lastBioFocus.focus();
          }
        }, 350);
      }

      document.querySelectorAll('[data-pastor-bio]').forEach(function (btn) {
        btn.addEventListener('click', function () { openBio(btn.dataset.pastorBio); });
      });
      document.querySelectorAll('[data-close-bio]').forEach(function (btn) {
        btn.addEventListener('click', closeBio);
      });
      bioOverlay.addEventListener('click', function (e) {
        if (e.target === bioOverlay) closeBio();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && bioOverlay.classList.contains('open')) closeBio();
      });
    }

    // YouTube channel hydrate (Live page)
    var livePlayer = document.querySelector('.live-player[data-yt-channel]');
    var broadcastGrid = document.getElementById('broadcastGrid');
    var ytChannelId =
        (livePlayer && livePlayer.dataset.ytChannel) ||
        (broadcastGrid && broadcastGrid.dataset.ytChannel) || '';

    if (ytChannelId && /^UC[A-Za-z0-9_-]{22}$/.test(ytChannelId)) {
      hydrateChannel(ytChannelId, livePlayer, broadcastGrid);
    }

    function hydrateChannel(channelId, player, grid) {
      var cacheKey = 'jhsv_yt_v3_' + channelId;
      var cacheTtl = 60 * 60 * 1000;
      var rssUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + channelId;

      var fresh = readChannelCache(cacheKey, cacheTtl);
      if (fresh) {
        applyChannelData(player, grid, fresh);
      } else {
        fetchChannelVideos(rssUrl)
          .then(function (videos) {
            if (!videos.length) throw new Error('Empty feed');
            var keep = videos.slice(0, 5);
            try {
              localStorage.setItem(cacheKey, JSON.stringify({
                fetchedAt: Date.now(),
                videos: keep
              }));
            } catch (e) {}
            applyChannelData(player, grid, keep);
          })
          .catch(function () {
            var stale = readChannelCache(cacheKey, Infinity);
            if (stale) applyChannelData(player, grid, stale);
          });
      }

      if (document.querySelector('.live-stage')) {
        checkChannelLive(channelId).then(applyLiveStatus);
      }
    }

    function applyLiveStatus(isLive) {
      var stage = document.querySelector('.live-stage');
      var label = document.querySelector('[data-live-label]');
      if (!stage || !label) return;
      if (isLive) {
        stage.dataset.live = 'true';
        label.textContent = 'Live';
      } else {
        stage.dataset.live = 'false';
      }
    }

    function checkChannelLive(channelId) {
      var cacheKey = 'jhsv_yt_live_v1_' + channelId;
      var cacheTtl = 60 * 1000;

      try {
        var cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
        if (cached && Date.now() - (cached.t || 0) < cacheTtl) {
          return Promise.resolve(!!cached.live);
        }
      } catch (e) {}

      var liveUrl = 'https://www.youtube.com/channel/'
        + encodeURIComponent(channelId) + '/live';
      var proxies = [
        function (u) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u); },
        function (u) { return 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u); }
      ];
      var liveMarker = /"isLive"\s*:\s*true|"liveBroadcastContent"\s*:\s*"live"|"isLiveNow"\s*:\s*true/;

      function tryAt(idx) {
        if (idx >= proxies.length) return Promise.resolve(false);
        return fetch(proxies[idx](liveUrl))
          .then(function (res) {
            if (!res.ok) throw new Error('proxy HTTP ' + res.status);
            return res.text();
          })
          .then(function (html) { return liveMarker.test(html); })
          .catch(function () { return tryAt(idx + 1); });
      }

      return tryAt(0).then(function (live) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            t: Date.now(),
            live: live
          }));
        } catch (e) {}
        return live;
      });
    }

    function readChannelCache(key, ttl) {
      try {
        var raw = JSON.parse(localStorage.getItem(key) || 'null');
        if (raw && raw.videos && raw.videos.length
            && Date.now() - (raw.fetchedAt || 0) < ttl) {
          return raw.videos;
        }
      } catch (e) {}
      return null;
    }

    function fetchChannelVideos(rssUrl) {
      return tryRss2Json(rssUrl)
        .catch(function () {
          return tryRawProxy(
            'https://api.allorigins.win/raw?url=' + encodeURIComponent(rssUrl)
          );
        })
        .catch(function () {
          return tryRawProxy(
            'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(rssUrl)
          );
        });
    }

    function tryRss2Json(rssUrl) {
      var url = 'https://api.rss2json.com/v1/api.json?rss_url='
        + encodeURIComponent(rssUrl);
      return fetch(url)
        .then(function (res) {
          if (!res.ok) throw new Error('rss2json HTTP ' + res.status);
          return res.json();
        })
        .then(function (json) {
          if (!json || json.status !== 'ok' || !json.items || !json.items.length) {
            throw new Error('rss2json bad response');
          }
          return json.items
            .map(function (item) {
              var videoId = '';
              var linkMatch = (item.link || '').match(/[?&]v=([A-Za-z0-9_-]{11})/);
              if (linkMatch) videoId = linkMatch[1];
              if (!videoId) {
                var guidMatch = (item.guid || '').match(/([A-Za-z0-9_-]{11})\s*$/);
                if (guidMatch) videoId = guidMatch[1];
              }
              return {
                id: videoId,
                title: (item.title || 'Untitled').trim(),
                published: item.pubDate || '',
                thumbnail: videoId
                  ? 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg'
                  : (item.thumbnail || ''),
                url: item.link || ('https://www.youtube.com/watch?v=' + videoId)
              };
            })
            .filter(function (v) { return v.id; });
        });
    }

    function tryRawProxy(proxyUrl) {
      return fetch(proxyUrl)
        .then(function (res) {
          if (!res.ok) throw new Error('proxy HTTP ' + res.status);
          return res.text();
        })
        .then(function (text) {
          if (!text || text.indexOf('<entry') === -1) {
            throw new Error('Invalid RSS payload');
          }
          return parseYouTubeFeed(text);
        });
    }

    function applyChannelData(player, grid, videos) {
      if (player && videos[0]) renderLivePlayer(player, videos[0]);
      if (grid) renderBroadcasts(grid, videos.slice(1, 4));
    }

    function renderLivePlayer(player, latest) {
      var iframe = document.createElement('iframe');
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

    var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    function formatBroadcastDate(iso) {
      if (!iso) return '';
      var d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
    }

    function renderBroadcasts(grid, videos) {
      grid.innerHTML = videos.map(function (v) {
        return ''
          + '<a class="broadcast-card" href="' + escHtml(v.url) + '"'
          + ' target="_blank" rel="noopener">'
          +   '<div class="broadcast-thumb">'
          +     '<img src="' + escHtml(v.thumbnail) + '"'
          +     ' alt="' + escHtml(v.title) + '" loading="lazy" />'
          +     '<span class="broadcast-play" aria-hidden="true">'
          +       '<svg viewBox="0 0 24 24" fill="currentColor">'
          +       '<path d="M8 5v14l11-7z"/></svg>'
          +     '</span>'
          +   '</div>'
          +   '<div class="broadcast-meta">'
          +     '<h3>' + escHtml(v.title) + '</h3>'
          +     '<p>' + escHtml(formatBroadcastDate(v.published)) + '</p>'
          +   '</div>'
          + '</a>';
      }).join('');
    }

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

    var topbarEl = document.querySelector('.topbar');
    if (topbarEl) {
      var setTopbarHeight = function () {
        var h = topbarEl.offsetHeight;
        if (h) document.documentElement.style.setProperty('--topbar-height', h + 'px');
      };
      setTopbarHeight();
      window.addEventListener('resize', setTopbarHeight);
      window.addEventListener('load', setTopbarHeight);
    }

    var topbarHero = document.querySelector('.topbar');
    var heroV2 = document.querySelector('.hero.hero-v2');
    if (topbarHero && heroV2 && document.body.dataset.page === 'home') {
      var updateTopbar = function () {
        if (window.innerWidth <= 920) {
          topbarHero.classList.remove('over-hero');
          return;
        }
        var heroBottom = heroV2.offsetTop + heroV2.offsetHeight;
        var threshold = heroBottom - topbarHero.offsetHeight - 40;
        if (window.scrollY < threshold) {
          topbarHero.classList.add('over-hero');
        } else {
          topbarHero.classList.remove('over-hero');
        }
      };
      updateTopbar();
      window.addEventListener('scroll', updateTopbar, { passive: true });
      window.addEventListener('resize', updateTopbar);
    }

    initFamilyTabs();
    initEventsPage();
    initPrayerModal();
  }

  function initPrayerModal() {
    var overlay = document.getElementById('prayerOverlay');
    if (!overlay) return;

    var triggers = document.querySelectorAll('[data-prayer-modal]');
    if (!triggers.length) return;

    var lastFocused = null;

    function open() {
      lastFocused = document.activeElement;
      overlay.hidden = false;
      overlay.classList.add('open');
      void overlay.offsetHeight;
      overlay.classList.add('visible');
      document.body.style.overflow = 'hidden';
      var closeBtn = overlay.querySelector('.prayer-close');
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      overlay.classList.remove('visible');
      document.body.style.overflow = '';
      setTimeout(function () {
        overlay.classList.remove('open');
        overlay.hidden = true;
        if (lastFocused && typeof lastFocused.focus === 'function') {
          lastFocused.focus();
        }
      }, 280);
    }

    triggers.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        open();
      });
    });

    overlay.querySelectorAll('[data-close-prayer]').forEach(function (btn) {
      btn.addEventListener('click', close);
    });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !overlay.hidden) close();
    });
  }

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

  function initEventsPage() {
    var grid = document.getElementById('upcomingGrid');
    if (!grid) return;

    enhanceStaticEvents(grid);

    var cfg = window.JHSV_CALENDAR;
    if (!cfg || !cfg.id || !cfg.apiKey) return;

    fetchLiveEvents(cfg)
      .then(function (events) {
        if (events && events.length) renderLiveEvents(grid, events);
      })
      .catch(function () {});
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
    var cacheKey = 'jhsv_cal_v2_' + cfg.id;
    var max = cfg.maxResults || 4;
    var cached = readCache(cacheKey, 10 * 60 * 1000);
    if (cached) return Promise.resolve(cached.slice(0, max));

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
        var pool = (data.items || [])
          .filter(function (ev) { return !ev.recurringEventId; })
          .map(normalizeApiEvent);
        writeCache(cacheKey, pool);
        return pool.slice(0, max);
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
    setUpcomingGridLayout(grid, events.length);
  }

  function setUpcomingGridLayout(grid, count) {
    if (!grid.hasAttribute('data-grid-cols-auto')) return;
    grid.classList.remove('c2', 'c3');
    grid.classList.add(count >= 5 ? 'c3' : 'c2');
  }

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

  var ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return ESC_MAP[c]; });
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
    } catch (e) { return null; }
  }
  function writeCache(key, value) {
    try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), v: value })); } catch (e) {}
  }
})();
