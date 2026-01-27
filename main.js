/* Small UX touches (no frameworks). */

function setYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = String(new Date().getFullYear());
}

function highlightActiveNav() {
  const links = Array.from(document.querySelectorAll(".nav-link"));
  if (!links.length) return;

  const map = new Map();
  links.forEach((a) => {
    const href = a.getAttribute("href") || "";
    if (href.startsWith("#")) map.set(href.slice(1), a);
  });

  const sections = Array.from(map.keys())
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  if (!sections.length) return;

  const setActive = (id) => {
    links.forEach((a) => a.classList.remove("is-active"));
    const a = map.get(id);
    if (a) a.classList.add("is-active");
  };

  const obs = new IntersectionObserver(
    (entries) => {
      // Pick the top-most visible section with strongest intersection.
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]?.target?.id) setActive(visible[0].target.id);
    },
    { rootMargin: "-30% 0px -60% 0px", threshold: [0.1, 0.2, 0.4, 0.6] },
  );

  sections.forEach((s) => obs.observe(s));
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

function showToast(message) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("is-visible");
  window.clearTimeout(showToast._t);
  showToast._t = window.setTimeout(() => el.classList.remove("is-visible"), 1600);
}

function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);

  // Fallback
  return new Promise((resolve, reject) => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "true");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

function setupCopyButtons() {
  document.addEventListener("click", async (e) => {
    const btn = e.target?.closest?.("[data-copy]");
    if (!btn) return;
    const text = btn.getAttribute("data-copy") || "";
    if (!text) return;
    try {
      await copyText(text);
      showToast("Copied to clipboard");
    } catch {
      showToast("Copy failed");
    }
  });
}

function setupBackToTop() {
  const btn = document.getElementById("backToTop");
  if (!btn) return;

  const onScroll = () => {
    const show = window.scrollY > 420;
    btn.classList.toggle("is-visible", show);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  });
}

function animateCounter(el) {
  const to = Number(el.getAttribute("data-to") || "0");
  const decimals = Number(el.getAttribute("data-decimals") || "0");
  const suffix = el.getAttribute("data-suffix") || "";
  const from = Number(el.getAttribute("data-from") || "0");

  const duration = prefersReducedMotion() ? 1 : 900;
  const start = performance.now();

  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    // easeOutCubic
    const eased = 1 - Math.pow(1 - t, 3);
    const v = from + (to - from) * eased;
    el.textContent = `${v.toFixed(decimals)}${suffix}`;
    if (t < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

function setupCounters() {
  const els = Array.from(document.querySelectorAll("[data-counter]"));
  if (!els.length) return;
  const seen = new WeakSet();

  if (prefersReducedMotion()) {
    els.forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      const to = Number(el.getAttribute("data-to") || "0");
      const decimals = Number(el.getAttribute("data-decimals") || "0");
      const suffix = el.getAttribute("data-suffix") || "";
      el.textContent = `${to.toFixed(decimals)}${suffix}`;
    });
    return;
  }

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (seen.has(el)) return;
        seen.add(el);
        animateCounter(el);
        obs.unobserve(el);
      });
    },
    { threshold: 0.4 },
  );

  els.forEach((el) => obs.observe(el));
}

function setupSkillFilter() {
  const buttons = Array.from(document.querySelectorAll("[data-skill-filter]"));
  const cards = Array.from(document.querySelectorAll(".skill-card"));
  const tools = Array.from(document.querySelectorAll("[data-tools]"));
  if (!buttons.length || !cards.length) return;

  const setActive = (value) => {
    buttons.forEach((b) => {
      const isActive = (b.getAttribute("data-skill-filter") || "all") === value;
      b.classList.toggle("is-active", isActive);
      b.setAttribute("aria-selected", String(isActive));
    });

    cards.forEach((c) => {
      const cat = c.getAttribute("data-skill") || "";
      const show = value === "all" || cat === value;
      c.classList.toggle("is-hidden", !show);
    });

    if (tools.length) {
      tools.forEach((p) => {
        const t = p.getAttribute("data-tools") || "all";
        const show = value === "all" ? t === "all" : t === value;
        p.hidden = !show;
      });
    }
  };

  buttons.forEach((b) => {
    b.addEventListener("click", () => {
      const v = b.getAttribute("data-skill-filter") || "all";
      setActive(v);
    });
  });

  // Apply initial state on load (so tools sync too).
  const initiallyActive =
    buttons.find((b) => b.classList.contains("is-active"))?.getAttribute("data-skill-filter") || "all";
  setActive(initiallyActive);
}

function setupReveal() {
  const els = Array.from(document.querySelectorAll(".reveal"));
  if (!els.length) return;

  if (prefersReducedMotion()) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }

  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.12 },
  );

  els.forEach((el) => obs.observe(el));
}

function setupSectionTransitions() {
  const overlay = document.getElementById("pageTransition");
  if (!overlay) return;

  const isInternalHashLink = (a) => {
    if (!a) return false;
    const href = a.getAttribute("href") || "";
    return href.startsWith("#") && href.length > 1;
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const run = async (hash) => {
    if (prefersReducedMotion()) {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
      return;
    }

    overlay.classList.add("is-on");
    await sleep(90);

    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });

    // Let the scroll start, then fade out.
    await sleep(260);
    overlay.classList.remove("is-on");
  };

  document.addEventListener("click", async (e) => {
    const a = e.target?.closest?.("a");
    if (!isInternalHashLink(a)) return;

    const hash = a.getAttribute("href");
    if (!hash) return;

    e.preventDefault();
    if (window.location.hash !== hash) history.pushState(null, "", hash);
    await run(hash);
  });

  // Handle back/forward for hash navigation.
  window.addEventListener("popstate", () => {
    const hash = window.location.hash || "#top";
    run(hash);
  });
}

function removeSolidBackgroundFromImage(img) {
  if (!img || img.dataset.bgRemoved === "true") return;
  if (!(img instanceof HTMLImageElement)) return;
  if (!img.dataset.removeSolidBg) return;

  const process = () => {
    try {
      const w = img.naturalWidth || 0;
      const h = img.naturalHeight || 0;
      if (!w || !h) return;

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

      const sampleCorner = (sx, sy, size) => {
        let r = 0,
          g = 0,
          b = 0,
          n = 0;
        const x0 = clamp(sx, 0, w - 1);
        const y0 = clamp(sy, 0, h - 1);
        const x1 = clamp(x0 + size, 0, w);
        const y1 = clamp(y0 + size, 0, h);
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const i = (y * w + x) * 4;
            const a = data[i + 3];
            if (a < 16) continue;
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            n++;
          }
        }
        if (!n) return [0, 0, 0];
        return [r / n, g / n, b / n];
      };

      // Estimate solid background from corners.
      const s = Math.max(8, Math.floor(Math.min(w, h) * 0.02));
      const c1 = sampleCorner(0, 0, s);
      const c2 = sampleCorner(w - s, 0, s);
      const c3 = sampleCorner(0, h - s, s);
      const c4 = sampleCorner(w - s, h - s, s);
      const bg = [(c1[0] + c2[0] + c3[0] + c4[0]) / 4, (c1[1] + c2[1] + c3[1] + c4[1]) / 4, (c1[2] + c2[2] + c3[2] + c4[2]) / 4];

      const dist2 = (r, g, b) => {
        const dr = r - bg[0];
        const dg = g - bg[1];
        const db = b - bg[2];
        return dr * dr + dg * dg + db * db;
      };

      // Two thresholds: hard remove + soft fade for nicer edges.
      const hard = 32 * 32;
      const soft = 70 * 70;

      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a < 8) continue;

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const d = dist2(r, g, b);

        if (d <= hard) {
          data[i + 3] = 0;
        } else if (d <= soft) {
          // Feather the edge: closer to bg => more transparent.
          const t = (d - hard) / (soft - hard); // 0..1
          data[i + 3] = Math.round(a * t);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      img.dataset.bgRemoved = "true";
      img.src = canvas.toDataURL("image/png");
    } catch {
      // If anything fails, keep original image.
    }
  };

  // Wait for image decode/load to ensure pixels are available.
  if (img.complete && img.naturalWidth) {
    process();
    return;
  }
  img.addEventListener("load", process, { once: true });
}

function setupTransparentHeroLogo() {
  const img = document.querySelector("img[data-remove-solid-bg='true']");
  if (!img) return;
  removeSolidBackgroundFromImage(img);
}

setYear();
highlightActiveNav();
setupCopyButtons();
setupBackToTop();
setupCounters();
setupSkillFilter();
setupReveal();
setupTransparentHeroLogo();
setupSectionTransitions();
