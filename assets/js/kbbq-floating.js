(function () {
  if (window.__kbbqFloatingActions) return;
  window.__kbbqFloatingActions = true;

  const KBBQ_FLOAT_CONFIG = Object.freeze({
    phone: "050713935889",
    phoneLabel: "0507-1393-5889",
    bookingUrl:
      "https://m.booking.naver.com/booking/6/bizes/425958/items/3631234?area=pll&lang=ko&service-target=map-pc&startDate=2026-06-07&theme=place",
    placeUrl: "https://naver.me/xAF7Sexr",
    tmapUrl: "https://tmap.life/7925659a",
    instagramUrl: "https://www.instagram.com/kkbbq5889",
    blogUrl: "https://blog.naver.com/gnlfus0727",
  });

  const KBBQ_LANGS = Object.freeze([
    { code: "ko", label: "Korean", flag: "🇰🇷", flagImg: "https://flagcdn.com/w160/kr.png" },
    { code: "en", label: "English", flag: "🇺🇸", flagImg: "https://flagcdn.com/w160/us.png" },
    { code: "ja", label: "Japanese", flag: "🇯🇵", flagImg: "https://flagcdn.com/w160/jp.png" },
    { code: "zh-CN", label: "Chinese", flag: "🇨🇳", flagImg: "https://flagcdn.com/w160/cn.png" },
    { code: "zh-TW", label: "Chinese TW", flag: "🇹🇼", flagImg: "https://flagcdn.com/w160/tw.png" },
    { code: "vi", label: "Vietnamese", flag: "🇻🇳", flagImg: "https://flagcdn.com/w160/vn.png" },
    { code: "fr", label: "French", flag: "🇫🇷", flagImg: "https://flagcdn.com/w160/fr.png" },
    { code: "id", label: "Indonesian", flag: "🇮🇩", flagImg: "https://flagcdn.com/w160/id.png" },
    { code: "es", label: "Spanish", flag: "🇪🇸", flagImg: "https://flagcdn.com/w160/es.png" },
  ]);

  const KBBQ_WORLD_TIME = Object.freeze([
    { city: "Seoul", zone: "Asia/Seoul", label: "Korea" },
    { city: "Tokyo", zone: "Asia/Tokyo", label: "Japan" },
    { city: "London", zone: "Europe/London", label: "UK" },
    { city: "New York", zone: "America/New_York", label: "USA" },
  ]);

  const LANG_KEY = "kbbq_lang";
  const mobileTapQuery = window.matchMedia("(max-width: 980px)");
  const hasVibrate = typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

  let translateLoaded = false;
  let translateLoading = false;
  let currentLang = "ko";
  const restoreTimers = [];
  const retryTimers = [];

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function getStoredLanguage() {
    try {
      return localStorage.getItem(LANG_KEY) || "ko";
    } catch (e) {
      return "ko";
    }
  }

  function setStoredLanguage(lang) {
    try {
      if (!lang || lang === "ko") {
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
    document.cookie = `${name}=${value}; path=/`;
    document.cookie = `${name}=${value}; path=/; domain=${location.hostname}`;
  }

  function clearTranslateCookie() {
    const expire = "Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = `googtrans=; expires=${expire}; path=/`;
    document.cookie = `googtrans=; expires=${expire}; path=/; domain=${location.hostname}`;
    document.cookie = `googtrans=; expires=${expire}; path=/; domain=.${location.hostname}`;
  }

  function ensureGoogleTranslateMount() {
    if (document.getElementById("kbbqGoogleTranslateElement")) return;
    const mount = document.createElement("div");
    mount.id = "kbbqGoogleTranslateElement";
    mount.setAttribute("aria-hidden", "true");
    mount.style.display = "none";
    document.body.appendChild(mount);
  }

  function formatWorldTime(date, timeZone) {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(date);
    } catch (error) {
      return "--:--:--";
    }
  }

  function formatWorldDate(date, timeZone) {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone,
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(date);
    } catch (error) {
      return "--";
    }
  }

  function buildWorldTimeFooter() {
    if (document.querySelector("[data-kbbq-worldtime]")) return;

    const footer = document.querySelector(".kbbq-footer");
    if (!footer) return;

    const section = document.createElement("section");
    section.className = "kbbq-worldtime";
    section.setAttribute("data-kbbq-worldtime", "true");
    section.setAttribute("aria-label", "World Time");
    section.innerHTML = `
      <div class="kbbq-worldtime__head">
        <div>
          <strong>World Time</strong>
          <span>주요 도시의 현재 시간을 푸터에서 바로 확인하세요.</span>
        </div>
        <span class="kbbq-worldtime__live">LIVE</span>
      </div>
      <div class="kbbq-worldtime__grid">
        ${KBBQ_WORLD_TIME.map(
          (city) => `
            <article class="kbbq-worldtime__card" data-world-city="${escapeHtml(city.city)}" data-world-zone="${escapeHtml(city.zone)}">
              <div class="kbbq-worldtime__city">
                <strong>${escapeHtml(city.city)}</strong>
                <span>${escapeHtml(city.label)}</span>
              </div>
              <div class="kbbq-worldtime__time" data-world-time>--:--:--</div>
              <div class="kbbq-worldtime__date" data-world-date>---</div>
            </article>
          `
        ).join("")}
      </div>
    `;

    footer.appendChild(section);
  }

  function updateWorldTimeFooter() {
    const root = document.querySelector("[data-kbbq-worldtime]");
    if (!root) return;

    const now = new Date();
    root.querySelectorAll("[data-world-city]").forEach((card) => {
      const zone = card.getAttribute("data-world-zone");
      const timeEl = card.querySelector("[data-world-time]");
      const dateEl = card.querySelector("[data-world-date]");
      if (timeEl) timeEl.textContent = formatWorldTime(now, zone);
      if (dateEl) dateEl.textContent = formatWorldDate(now, zone);
    });
  }

  function startWorldTimeFooter() {
    buildWorldTimeFooter();
    updateWorldTimeFooter();

    if (!window.__kbbqWorldTimeTimer) {
      window.__kbbqWorldTimeTimer = window.setInterval(updateWorldTimeFooter, 1000);
    }
  }

  function buildFloatingMarkup() {
    if (document.querySelector(".kbbq-float")) return;

    const float = document.createElement("div");
    float.className = "kbbq-float";
    float.setAttribute("aria-label", "강경숯불바베큐 빠른 메뉴");
    float.innerHTML = `
      <a class="call" href="tel:${KBBQ_FLOAT_CONFIG.phone}" aria-label="전화 문의 ${KBBQ_FLOAT_CONFIG.phoneLabel}">
        <span class="kbbq-float-call" aria-hidden="true">☎</span>
      </a>
      <a class="booking" href="${escapeHtml(KBBQ_FLOAT_CONFIG.bookingUrl)}" target="_blank" rel="noopener" aria-label="네이버 예약">
        <span class="kbbq-float-label">예약</span>
      </a>
      <a class="place" href="${escapeHtml(KBBQ_FLOAT_CONFIG.placeUrl)}" target="_blank" rel="noopener" aria-label="네이버 플레이스">
        <span class="kbbq-float-place" aria-hidden="true">N</span>
      </a>
      <a class="tmap" href="${escapeHtml(KBBQ_FLOAT_CONFIG.tmapUrl)}" target="_blank" rel="noopener" aria-label="티맵 길찾기">
        <span class="kbbq-float-label">TMAP</span>
      </a>
      <a class="instagram" href="${escapeHtml(KBBQ_FLOAT_CONFIG.instagramUrl)}" target="_blank" rel="noopener" aria-label="인스타그램">
        <span class="kbbq-float-label">IG</span>
      </a>
      <a class="blog" href="${escapeHtml(KBBQ_FLOAT_CONFIG.blogUrl)}" target="_blank" rel="noopener" aria-label="네이버 블로그">
        <span class="kbbq-float-label">Blog</span>
      </a>
      <button class="translate" id="kbbqTranslateOpen" type="button" aria-label="번역">
        <span class="kbbq-float-globe" aria-hidden="true">🌐</span>
      </button>
      <button class="top" id="kbbqFloatTop" type="button" aria-label="페이지 상단으로 이동">
        <span class="kbbq-float-label">TOP</span>
      </button>
    `;

    document.body.appendChild(float);
  }

  function buildTranslateModal() {
    if (document.querySelector("#kbbqTranslateModal")) return;

    const modal = document.createElement("div");
    modal.className = "kbbq-translate-modal";
    modal.id = "kbbqTranslateModal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="kbbq-translate-box" role="dialog" aria-modal="true" aria-label="언어 선택">
        <div class="kbbq-translate-head">
          <strong>언어 선택</strong>
          <button class="kbbq-translate-close" id="kbbqTranslateClose" type="button" aria-label="닫기">×</button>
        </div>
        <div class="kbbq-translate-grid">
          ${KBBQ_LANGS.map((lang) => `
            <button type="button" data-kbbq-lang="${lang.code}">
              <span class="kbbq-lang-flag" aria-hidden="true">
                <img class="kbbq-lang-flag-img" src="${escapeHtml(lang.flagImg)}" alt="" loading="lazy">
                <span class="kbbq-lang-flag-emoji">${lang.flag}</span>
              </span>
              <span class="kbbq-lang-name">${lang.label}</span>
            </button>
          `).join("")}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  function buildFloatingStructure() {
    if (!document.body) return;
    buildFloatingMarkup();
    buildTranslateModal();
    ensureGoogleTranslateMount();
  }

  function getLanguageMeta(lang) {
    return KBBQ_LANGS.find((item) => item.code === lang) || KBBQ_LANGS[1];
  }

  function syncLanguageButtons() {
    const modal = document.querySelector("#kbbqTranslateModal");
    if (!modal) return;

    modal.querySelectorAll("[data-kbbq-lang]").forEach((btn) => {
      const lang = btn.getAttribute("data-kbbq-lang");
      const meta = getLanguageMeta(lang);
      const isActive = lang === currentLang;
      btn.setAttribute("aria-label", `${meta.flag} ${meta.label}`);
      btn.setAttribute("title", `${meta.flag} ${meta.label}`);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
      btn.classList.toggle("is-active", isActive);
    });
  }

  function setFloatingDecorations() {
    const callBtn = document.querySelector(".kbbq-float .call");
    if (callBtn && callBtn.getAttribute("data-kbbq-decorated") !== "1") {
      callBtn.setAttribute("data-kbbq-decorated", "1");
      callBtn.setAttribute("aria-label", `전화 문의 ${KBBQ_FLOAT_CONFIG.phoneLabel}`);
      callBtn.setAttribute("title", `전화 문의 ${KBBQ_FLOAT_CONFIG.phoneLabel}`);
      callBtn.innerHTML = '<span class="kbbq-float-call" aria-hidden="true">☎</span>';
    }

    const bookingBtn = document.querySelector(".kbbq-float .booking");
    if (bookingBtn && bookingBtn.getAttribute("data-kbbq-decorated") !== "1") {
      bookingBtn.setAttribute("data-kbbq-decorated", "1");
      bookingBtn.setAttribute("aria-label", "네이버 예약");
      bookingBtn.setAttribute("title", "네이버 예약");
      bookingBtn.innerHTML = '<span class="kbbq-float-label">예약</span>';
    }

    const placeBtn = document.querySelector(".kbbq-float .place");
    if (placeBtn && placeBtn.getAttribute("data-kbbq-decorated") !== "1") {
      placeBtn.setAttribute("data-kbbq-decorated", "1");
      placeBtn.setAttribute("aria-label", "네이버 플레이스");
      placeBtn.setAttribute("title", "네이버 플레이스");
      placeBtn.innerHTML = '<span class="kbbq-float-place" aria-hidden="true">N</span>';
    }

    const tmapBtn = document.querySelector(".kbbq-float .tmap");
    if (tmapBtn && tmapBtn.getAttribute("data-kbbq-decorated") !== "1") {
      tmapBtn.setAttribute("data-kbbq-decorated", "1");
      tmapBtn.setAttribute("aria-label", "티맵 길찾기");
      tmapBtn.setAttribute("title", "티맵 길찾기");
      tmapBtn.innerHTML = '<span class="kbbq-float-label">TMAP</span>';
    }

    const instagramBtn = document.querySelector(".kbbq-float .instagram");
    if (instagramBtn && instagramBtn.getAttribute("data-kbbq-decorated") !== "1") {
      instagramBtn.setAttribute("data-kbbq-decorated", "1");
      instagramBtn.setAttribute("aria-label", "인스타그램");
      instagramBtn.setAttribute("title", "인스타그램");
      instagramBtn.innerHTML = '<span class="kbbq-float-label">IG</span>';
    }

    const blogBtn = document.querySelector(".kbbq-float .blog");
    if (blogBtn && blogBtn.getAttribute("data-kbbq-decorated") !== "1") {
      blogBtn.setAttribute("data-kbbq-decorated", "1");
      blogBtn.setAttribute("aria-label", "네이버 블로그");
      blogBtn.setAttribute("title", "네이버 블로그");
      blogBtn.innerHTML = '<span class="kbbq-float-label">Blog</span>';
    }

    const translateBtn = document.getElementById("kbbqTranslateOpen");
    if (translateBtn && translateBtn.getAttribute("data-kbbq-decorated") !== "1") {
      translateBtn.setAttribute("data-kbbq-decorated", "1");
      translateBtn.setAttribute("aria-label", "Language / Translate");
      translateBtn.setAttribute("title", "Language / Translate");
      translateBtn.innerHTML = '<span class="kbbq-float-globe" aria-hidden="true">🌐</span>';
    }

    const topBtn = document.getElementById("kbbqFloatTop");
    if (topBtn && topBtn.getAttribute("data-kbbq-decorated") !== "1") {
      topBtn.setAttribute("data-kbbq-decorated", "1");
      topBtn.setAttribute("aria-label", "페이지 상단으로 이동");
      topBtn.setAttribute("title", "페이지 상단으로 이동");
      topBtn.innerHTML = '<span class="kbbq-float-label">TOP</span>';
    }
  }

  function loadGoogleTranslate(callback) {
    if (translateLoaded) {
      if (callback) callback();
      return;
    }

    if (translateLoading) {
      if (callback) {
        setTimeout(callback, 350);
      }
      return;
    }

    translateLoading = true;

    const script = document.createElement("script");
    script.src = "https://translate.google.com/translate_a/element.js?cb=kbbqGoogleTranslateInit";
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
          pageLanguage: "ko",
          includedLanguages: KBBQ_LANGS.map((item) => item.code).join(","),
          autoDisplay: false,
        },
        "kbbqGoogleTranslateElement"
      );
      translateLoaded = true;
    } catch (e) {}
  };

  function applyComboLanguage(lang) {
    if (!lang || lang === "ko") return true;

    const combo = document.querySelector(".goog-te-combo");
    if (!combo) return false;

    try {
      setCookie("googtrans", `/ko/${lang}`);
      if (combo.value !== lang) combo.value = lang;
      combo.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    } catch (e) {
      return false;
    }
  }

  function attemptRestore(lang, attemptCount) {
    if (!lang || lang === "ko") return true;

    if (applyComboLanguage(lang)) {
      currentLang = lang;
      syncLanguageButtons();
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

  function restoreLanguage(lang) {
    clearTimers(restoreTimers);
    clearTimers(retryTimers);

    if (!lang || lang === "ko") {
      clearTranslateCookie();
      currentLang = "ko";
      syncLanguageButtons();
      return;
    }

    currentLang = lang;
    setStoredLanguage(lang);
    setCookie("googtrans", `/ko/${lang}`);
    syncLanguageButtons();

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

  function applySelectedLanguage(lang) {
    setStoredLanguage(lang);
    if (!lang || lang === "ko") {
      clearTranslateCookie();
      currentLang = "ko";
      syncLanguageButtons();
      window.location.reload();
      return;
    }

    restoreLanguage(lang);
  }

  function openTranslateModal() {
    const modal = document.getElementById("kbbqTranslateModal");
    if (!modal) return;
    currentLang = getStoredLanguage();
    syncLanguageButtons();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    loadGoogleTranslate();
  }

  function closeTranslateModal() {
    const modal = document.getElementById("kbbqTranslateModal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  function bindInteractions() {
    const float = document.querySelector(".kbbq-float");
    if (float && float.getAttribute("data-kbbq-bound") !== "1") {
      float.setAttribute("data-kbbq-bound", "1");
      float.addEventListener("click", function (event) {
        const openBtn = event.target.closest("#kbbqTranslateOpen");
        const topBtn = event.target.closest("#kbbqFloatTop");
        if (openBtn) {
          event.preventDefault();
          openTranslateModal();
          return;
        }
        if (topBtn) {
          event.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    }

    const modal = document.getElementById("kbbqTranslateModal");
    if (modal && modal.getAttribute("data-kbbq-bound") !== "1") {
      modal.setAttribute("data-kbbq-bound", "1");
      modal.addEventListener("click", function (event) {
        if (event.target.closest(".kbbq-translate-box") && !event.target.closest(".kbbq-translate-close")) {
          const langBtn = event.target.closest("[data-kbbq-lang]");
          if (langBtn) {
            const lang = langBtn.getAttribute("data-kbbq-lang");
            closeTranslateModal();
            applySelectedLanguage(lang);
          }
          return;
        }

        if (event.target.closest(".kbbq-translate-close")) {
          closeTranslateModal();
          return;
        }

        if (event.target === modal) {
          closeTranslateModal();
        }
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeTranslateModal();
    });

    const tappableSelector = "a.kbbq-btn, a.kbbq-call, .kbbq-bottom-cta a, .kbbq-channel .kbbq-btn";
    document.addEventListener(
      "click",
      (event) => {
        const link = event.target.closest(tappableSelector);
        if (!link || !mobileTapQuery.matches) return;
        if (
          event.defaultPrevented ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button > 0
        ) {
          return;
        }

        const href = link.getAttribute("href");
        if (!href || link.dataset.tapLock === "1") return;

        event.preventDefault();
        link.dataset.tapLock = "1";
        link.classList.add("is-tapping");

        if (hasVibrate) {
          try {
            navigator.vibrate(10);
          } catch (error) {}
        }

        const release = () => {
          link.classList.remove("is-tapping");
          delete link.dataset.tapLock;
        };

        const target = link.getAttribute("target");
        if (target === "_blank") {
          const popup = window.open("about:blank", "_blank", "noopener,noreferrer");
          window.setTimeout(() => {
            release();
            if (popup && !popup.closed) {
              try {
                popup.location.href = href;
                return;
              } catch (error) {}
            }
            window.open(href, "_blank", "noopener,noreferrer");
          }, 120);
          return;
        }

        window.setTimeout(() => {
          release();
          window.location.href = href;
        }, 120);
      },
      { passive: false }
    );
  }

  function init() {
    buildFloatingStructure();
    setFloatingDecorations();
    syncLanguageButtons();
    bindInteractions();
    restoreLanguage(getStoredLanguage());
    startWorldTimeFooter();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.addEventListener("pageshow", function () {
    currentLang = getStoredLanguage();
    buildFloatingStructure();
    setFloatingDecorations();
    syncLanguageButtons();
    restoreLanguage(currentLang);
    startWorldTimeFooter();
  });
})();
