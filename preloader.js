/**
 * Full-screen splash: GSAP intro, bob until load + min time, then dismiss.
 * prefers-reduced-motion: shorter fade, no intro/bob.
 * Without GSAP: brief dwell after window load, then CSS fade.
 * Safety: bounded waits (8s); hard DOM remove at 12s.
 */
(function preloaderIIFE() {
  const overlay = document.getElementById("sitePreloader");
  if (!overlay) return;

  const pyramid = overlay.querySelector(".site-preloader__pyramid");
  const nameParts = overlay.querySelectorAll(".site-preloader__name-part");
  const lineEl = overlay.querySelector(".site-preloader__line");

  const MIN_VISIBLE_MS = 2200;
  const NO_GSAP_AFTER_LOAD_MS = 180;
  const FADE_NORMAL_S = 0.55;
  const FADE_REDUCED_S = 0.22;
  const NO_GSAP_FADE_MS = 280;
  const SAFETY_BOUND_MS = 8000;
  const SAFETY_REMOVE_MS = 12000;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined";

  const splashStart = performance.now();
  let dismissed = false;
  let bobTween = null;

  const loadPromise = new Promise((resolve) => {
    if (document.readyState === "complete") resolve();
    else window.addEventListener("load", () => resolve(), { once: true });
  });

  function minVisiblePromise() {
    return new Promise((resolve) => {
      const elapsed = performance.now() - splashStart;
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
      setTimeout(resolve, wait);
    });
  }

  function boundPromise(promise, ms) {
    return Promise.race([
      promise,
      new Promise((resolve) => {
        setTimeout(resolve, ms);
      }),
    ]);
  }

  function killBob() {
    if (bobTween && typeof bobTween.kill === "function") bobTween.kill();
    bobTween = null;
  }

  function finishRemove() {
    killBob();
    overlay.remove();
    document.documentElement.classList.remove("preloader-active");
  }

  function runDismissAnimation() {
    const done = () => finishRemove();

    if (hasGsap) {
      const dur = reducedMotion ? FADE_REDUCED_S : FADE_NORMAL_S;
      window.gsap.to(overlay, {
        autoAlpha: 0,
        duration: dur,
        ease: reducedMotion ? "power1.out" : "power2.out",
        onComplete: done,
      });
      return;
    }

    overlay.style.pointerEvents = "none";
    overlay.style.transition = `opacity ${NO_GSAP_FADE_MS}ms ease-out`;
    requestAnimationFrame(() => {
      overlay.style.opacity = "0";
    });
    setTimeout(done, NO_GSAP_FADE_MS);
  }

  let safetyDismissTimer;

  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    window.clearTimeout(safetyDismissTimer);
    runDismissAnimation();
  }

  let introPromise = Promise.resolve();

  document.documentElement.classList.add("preloader-active");

  const canRunFullIntro =
    hasGsap &&
    !reducedMotion &&
    Boolean(pyramid && lineEl && nameParts.length >= 2);

  if (canRunFullIntro) {
    introPromise = new Promise((resolveIntro) => {
      window.gsap.set(pyramid, { scale: 0.78, opacity: 0 });
      window.gsap.set(nameParts, { opacity: 0, y: 18 });
      window.gsap.set(lineEl, { scaleX: 0, transformOrigin: "50% 50%" });

      const tl = window.gsap.timeline({ onComplete: resolveIntro });
      tl.to(pyramid, {
        scale: 1,
        opacity: 1,
        duration: 0.52,
        ease: "back.out(1.25)",
      });
      tl.to(
        nameParts[0],
        { opacity: 1, y: 0, duration: 0.38, ease: "power2.out" },
        "-=0.12",
      );
      tl.to(
        nameParts[1],
        { opacity: 1, y: 0, duration: 0.38, ease: "power2.out" },
        "+=0.14",
      );
      tl.to(lineEl, { scaleX: 1, duration: 0.55, ease: "power2.inOut" }, "-=0.08");
    });

    introPromise.then(() => {
      if (dismissed || !pyramid) return;
      bobTween = window.gsap.to(pyramid, {
        y: 6,
        duration: 1.35,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    });
  } else if (hasGsap && reducedMotion && pyramid && nameParts.length && lineEl) {
    window.gsap.set(pyramid, { scale: 1, opacity: 1, y: 0 });
    window.gsap.set(nameParts, { opacity: 1, y: 0 });
    window.gsap.set(lineEl, { scaleX: 1 });
  }

  async function runGsapExit() {
    await Promise.all([
      boundPromise(loadPromise, SAFETY_BOUND_MS),
      minVisiblePromise(),
      boundPromise(introPromise, SAFETY_BOUND_MS),
    ]);
    dismiss();
  }

  async function runReducedMotionExit() {
    await Promise.all([boundPromise(loadPromise, SAFETY_BOUND_MS), minVisiblePromise()]);
    dismiss();
  }

  safetyDismissTimer = window.setTimeout(() => {
    dismiss();
  }, SAFETY_BOUND_MS);

  window.setTimeout(() => {
    if (overlay.parentNode) {
      killBob();
      overlay.remove();
      document.documentElement.classList.remove("preloader-active");
    }
  }, SAFETY_REMOVE_MS);

  if (hasGsap && !reducedMotion) {
    void runGsapExit();
  } else if (hasGsap && reducedMotion) {
    void runReducedMotionExit();
  } else {
    void boundPromise(loadPromise, SAFETY_BOUND_MS).then(() =>
      window.setTimeout(() => {
        if (!dismissed) dismiss();
      }, NO_GSAP_AFTER_LOAD_MS),
    );
  }
})();
