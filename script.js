(() => {
  "use strict";

  const body = document.body;
  const header = document.getElementById("siteHeader");
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const focusableSelector =
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
  let reduceMotion = reduceMotionQuery.matches;

  const onMotionChange = () => { reduceMotion = reduceMotionQuery.matches; };
  reduceMotionQuery.addEventListener?.("change", onMotionChange);

  /* ----------------------------------------------------------
     Theme
     ---------------------------------------------------------- */
  const themeToggle = document.getElementById("themeToggle");
  const iconMoon = themeToggle?.querySelector(".icon-moon");
  const iconSun = themeToggle?.querySelector(".icon-sun");
  const THEME_KEY = "theme";

  const readTheme = () => { try { return localStorage.getItem(THEME_KEY); } catch { return null; } };
  const writeTheme = (t) => { try { localStorage.setItem(THEME_KEY, t); } catch { /* ignore */ } };

  const applyTheme = (theme) => {
    const isLight = theme === "light";
    body.classList.toggle("light", isLight);
    if (!themeToggle) return;
    themeToggle.setAttribute("aria-pressed", String(isLight));
    themeToggle.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
    if (iconMoon) iconMoon.style.display = isLight ? "none" : "";
    if (iconSun) iconSun.style.display = isLight ? "" : "none";
  };

  const initialTheme = () => {
    const saved = readTheme();
    if (saved === "light" || saved === "dark") return saved;
    return colorSchemeQuery.matches ? "dark" : "light";
  };

  applyTheme(initialTheme());

  themeToggle?.addEventListener("click", () => {
    const next = body.classList.contains("light") ? "dark" : "light";
    applyTheme(next);
    writeTheme(next);
  });

  colorSchemeQuery.addEventListener?.("change", () => {
    const saved = readTheme();
    if (saved === "light" || saved === "dark") return;
    applyTheme(colorSchemeQuery.matches ? "dark" : "light");
  });

  /* ----------------------------------------------------------
     Header state + scroll progress
     ---------------------------------------------------------- */
  const progressBar = document.getElementById("scrollProgressBar");

  const onScroll = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
    if (progressBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      progressBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    }
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  /* ----------------------------------------------------------
     Footer year
     ---------------------------------------------------------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ----------------------------------------------------------
     Hero entrance
     ---------------------------------------------------------- */
  document.querySelectorAll("[data-hero-item]").forEach((el) => {
    const delay = Number(el.getAttribute("data-delay") || "0");
    el.style.setProperty("--hero-delay", `${Math.max(0, delay)}ms`);
  });
  if (reduceMotion) {
    body.classList.add("hero-ready");
  } else {
    requestAnimationFrame(() => requestAnimationFrame(() => body.classList.add("hero-ready")));
  }

  /* ----------------------------------------------------------
     Reveal on scroll
     ---------------------------------------------------------- */
  const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
  revealItems.forEach((el) => {
    const delay = Number(el.getAttribute("data-delay") || "0");
    el.style.setProperty("--reveal-delay", `${Math.max(0, delay)}ms`);
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealItems.forEach((el) => io.observe(el));
  }

  /* ----------------------------------------------------------
     Animated number counters
     ---------------------------------------------------------- */
  const counters = Array.from(document.querySelectorAll(".stat-num[data-count]"));

  const runCounter = (el) => {
    const target = Number(el.getAttribute("data-count") || "0");
    const suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = `${target}${suffix}`; return; }
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = `${Math.round(target * eased)}${suffix}`;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (counters.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      counters.forEach(runCounter);
    } else {
      const cio = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            runCounter(entry.target);
            obs.unobserve(entry.target);
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach((el) => cio.observe(el));
    }
  }

  /* ----------------------------------------------------------
     Skill bars
     ---------------------------------------------------------- */
  const skillFills = Array.from(document.querySelectorAll(".skill-fill[data-fill]"));
  const fillSkills = () => {
    skillFills.forEach((bar) => {
      const v = Number(bar.getAttribute("data-fill") || "0");
      bar.style.width = `${Math.min(100, Math.max(0, v))}%`;
    });
  };
  const skillsPanel = document.querySelector(".skills-panel");
  if (reduceMotion || !("IntersectionObserver" in window) || !skillsPanel) {
    fillSkills();
  } else {
    const sio = new IntersectionObserver(
      (entries, obs) => {
        if (entries.some((e) => e.isIntersecting)) { fillSkills(); obs.disconnect(); }
      },
      { threshold: 0.3 }
    );
    sio.observe(skillsPanel);
  }

  /* ----------------------------------------------------------
     Pointer spotlight on service + hero cards
     ---------------------------------------------------------- */
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  if (!reduceMotion && finePointer) {
    document.querySelectorAll(".service-card, .hero-card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
  }

  /* ----------------------------------------------------------
     3D tilt on cards
     ---------------------------------------------------------- */
  if (!reduceMotion && finePointer) {
    const MAX_TILT = 7; // degrees
    document.querySelectorAll(".project-card, .hero-card").forEach((card) => {
      card.setAttribute("data-tilt", "");
      let raf = 0;

      const onMove = (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.transform =
            `perspective(1000px) rotateX(${(-py * MAX_TILT).toFixed(2)}deg) ` +
            `rotateY(${(px * MAX_TILT).toFixed(2)}deg) translateY(-6px)`;
        });
      };

      card.addEventListener("pointerenter", () => card.classList.add("is-tilting"));
      card.addEventListener("pointermove", onMove);
      card.addEventListener("pointerleave", () => {
        if (raf) cancelAnimationFrame(raf);
        card.classList.remove("is-tilting");
        card.style.transform = "";
      });
    });
  }

  /* ----------------------------------------------------------
     Magnetic pull on key call-to-action buttons
     ---------------------------------------------------------- */
  if (!reduceMotion && finePointer) {
    const magnets = document.querySelectorAll(
      ".nav-cta, .hero-actions .btn-primary, .contact-form .btn-lg"
    );
    magnets.forEach((btn) => {
      const STRENGTH = 0.32;
      const MAX = 9; // px
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const mx = e.clientX - (r.left + r.width / 2);
        const my = e.clientY - (r.top + r.height / 2);
        const dx = Math.max(-MAX, Math.min(MAX, mx * STRENGTH));
        const dy = Math.max(-MAX, Math.min(MAX, my * STRENGTH));
        btn.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });
  }

  /* ----------------------------------------------------------
     Smooth anchor scroll with header offset
     ---------------------------------------------------------- */
  const headerOffset = () => (header ? header.offsetHeight + 18 : 18);

  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute("href");
    if (!id || id === "#") { e.preventDefault(); return; }
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const y = target.getBoundingClientRect().top + window.scrollY - headerOffset();
    window.scrollTo({ top: Math.max(0, y), behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* ----------------------------------------------------------
     Active nav link via scroll spy
     ---------------------------------------------------------- */
  const navLinks = Array.from(document.querySelectorAll('[data-nav-link][href^="#"]'));
  const sections = navLinks
    .map((l) => document.querySelector(l.getAttribute("href")))
    .filter(Boolean)
    .filter((s, i, arr) => arr.indexOf(s) === i);

  const setActive = (id) => {
    navLinks.forEach((l) => {
      const active = l.getAttribute("href") === `#${id}`;
      l.classList.toggle("active", active);
      if (active) l.setAttribute("aria-current", "true");
      else l.removeAttribute("aria-current");
    });
  };

  if (sections.length && "IntersectionObserver" in window) {
    const navIo = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.15, 0.4, 0.7] }
    );
    sections.forEach((s) => navIo.observe(s));
  }

  /* ----------------------------------------------------------
     Mobile nav
     ---------------------------------------------------------- */
  const menuToggle = document.getElementById("menuToggle");
  const panel = document.getElementById("mobileNavPanel");
  const overlay = document.getElementById("mobileNavOverlay");
  const menuClose = document.getElementById("mobileNavClose");
  const mobileLinks = Array.from(document.querySelectorAll("[data-mobile-link]"));
  let lastMenuFocus = null;
  let menuTimer = null;

  const menuFocusable = () =>
    panel ? Array.from(panel.querySelectorAll(focusableSelector)).filter((el) => el.tabIndex !== -1) : [];

  const setMenuHidden = (hidden) => {
    if (panel) panel.hidden = hidden;
    if (overlay) overlay.hidden = hidden;
  };

  const openMenu = () => {
    if (!panel || !overlay || !menuToggle) return;
    lastMenuFocus = document.activeElement;
    setMenuHidden(false);
    menuToggle.setAttribute("aria-expanded", "true");
    clearTimeout(menuTimer);
    requestAnimationFrame(() => body.classList.add("menu-open"));
    (menuClose || panel).focus({ preventScroll: true });
  };

  const closeMenu = (restore = true) => {
    if (!panel || !overlay || !menuToggle) return;
    body.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
    const finish = () => {
      setMenuHidden(true);
      if (restore && lastMenuFocus?.focus) lastMenuFocus.focus({ preventScroll: true });
    };
    if (reduceMotion) { finish(); return; }
    clearTimeout(menuTimer);
    menuTimer = setTimeout(finish, 320);
  };

  menuToggle?.addEventListener("click", () =>
    body.classList.contains("menu-open") ? closeMenu() : openMenu()
  );
  menuClose?.addEventListener("click", () => closeMenu());
  overlay?.addEventListener("click", () => closeMenu());
  mobileLinks.forEach((l) => l.addEventListener("click", () => closeMenu(false)));

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 960 && body.classList.contains("menu-open")) {
      body.classList.remove("menu-open");
      menuToggle?.setAttribute("aria-expanded", "false");
      setMenuHidden(true);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!body.classList.contains("menu-open") || !panel || panel.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); closeMenu(); return; }
    if (e.key !== "Tab") return;
    const f = menuFocusable();
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (!panel.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ----------------------------------------------------------
     Contact form (client-side validation)
     ---------------------------------------------------------- */
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");

  const setStatus = (msg, type) => {
    if (!status) return;
    status.textContent = msg;
    status.classList.remove("is-error", "is-success");
    if (type) status.classList.add(type);
  };

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();

    if (name.length < 2) return setStatus("Please enter your full name.", "is-error");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setStatus("Please enter a valid email address.", "is-error");
    if (message.length < 10) return setStatus("Please add at least 10 characters to your message.", "is-error");

    setStatus("Thanks! Your message is ready — connect this form to Formspree or EmailJS to receive it.", "is-success");
    form.reset();
  });

  /* ----------------------------------------------------------
     Copy email
     ---------------------------------------------------------- */
  document.querySelectorAll("[data-copy-email]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const email = btn.getAttribute("data-copy-email");
      if (!email) return;
      const original = btn.innerHTML;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(email);
        } else {
          const t = document.createElement("textarea");
          t.value = email; t.style.position = "absolute"; t.style.left = "-9999px";
          document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove();
        }
        btn.textContent = "Copied to clipboard ✓";
      } catch {
        btn.textContent = "Press Ctrl+C to copy";
      }
      setTimeout(() => { btn.innerHTML = original; }, 1800);
    });
  });

  /* ----------------------------------------------------------
     Project case-study modal
     ---------------------------------------------------------- */
  const modal = document.getElementById("projectModal");
  const dialog = modal?.querySelector(".project-modal__dialog");
  const fields = {
    category: document.getElementById("modalCategory"),
    title: document.getElementById("modalTitle"),
    overview: document.getElementById("modalOverview"),
    role: document.getElementById("modalRole"),
    stack: document.getElementById("modalStack"),
    problem: document.getElementById("modalProblem"),
    solution: document.getElementById("modalSolution"),
  };
  const modalLive = document.getElementById("modalLive");
  const modalGitHub = document.getElementById("modalGitHub");
  let lastFocus = null;
  let closeTimer = null;

  const modalFocusable = () =>
    modal ? Array.from(modal.querySelectorAll(focusableSelector)).filter((el) => el.tabIndex !== -1 && el.offsetParent !== null) : [];

  const val = (btn, key, fallback = "") => {
    const v = btn.dataset[key];
    return v && v.trim() ? v.trim() : fallback;
  };

  const fillModal = (btn) => {
    if (fields.category) fields.category.textContent = val(btn, "category", "Case study");
    if (fields.title) fields.title.textContent = val(btn, "title", "Project");
    if (fields.overview) fields.overview.textContent = val(btn, "overview");
    if (fields.role) fields.role.textContent = val(btn, "role");
    if (fields.stack) fields.stack.textContent = val(btn, "stack");
    if (fields.problem) fields.problem.textContent = val(btn, "problem");
    if (fields.solution) fields.solution.textContent = val(btn, "solution");

    const live = val(btn, "live");
    const github = val(btn, "github");
    if (modalLive) {
      if (live) { modalLive.href = live; modalLive.hidden = false; }
      else { modalLive.hidden = true; }
    }
    if (modalGitHub) {
      if (github) { modalGitHub.href = github; modalGitHub.hidden = false; }
      else { modalGitHub.hidden = true; }
    }
  };

  const openModal = (btn) => {
    if (!modal || !dialog) return;
    lastFocus = btn instanceof HTMLElement ? btn : document.activeElement;
    fillModal(btn);
    modal.hidden = false;
    body.classList.add("modal-open");
    clearTimeout(closeTimer);
    if (reduceMotion) modal.classList.add("is-open");
    else requestAnimationFrame(() => modal.classList.add("is-open"));
    dialog.scrollTop = 0;
    dialog.focus({ preventScroll: true });
  };

  const closeModal = () => {
    if (!modal || modal.hidden) return;
    modal.classList.remove("is-open");
    body.classList.remove("modal-open");
    const finish = () => {
      modal.hidden = true;
      if (lastFocus?.focus) lastFocus.focus({ preventScroll: true });
    };
    if (reduceMotion) { finish(); return; }
    clearTimeout(closeTimer);
    closeTimer = setTimeout(finish, 300);
  };

  document.querySelectorAll(".project-open").forEach((btn) =>
    btn.addEventListener("click", () => openModal(btn))
  );

  modal?.addEventListener("click", (e) => {
    if (e.target.closest("[data-modal-close]")) { e.preventDefault(); closeModal(); }
  });

  document.addEventListener("keydown", (e) => {
    if (!modal || modal.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); closeModal(); return; }
    if (e.key !== "Tab") return;
    const f = modalFocusable();
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (!modal.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
})();
