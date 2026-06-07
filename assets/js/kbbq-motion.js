(function () {
  const slides = [...document.querySelectorAll(".kbbq-hero-bg")];
  if (slides.length > 1) {
    let i = 0;
    setInterval(() => {
      slides[i].classList.remove("is-active");
      i = (i + 1) % slides.length;
      slides[i].classList.add("is-active");
    }, 7000);
  }

  const mobileTapQuery = window.matchMedia("(max-width: 980px)");
  const tappableSelector =
    'a.kbbq-btn, a.kbbq-call, .kbbq-bottom-cta a, .kbbq-channel .kbbq-btn';
  const hasVibrate = typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

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
        } catch (error) {
          // Ignore vibration failures on browsers that expose the API but block it.
        }
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
            } catch (error) {
              // Fall through to a direct open if the placeholder tab cannot be reused.
            }
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
    { passive: false },
  );

  const items = [...document.querySelectorAll(".reveal")];
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.13, rootMargin: "0px 0px -6% 0px" },
    );
    items.forEach((el, idx) => {
      el.style.transitionDelay = Math.min(idx % 4, 3) * 70 + "ms";
      io.observe(el);
    });
  } else {
    items.forEach((el) => el.classList.add("is-visible"));
  }
})();
