/* =========================================================
  KKBBQ FLOATING ACTIONS v1.0
========================================================= */
(function () {
  if (window.__kbbqFloatingActions) return;
  window.__kbbqFloatingActions = true;

  var translateLoaded = false;
  var translateLoading = false;

  window.kbbqGoogleTranslateInit = function () {
    try {
      if (!window.google || !google.translate) return;
      new google.translate.TranslateElement(
        {
          pageLanguage: 'ko',
          includedLanguages: 'ko,en,ja,zh-CN,zh-TW,vi,th,ru',
          autoDisplay: false
        },
        'kbbqGoogleTranslateElement'
      );
      translateLoaded = true;
    } catch (e) {}
  };

  function loadGoogleTranslate(callback) {
    if (translateLoaded) {
      if (callback) callback();
      return;
    }
    if (translateLoading) {
      setTimeout(function () { loadGoogleTranslate(callback); }, 300);
      return;
    }
    translateLoading = true;
    var script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=kbbqGoogleTranslateInit';
    script.async = true;
    script.onload = function () {
      setTimeout(function () {
        translateLoading = false;
        if (callback) callback();
      }, 700);
    };
    document.head.appendChild(script);
  }

  function setCookie(name, value) {
    document.cookie = name + '=' + value + '; path=/';
    document.cookie = name + '=' + value + '; path=/; domain=' + location.hostname;
  }

  function clearTranslateCookie() {
    var expire = 'Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'googtrans=; expires=' + expire + '; path=/';
    document.cookie = 'googtrans=; expires=' + expire + '; path=/; domain=' + location.hostname;
    document.cookie = 'googtrans=; expires=' + expire + '; path=/; domain=.' + location.hostname;
  }

  function applyLanguage(lang) {
    if (lang === 'ko') {
      clearTranslateCookie();
      window.location.reload();
      return;
    }

    loadGoogleTranslate(function () {
      var tries = 0;
      var timer = setInterval(function () {
        var combo = document.querySelector('.goog-te-combo');
        tries += 1;
        if (combo) {
          clearInterval(timer);
          setCookie('googtrans', '/ko/' + lang);
          combo.value = lang;
          combo.dispatchEvent(new Event('change'));
        } else if (tries > 20) {
          clearInterval(timer);
          setCookie('googtrans', '/ko/' + lang);
          window.location.reload();
        }
      }, 200);
    });
  }

  function openTranslateModal() {
    var modal = document.getElementById('kbbqTranslateModal');
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    loadGoogleTranslate();
  }

  function closeTranslateModal() {
    var modal = document.getElementById('kbbqTranslateModal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function bind() {
    var topBtn = document.getElementById('kbbqFloatTop');
    if (topBtn) {
      topBtn.addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    var translateBtn = document.getElementById('kbbqTranslateOpen');
    if (translateBtn) {
      translateBtn.addEventListener('click', function (e) {
        e.preventDefault();
        openTranslateModal();
      });
    }

    var closeBtn = document.getElementById('kbbqTranslateClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeTranslateModal);
    }

    var modal = document.getElementById('kbbqTranslateModal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeTranslateModal();
      });
    }

    document.querySelectorAll('[data-kbbq-lang]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var lang = btn.getAttribute('data-kbbq-lang');
        closeTranslateModal();
        applyLanguage(lang);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeTranslateModal();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
