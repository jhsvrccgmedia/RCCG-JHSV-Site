window.JHSV_ANALYTICS = window.JHSV_ANALYTICS || {
  gaId: '',
  gscToken: ''
};

(function () {
  var cfg = window.JHSV_ANALYTICS || {};
  var gaId = (cfg.gaId || '').trim();
  var gscToken = (cfg.gscToken || '').trim();

  if (gscToken && !document.querySelector('meta[name="google-site-verification"]')) {
    var meta = document.createElement('meta');
    meta.name = 'google-site-verification';
    meta.content = gscToken;
    document.head.appendChild(meta);
  }

  function loadGA(id) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id, {
      anonymize_ip: true,
      send_page_view: true
    });
  }

  function track(name, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params || {});
    }
  }
  window.JHSVTrack = track;

  if (gaId) {
    loadGA(gaId);
  }

  function classify(href) {
    if (!href) return null;
    var lower = href.toLowerCase();
    if (lower.indexOf('tel:') === 0) return { name: 'phone_click', params: { phone: href.replace(/^tel:/i, '') } };
    if (lower.indexOf('mailto:') === 0) return { name: 'email_click', params: { email: href.replace(/^mailto:/i, '') } };
    if (lower.indexOf('maps.google') !== -1 || lower.indexOf('google.com/maps') !== -1) return { name: 'directions_click', params: {} };
    if (lower.indexOf('rccgjhsv.churchcenter.com') !== -1) {
      var section = lower.indexOf('/giving') !== -1 ? 'giving' : 'general';
      return { name: 'church_center_click', params: { section: section } };
    }
    if (lower.indexOf('youtube.com') !== -1 || lower.indexOf('youtu.be') !== -1) return { name: 'youtube_click', params: {} };
    if (lower.indexOf('facebook.com') !== -1) return { name: 'social_click', params: { platform: 'facebook' } };
    if (lower.indexOf('instagram.com') !== -1) return { name: 'social_click', params: { platform: 'instagram' } };
    if (lower.indexOf('threads.com') !== -1 || lower.indexOf('threads.net') !== -1) return { name: 'social_click', params: { platform: 'threads' } };
    if (lower.indexOf('cash.app') !== -1) return { name: 'cashapp_click', params: {} };
    var path = lower.split('#')[0].split('?')[0];
    if (/(^|\/)new(\.html)?$/.test(path)) return { name: 'plan_visit_click', params: {} };
    if (/(^|\/)live(\.html)?$/.test(path)) return { name: 'watch_online_click', params: {} };
    if (/(^|\/)give(\.html)?$/.test(path)) return { name: 'give_click', params: {} };
    return null;
  }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!a) return;
    var info = classify(a.getAttribute('href') || '');
    if (info) {
      info.params.link_text = (a.textContent || '').trim().slice(0, 80);
      info.params.page = document.body && document.body.dataset ? (document.body.dataset.page || '') : '';
      track(info.name, info.params);
    }
  }, true);

  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || f.tagName !== 'FORM') return;
    var page = document.body && document.body.dataset ? (document.body.dataset.page || '') : '';
    var formName;
    if (page === 'contact') {
      formName = f.querySelector('#pr') ? 'prayer_request_submit' : 'contact_form_submit';
    } else if (page === 'new') {
      formName = 'connection_card_submit';
    } else if (f.classList && f.classList.contains('nl-form')) {
      formName = 'connection_list_signup';
    } else {
      formName = 'form_submit';
    }
    track(formName, { page: page });
  }, true);
})();
