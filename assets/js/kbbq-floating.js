/* =========================================================
  KKBBQ FLOATING ACTIONS v2.0
========================================================= */
(function () {
  if (window.__kbbqFloatingActions) return;
  window.__kbbqFloatingActions = true;

  var LANG_KEY = 'kbbq_lang';
  var translateLoaded = false;
  var translateLoading = false;
  var currentLang = 'ko';
  var restoreTimers = [];
  var retryTimers = [];

  var LANG_OPTIONS = {
    ko: { flag: '🇰🇷', label: 'Korean' },
    en: { flag: '🇺🇸', label: 'English' },
    ja: { flag: '🇯🇵', label: 'Japanese' },
    'zh-CN': { flag: '🇨🇳', label: 'Chinese' },
    'zh-TW': { flag: '🇹🇼', label: 'Chinese TW' },
    vi: { flag: '🇻🇳', label: 'Vietnamese' },
    th: { flag: '🇹🇭', label: 'Thai' },
    ru: { flag: '🇷🇺', label: 'Russian' }
  };

  var TRANSLATE_BUTTON_HTML =
    '<span class="kbbq-float-globe" aria-hidden="true">🌐</span>' +
    '<span class="kbbq-float-lang" aria-hidden="true">LANG</span>';

  var INSTAGRAM_ICON_HTML =
    '<svg viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">' +
    '<rect x="4" y="6.5" width="16" height="13" rx="4" ry="4" fill="none" stroke="currentColor" stroke-width="1.9"></rect>' +
    '<path d="M9 6.5l1.1-2h3.8l1.1 2" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"></path>' +
    '<circle cx="12" cy="13" r="3.2" fill="none" stroke="currentColor" stroke-width="1.9"></circle>' +
    '</svg>';

  function getStoredLanguage() {
    try {
      return localStorage.getItem(LANG_KEY) || 'ko';
    } catch (e) {
      return 'ko';
    }
  }

  function setStoredLanguage(lang) {
    try {
      if (!lang || lang === 'ko') {
        localStorage.removeItem(LANG_KEY);
      } else {
        localStorage.setItem(LANG_KEY, lang);
      }
    } catch (e) {}
  }

  function clearTimers(list) {
    while (list.length) clearTimeout(list.pop());
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

  function loadGoogleTranslate(callback) {
    if (translateLoaded) {
      if (callback) callback();
      return;
    }

    if (translateLoading) {
      if (callback) {
        setTimeout(function () {
          callback();
        }, 350);
      }
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
      }, 500);
    };
    script.onerror = function () {
      translateLoading = false;
    };
    document.head.appendChild(script);
  }

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

  function getLanguageLabel(lang) {
    var meta = LANG_OPTIONS[lang] || LANG_OPTIONS.en;
    return meta.flag + ' ' + meta.label;
  }

  function setFloatingButtonsMarkup() {
    var translateBtn = document.getElementById('kbbqTranslateOpen');
    if (translateBtn && translateBtn.getAttribute('data-kbbq-decorated') !== '1') {
      translateBtn.setAttribute('data-kbbq-decorated', '1');
      translateBtn.setAttribute('aria-label', 'Language / Translate');
      translateBtn.setAttribute('title', 'Language / Translate');
      translateBtn.innerHTML = TRANSLATE_BUTTON_HTML;
    }

    document.querySelectorAll('.kbbq-float .instagram').forEach(function (btn) {
      if (btn.getAttribute('data-kbbq-icon') === '1') return;
      btn.setAttribute('data-kbbq-icon', '1');
      btn.setAttribute('aria-label', 'Instagram');
      btn.setAttribute('title', 'Instagram');
      btn.innerHTML = INSTAGRAM_ICON_HTML;
    });
  }

  function syncLanguageButtons() {
    var modal = document.getElementById('kbbqTranslateModal');
    if (!modal) return;

    modal.querySelectorAll('[data-kbbq-lang]').forEach(function (btn) {
      var lang = btn.getAttribute('data-kbbq-lang');
      var label = getLanguageLabel(lang);
      var isActive = lang === currentLang;
      btn.innerHTML =
        '<span class="kbbq-lang-flag" aria-hidden="true">' + LANG_OPTIONS[lang].flag + '</span>' +
        '<span class="kbbq-lang-name">' + LANG_OPTIONS[lang].label + '</span>';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      btn.classList.toggle('is-active', isActive);
    });
  }

  function markCurrentLanguage(lang) {
    currentLang = lang || 'ko';
    syncLanguageButtons();
  }

  function applyComboLanguage(lang) {
    if (!lang || lang === 'ko') return true;

    var combo = document.querySelector('.goog-te-combo');
    if (!combo) return false;

    try {
      setCookie('googtrans', '/ko/' + lang);
      if (combo.value !== lang) combo.value = lang;
      combo.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    } catch (e) {
      return false;
    }
  }

  function restoreLanguage(lang) {
    clearTimers(restoreTimers);
    clearTimers(retryTimers);

    if (!lang || lang === 'ko') {
      clearTranslateCookie();
      markCurrentLanguage('ko');
      return;
    }

    markCurrentLanguage(lang);
    setStoredLanguage(lang);
    setCookie('googtrans', '/ko/' + lang);
    loadGoogleTranslate(function () {
      attemptRestore(lang, 0);
    });

    [500, 1200].forEach(function (delay) {
      restoreTimers.push(
        setTimeout(function () {
          attemptRestore(lang, 0);
        }, delay)
      );
    });
  }

  function attemptRestore(lang, attemptCount) {
    if (!lang || lang === 'ko') return true;

    if (applyComboLanguage(lang)) {
      markCurrentLanguage(lang);
      return true;
    }

    if (attemptCount < 20) {
      retryTimers.push(
        setTimeout(function () {
          attemptRestore(lang, attemptCount + 1);
        }, 250)
      );
    }

    return false;
  }

  function applySelectedLanguage(lang) {
    currentLang = lang || 'ko';
    setStoredLanguage(lang);

    if (!lang || lang === 'ko') {
      clearTranslateCookie();
      markCurrentLanguage('ko');
      window.location.reload();
      return;
    }

    restoreLanguage(lang);
  }

  function openTranslateModal() {
    var modal = document.getElementById('kbbqTranslateModal');
    if (!modal) return;
    currentLang = getStoredLanguage();
    syncLanguageButtons();
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
    currentLang = getStoredLanguage();
    setFloatingButtonsMarkup();
    syncLanguageButtons();
    restoreLanguage(currentLang);

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
        applySelectedLanguage(lang);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeTranslateModal();
    });

    window.addEventListener('pageshow', function () {
      currentLang = getStoredLanguage();
      setFloatingButtonsMarkup();
      syncLanguageButtons();
      restoreLanguage(currentLang);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
