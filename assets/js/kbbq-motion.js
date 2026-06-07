(function () {
  const slides = [...document.querySelectorAll(".kbbq-hero-bg")];
  if (slides.length > 1) {
    let i = 0;
    setInterval(() => {
      slides[i].classList.remove("is-active");
      i = (i + 1) % slides.length;
      slides[i].classList.add("is-active");
    }, 5200);
  }
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
