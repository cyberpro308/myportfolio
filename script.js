(() => {
  const body = document.body;
  const header = document.getElementById("siteHeader");
  const scrollProgressBar = document.getElementById("scrollProgressBar");
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
  let reduceMotion = reduceMotionQuery.matches;

  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = themeToggle ? themeToggle.querySelector(".theme-toggle__icon") : null;
  const themeLabel = themeToggle ? themeToggle.querySelector(".theme-toggle__label") : null;
  const storageThemeKey = "theme";
  const readStoredTheme = () => {
    try {
      return localStorage.getItem(storageThemeKey);
    } catch (_) {
      return null;
    }
  };
  const writeStoredTheme = (theme) => {
    try {
      localStorage.setItem(storageThemeKey, theme);
    } catch (_) {
      // Ignore storage write failures (privacy mode / disabled storage).
    }
  };

  const updateThemeUI = (theme) => {
    const isLight = theme === "light";
    body.classList.toggle("light", isLight);

    if (!themeToggle) return;

    themeToggle.setAttribute("aria-pressed", String(isLight));
    themeToggle.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
    if (themeIcon) themeIcon.textContent = isLight ? "☀️" : "🌙";
    if (themeLabel) themeLabel.textContent = isLight ? "Light" : "Dark";
  };

  const getInitialTheme = () => {
    const saved = readStoredTheme();
    if (saved === "light" || saved === "dark") return saved;
    return colorSchemeQuery.matches ? "dark" : "light";
  };

  updateThemeUI(getInitialTheme());

  themeToggle?.addEventListener("click", () => {
    const nextTheme = body.classList.contains("light") ? "dark" : "light";
    updateThemeUI(nextTheme);
    writeStoredTheme(nextTheme);
  });

  if (typeof colorSchemeQuery.addEventListener === "function") {
    colorSchemeQuery.addEventListener("change", () => {
      const saved = readStoredTheme();
      if (saved === "light" || saved === "dark") return;
      updateThemeUI(colorSchemeQuery.matches ? "dark" : "light");
    });
  } else if (typeof colorSchemeQuery.addListener === "function") {
    colorSchemeQuery.addListener(() => {
      const saved = readStoredTheme();
      if (saved === "light" || saved === "dark") return;
      updateThemeUI(colorSchemeQuery.matches ? "dark" : "light");
    });
  }

  const updateReduceMotion = () => {
    reduceMotion = reduceMotionQuery.matches;
  };

  if (typeof reduceMotionQuery.addEventListener === "function") {
    reduceMotionQuery.addEventListener("change", updateReduceMotion);
  } else if (typeof reduceMotionQuery.addListener === "function") {
    reduceMotionQuery.addListener(updateReduceMotion);
  }

  const updateHeaderState = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 10);
  };

  const updateScrollProgress = () => {
    if (!scrollProgressBar) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
    scrollProgressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  };

  updateHeaderState();
  updateScrollProgress();
  window.addEventListener("scroll", updateHeaderState, { passive: true });
  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  window.addEventListener("resize", updateScrollProgress, { passive: true });

  const heroItems = Array.from(document.querySelectorAll("[data-hero-item]"));
  heroItems.forEach((item) => {
    const delay = Number(item.getAttribute("data-delay") || "0");
    item.style.setProperty("--hero-delay", `${Math.max(0, delay)}ms`);
  });

  if (reduceMotion) {
    body.classList.add("hero-ready");
  } else {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        body.classList.add("hero-ready");
      });
    });
  }

  const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
  revealItems.forEach((item) => {
    const delay = Number(item.getAttribute("data-delay") || "0");
    item.style.setProperty("--reveal-delay", `${Math.max(0, delay)}ms`);
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const spotlightTargets = Array.from(document.querySelectorAll(".card-glass, .project-modal__dialog"));
  if (!reduceMotion) {
    spotlightTargets.forEach((target) => {
      target.addEventListener("pointermove", (event) => {
        const rect = target.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        target.style.setProperty("--spot-x", `${x}px`);
        target.style.setProperty("--spot-y", `${y}px`);
      });
    });
  }

  const getHeaderOffset = () => (header ? header.offsetHeight + 16 : 16);

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute("href");
    if (!targetId || targetId === "#") {
      event.preventDefault();
      return;
    }

    const target = document.querySelector(targetId);
    if (!target) return;

    event.preventDefault();
    const y = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();

    window.scrollTo({
      top: Math.max(0, y),
      behavior: reduceMotion ? "auto" : "smooth"
    });
  });

  const navLinks = Array.from(document.querySelectorAll('[data-nav-link][href^="#"]'));
  const trackedSections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean)
    .filter((section, index, sections) => sections.indexOf(section) === index);

  const setActiveNav = (id) => {
    navLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  if (trackedSections.length) {
    setActiveNav(trackedSections[0].id);
  }

  if (trackedSections.length && "IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible && visible.target && visible.target.id) {
          setActiveNav(visible.target.id);
        }
      },
      {
        rootMargin: "-24% 0px -60% 0px",
        threshold: [0.2, 0.35, 0.5, 0.7]
      }
    );

    trackedSections.forEach((section) => navObserver.observe(section));
  }

  const menuToggle = document.getElementById("menuToggle");
  const mobileNavPanel = document.getElementById("mobileNavPanel");
  const mobileNavOverlay = document.getElementById("mobileNavOverlay");
  const mobileNavClose = document.getElementById("mobileNavClose");
  const mobileNavLinks = Array.from(document.querySelectorAll("[data-mobile-link]"));
  let lastMenuFocused = null;
  let menuCloseTimer = null;

  const getMenuFocusable = () => {
    if (!mobileNavPanel) return [];
    return Array.from(mobileNavPanel.querySelectorAll(focusableSelector)).filter((element) => {
      if (!(element instanceof HTMLElement)) return false;
      return !element.hasAttribute("disabled") && element.tabIndex !== -1;
    });
  };

  const setMenuHidden = (hidden) => {
    if (mobileNavPanel) mobileNavPanel.hidden = hidden;
    if (mobileNavOverlay) mobileNavOverlay.hidden = hidden;
  };

  const openMenu = () => {
    if (!mobileNavPanel || !mobileNavOverlay || !menuToggle) return;
    lastMenuFocused = document.activeElement;
    setMenuHidden(false);
    menuToggle.setAttribute("aria-expanded", "true");
    window.clearTimeout(menuCloseTimer);
    window.requestAnimationFrame(() => {
      body.classList.add("menu-open");
    });
    (mobileNavClose || mobileNavPanel).focus({ preventScroll: true });
  };

  const closeMenu = (shouldRestoreFocus = true) => {
    if (!mobileNavPanel || !mobileNavOverlay || !menuToggle) return;
    body.classList.remove("menu-open");
    menuToggle.setAttribute("aria-expanded", "false");

    const finishClose = () => {
      setMenuHidden(true);
      if (
        shouldRestoreFocus &&
        lastMenuFocused &&
        typeof lastMenuFocused.focus === "function"
      ) {
        lastMenuFocused.focus({ preventScroll: true });
      }
    };

    if (reduceMotion) {
      finishClose();
      return;
    }

    window.clearTimeout(menuCloseTimer);
    menuCloseTimer = window.setTimeout(finishClose, 220);
  };

  menuToggle?.addEventListener("click", () => {
    if (body.classList.contains("menu-open")) {
      closeMenu();
      return;
    }
    openMenu();
  });

  mobileNavClose?.addEventListener("click", () => closeMenu());
  mobileNavOverlay?.addEventListener("click", () => closeMenu());
  mobileNavLinks.forEach((link) => {
    link.addEventListener("click", () => closeMenu(false));
  });

  window.addEventListener("resize", () => {
    if (!menuToggle || !mobileNavPanel || !mobileNavOverlay) return;
    if (window.innerWidth >= 960 && body.classList.contains("menu-open")) {
      body.classList.remove("menu-open");
      menuToggle.setAttribute("aria-expanded", "false");
      setMenuHidden(true);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!body.classList.contains("menu-open") || !mobileNavPanel || mobileNavPanel.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = getMenuFocusable();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (!mobileNavPanel.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
      return;
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const skillFills = Array.from(document.querySelectorAll(".skill-fill[data-fill]"));
  const skillsSection = document.getElementById("skills");

  const fillSkillBars = () => {
    skillFills.forEach((bar) => {
      const fill = Number(bar.getAttribute("data-fill") || "0");
      bar.style.width = `${Math.min(100, Math.max(0, fill))}%`;
    });
  };

  if (reduceMotion || !("IntersectionObserver" in window) || !skillsSection) {
    fillSkillBars();
  } else {
    const skillsObserver = new IntersectionObserver(
      (entries, observer) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          fillSkillBars();
          observer.disconnect();
        }
      },
      { threshold: 0.28 }
    );

    skillsObserver.observe(skillsSection);
  }

  const contactForm = document.getElementById("contactForm");
  const formStatus = document.getElementById("formStatus");
  const copyEmailButtons = Array.from(document.querySelectorAll("[data-copy-email]"));

  const setFormStatus = (message, type) => {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.classList.remove("is-error", "is-success");
    if (type) formStatus.classList.add(type);
  };

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const formData = new FormData(contactForm);
      const name = String(formData.get("name") || "").trim();
      const email = String(formData.get("email") || "").trim();
      const message = String(formData.get("message") || "").trim();

      if (name.length < 2) {
        setFormStatus("Please enter your full name.", "is-error");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFormStatus("Please enter a valid email address.", "is-error");
        return;
      }

      if (message.length < 10) {
        setFormStatus("Please add at least 10 characters to your message.", "is-error");
        return;
      }

      setFormStatus("Message ready. Connect this form to Formspree or EmailJS.", "is-success");
      contactForm.reset();
    });
  }

  copyEmailButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const email = button.getAttribute("data-copy-email");
      if (!email) return;

      const originalLabel = button.textContent || "Copy Email";

      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
          await navigator.clipboard.writeText(email);
        } else {
          const helper = document.createElement("textarea");
          helper.value = email;
          helper.setAttribute("readonly", "");
          helper.style.position = "absolute";
          helper.style.left = "-9999px";
          document.body.appendChild(helper);
          helper.select();
          document.execCommand("copy");
          helper.remove();
        }

        button.textContent = "Copied";
      } catch (_) {
        button.textContent = "Unable to copy";
      }

      window.setTimeout(() => {
        button.textContent = originalLabel;
      }, 1500);
    });
  });

  const modal = document.getElementById("projectModal");
  const modalDialog = modal ? modal.querySelector(".project-modal__dialog") : null;
  const modalTitle = document.getElementById("modalTitle");
  const modalOverview = document.getElementById("modalOverview");
  const modalRole = document.getElementById("modalRole");
  const modalStack = document.getElementById("modalStack");
  const modalProblem = document.getElementById("modalProblem");
  const modalSolution = document.getElementById("modalSolution");
  const modalLive = document.getElementById("modalLive");
  const modalGitHub = document.getElementById("modalGitHub");

  const openButtons = Array.from(document.querySelectorAll(".project-open"));
  const closeButtons = modal ? Array.from(modal.querySelectorAll("[data-modal-close]")) : [];

  let lastFocusedElement = null;
  let closeTimer = null;

  const getFocusableInModal = () => {
    if (!modal) return [];
    return Array.from(modal.querySelectorAll(focusableSelector)).filter((element) => {
      if (!(element instanceof HTMLElement)) return false;
      return !element.hasAttribute("disabled") && element.tabIndex !== -1;
    });
  };

  const setModalContent = (button) => {
    if (!button) return;

    const getValue = (key, fallback = "") => {
      const value = button.dataset[key];
      return value && value.trim().length ? value.trim() : fallback;
    };

    if (modalTitle) modalTitle.textContent = getValue("title", "Project");
    if (modalOverview) modalOverview.textContent = getValue("overview");
    if (modalRole) modalRole.textContent = getValue("role");
    if (modalStack) modalStack.textContent = getValue("stack");
    if (modalProblem) modalProblem.textContent = getValue("problem");
    if (modalSolution) modalSolution.textContent = getValue("solution");

    const liveLink = getValue("live", "#");
    const githubLink = getValue("github", "#");

    if (modalLive) modalLive.href = liveLink;
    if (modalGitHub) modalGitHub.href = githubLink;
  };

  const openModal = (button) => {
    if (!modal || !modalDialog) return;

    lastFocusedElement = button instanceof HTMLElement ? button : document.activeElement;
    setModalContent(button);

    modal.hidden = false;
    body.classList.add("modal-open");

    window.clearTimeout(closeTimer);
    if (reduceMotion) {
      modal.classList.add("is-open");
    } else {
      window.requestAnimationFrame(() => {
        modal.classList.add("is-open");
      });
    }

    modalDialog.focus({ preventScroll: true });
  };

  const closeModal = () => {
    if (!modal || modal.hidden) return;

    modal.classList.remove("is-open");
    body.classList.remove("modal-open");

    const finishClose = () => {
      modal.hidden = true;
      if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
        lastFocusedElement.focus({ preventScroll: true });
      }
    };

    if (reduceMotion) {
      finishClose();
      return;
    }

    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(finishClose, 240);
  };

  openButtons.forEach((button) => {
    button.addEventListener("click", () => openModal(button));
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeModal();
    });
  });

  modal?.addEventListener("click", (event) => {
    const closeTrigger = event.target.closest("[data-modal-close]");
    if (!closeTrigger) return;
    event.preventDefault();
    closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (!modal || modal.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = getFocusableInModal();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (!modal.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
      return;
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
})();
