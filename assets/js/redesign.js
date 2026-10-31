/* Hand-written interactions for ShirakawaFM. No libraries, no requests. */
(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => motionQuery.matches;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  const EMAIL = (() => {
    const link = $('a[href^="mailto:"]');
    if (!link) return 'shirakawafm@outlook.com';
    return decodeURIComponent(link.getAttribute('href').slice(7).split('?')[0]);
  })();

  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  const visibleFocusables = (container) =>
    $$(focusableSelector, container).filter((element) => element.getClientRects().length > 0);

  const trapFocus = (container, event) => {
    const items = visibleFocusables(container);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (!container.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
      return;
    }
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  /* Hero characters */

  let charIndex = 0;
  $$('[data-split]').forEach((word) => {
    const text = word.textContent;
    word.textContent = '';
    Array.from(text).forEach((character) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.style.setProperty('--i', String(charIndex));
      charIndex += 1;
      span.textContent = character;
      word.appendChild(span);
    });
  });

  const heroTitle = $('.hero__title');
  const heroWords = $$('.hero__word');
  let heroFitQueued = false;

  const fitHeroTitle = () => {
    if (!heroTitle || !heroWords.length) return;
    heroTitle.style.fontSize = '';
    const baseSize = parseFloat(getComputedStyle(heroTitle).fontSize);
    const available = heroTitle.clientWidth;
    let widest = 0;

    heroWords.forEach((word) => {
      widest = Math.max(widest, word.getBoundingClientRect().width);
    });

    if (!baseSize || !available || !widest) return;
    heroTitle.style.fontSize = `${(baseSize * (available * 0.98) / widest).toFixed(2)}px`;
  };

  const queueHeroFit = () => {
    if (heroFitQueued) return;
    heroFitQueued = true;
    requestAnimationFrame(() => {
      heroFitQueued = false;
      fitHeroTitle();
    });
  };

  queueHeroFit();
  window.addEventListener('resize', queueHeroFit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(queueHeroFit).catch(() => {});

  /* Console typewriter */

  let consoleStarted = false;

  function startConsole() {
    const lines = $$('[data-console-line]');
    if (consoleStarted || reduced() || !lines.length) return;
    consoleStarted = true;

    const caret = $('.console__caret');
    const texts = lines.map((line) => line.textContent.trim());

    try {
      lines.forEach((line) => {
        line.textContent = '';
        line.style.minHeight = '1.55em';
      });

      let lineIndex = 0;
      let character = 0;

      const type = () => {
        const line = lines[lineIndex];
        character += 1;
        line.textContent = texts[lineIndex].slice(0, character);
        if (caret) line.appendChild(caret);

        if (character < texts[lineIndex].length) {
          window.setTimeout(type, 11 + Math.random() * 16);
        } else if (lineIndex < lines.length - 1) {
          lineIndex += 1;
          character = 0;
          window.setTimeout(type, 260);
        }
      };

      window.setTimeout(type, 160);
    } catch (error) {
      lines.forEach((line, index) => {
        line.textContent = texts[index];
      });
      if (caret) lines[lines.length - 1].appendChild(caret);
    }
  }

  /* Boot */

  const boot = $('[data-boot]');
  let bootDone = false;

  function finishBoot() {
    if (bootDone) return;
    bootDone = true;

    body.classList.remove('is-loading');
    root.classList.add('is-ready');

    if (boot) {
      const count = $('[data-boot-count]', boot);
      const bar = $('[data-boot-bar]', boot);
      if (count) count.textContent = '100';
      if (bar) bar.style.transform = 'scaleX(1)';
      boot.classList.add('is-done');
      window.setTimeout(() => boot.remove(), reduced() ? 0 : 1000);
    }
  }

  if (!boot || reduced()) {
    finishBoot();
  } else {
    const count = $('[data-boot-count]', boot);
    const bar = $('[data-boot-bar]', boot);
    const startedAt = performance.now();
    const minimum = 1350;
    let waitingForFonts = false;

    const step = (now) => {
      if (bootDone) return;
      const progress = Math.min((now - startedAt) / minimum, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      if (count) count.textContent = String(Math.round(eased * 94)).padStart(2, '0');
      if (bar) bar.style.transform = `scaleX(${(eased * 0.94).toFixed(3)})`;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else if (!waitingForFonts) {
        waitingForFonts = true;
        const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
        Promise.race([fonts, new Promise((resolve) => window.setTimeout(resolve, 700))])
          .then(() => window.setTimeout(finishBoot, 120));
      }
    };

    requestAnimationFrame(step);
  }

  window.setTimeout(finishBoot, 6000);
  startConsole();

  /* Clocks and year */

  function setupClocks() {
    const clocks = $$('[data-clock]');
    const yearNode = $('[data-year]');
    let formatter = null;
    let yearFormatter = null;

    try {
      formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Shanghai',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
      });
      yearFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric'
      });
    } catch (error) {
      formatter = null;
    }

    const time = () => {
      if (formatter) return formatter.format(new Date());
      return new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(11, 19);
    };

    const update = () => {
      const value = time();
      clocks.forEach((clock) => {
        if (clock.textContent !== value) clock.textContent = value;
      });
    };

    update();
    if (clocks.length) window.setInterval(update, 1000);

    if (yearNode) {
      const now = new Date();
      yearNode.textContent = yearFormatter
        ? yearFormatter.format(now)
        : String(now.getUTCFullYear());
    }
  }

  /* Contrast mode */

  function setupContrast() {
    const button = $('[data-contrast]');
    if (!button) return;
    const themeColor = $('meta[name="theme-color"]');

    const sync = () => {
      const contrast = root.dataset.mode === 'contrast';
      button.setAttribute('aria-pressed', String(contrast));
      button.setAttribute('aria-label', contrast ? '切换到红色主题' : '切换到高对比模式');
      if (themeColor) themeColor.setAttribute('content', contrast ? '#fff2ed' : '#f40c3f');
    };

    button.addEventListener('click', () => {
      const next = root.dataset.mode === 'contrast' ? 'red' : 'contrast';
      root.dataset.mode = next;
      try {
        window.localStorage.setItem('sfm-mode', next);
      } catch (error) {
        /* storage can be unavailable in private windows */
      }
      sync();
    });

    sync();
  }

  /* Binary strips */

  function setupBinary() {
    const strips = $$('[data-binary]');
    if (!strips.length) return;

    const bits = [];

    strips.forEach((strip) => {
      for (let rowIndex = 0; rowIndex < 3; rowIndex += 1) {
        const row = document.createElement('div');
        row.className = 'binary__row';

        for (let chunkIndex = 0; chunkIndex < 6; chunkIndex += 1) {
          const chunk = document.createElement('span');
          chunk.className = 'binary__code';

          for (let bitIndex = 0; bitIndex < 44; bitIndex += 1) {
            const bit = document.createElement('span');
            bit.className = 'binary__bit';
            bit.textContent = Math.random() < 0.5 ? '0' : '1';
            bits.push(bit);
            chunk.appendChild(bit);
          }

          row.appendChild(chunk);

          const stripe = document.createElement('span');
          stripe.className = 'binary__stripe';
          row.appendChild(stripe);
        }

        strip.appendChild(row);
      }
    });

    if (reduced() || !bits.length) return;

    window.setInterval(() => {
      if (document.hidden) return;
      for (let index = 0; index < 3; index += 1) {
        const bit = bits[Math.floor(Math.random() * bits.length)];
        bit.textContent = bit.textContent === '0' ? '1' : '0';
      }
    }, 150);
  }

  /* Wave field */

  function setupWaves() {
    const canvas = $('[data-waves]');
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const hero = canvas.parentElement;
    const pointer = { x: -9999, y: -9999 };
    let width = 0;
    let height = 0;
    let pixelRatio = 0;
    let frameId = 0;
    let running = false;
    let visible = true;

    const draw = (timeStamp) => {
      const time = timeStamp * 0.001;
      context.clearRect(0, 0, width, height);

      for (let layer = 0; layer < 3; layer += 1) {
        const baseY = height * (0.34 + layer * 0.19);
        const amplitude = height * (0.032 + layer * 0.02);
        const waves = 2.2 + layer * 1.3;
        const speed = 0.12 + layer * 0.05;

        context.beginPath();

        for (let x = 0; x <= width + 8; x += 8) {
          const phase = (x / Math.max(width, 1)) * Math.PI * 2 * waves;
          const primary = Math.sin(phase + time * speed + layer * 1.9);
          const detail = Math.sin(phase * 2.7 - time * speed * 1.7) * 0.26;
          let y = baseY + (primary + detail) * amplitude;

          const dx = x - pointer.x;
          const dy = baseY - pointer.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 260) {
            const pull = 1 - distance / 260;
            y += Math.sin(pull * Math.PI) * (pointer.y - baseY) * 0.14 * pull;
          }

          if (x === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }

        context.strokeStyle = ['rgba(18, 0, 1, 0.2)', 'rgba(18, 0, 1, 0.13)', 'rgba(18, 0, 1, 0.08)'][layer];
        context.lineWidth = 1;
        context.stroke();
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const nextWidth = Math.max(1, rect.width);
      const nextHeight = Math.max(1, rect.height);
      const nextRatio = Math.min(window.devicePixelRatio || 1, 2);

      if (nextWidth === width && nextHeight === height && nextRatio === pixelRatio) return;

      width = nextWidth;
      height = nextHeight;
      pixelRatio = nextRatio;
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      draw(performance.now());
    };

    const frame = (timeStamp) => {
      if (!running) return;
      draw(timeStamp);
      frameId = requestAnimationFrame(frame);
    };

    const start = () => {
      if (reduced() || running || !visible || document.hidden) return;
      running = true;
      frameId = requestAnimationFrame(frame);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(frameId);
    };

    if (hero) {
      hero.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'touch') return;
        const rect = canvas.getBoundingClientRect();
        pointer.x = event.clientX - rect.left;
        pointer.y = event.clientY - rect.top;
      }, { passive: true });

      hero.addEventListener('pointerleave', () => {
        pointer.x = -9999;
        pointer.y = -9999;
      });
    }

    if ('ResizeObserver' in window) {
      new ResizeObserver(resize).observe(canvas);
    } else {
      window.addEventListener('resize', resize);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        if (visible) {
          resize();
          start();
        } else {
          stop();
        }
      }, { rootMargin: '100px' }).observe(canvas);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
    });

    resize();
    if (reduced()) draw(performance.now());
    else start();
  }

  /* Reveals */

  function setupReveals() {
    const items = $$('[data-reveal]');
    if (!items.length) return;

    if (reduced() || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-in'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    items.forEach((item) => observer.observe(item));
  }

  /* Custom cursor */

  function setupCursor() {
    const layer = $('[data-cursor-layer]');
    const label = $('[data-cursor-label]');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!layer || !label || !finePointer.matches) return;

    let visible = false;

    const hide = () => {
      visible = false;
      layer.classList.remove('is-visible');
    };

    window.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;

      layer.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;

      if (!visible) {
        visible = true;
        root.classList.add('has-cursor');
        layer.classList.add('is-visible');
      }

      const target = event.target instanceof Element ? event.target.closest('[data-cursor]') : null;

      if (target) {
        const text = target.getAttribute('data-cursor') || '';
        if (label.textContent !== text) label.textContent = text;
        layer.classList.add('is-active');
      } else {
        layer.classList.remove('is-active');
        if (label.textContent) label.textContent = '';
      }
    }, { passive: true });

    document.addEventListener('mouseleave', hide);
    window.addEventListener('blur', hide);

    const sync = () => {
      if (finePointer.matches) return;
      root.classList.remove('has-cursor');
      hide();
    };

    if (finePointer.addEventListener) finePointer.addEventListener('change', sync);
  }

  /* Navigation state, progress and parallax */

  function setupScroll() {
    const links = $$('[data-nav]');
    const sections = links
      .map((link) => {
        const href = link.getAttribute('href');
        return {
          link,
          section: href && href.charAt(0) === '#' ? $(href) : null
        };
      })
      .filter((item) => item.section);

    const progress = $('[data-progress]');
    const letter = $('[data-parallax]');
    const notes = $$('[data-speed]');
    let queued = false;

    const update = () => {
      queued = false;
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const viewport = window.innerHeight;
      const scrollable = Math.max(1, document.documentElement.scrollHeight - viewport);

      if (progress) {
        const ratio = Math.max(0, Math.min(scrollY / scrollable, 1));
        progress.style.transform = `scaleX(${ratio.toFixed(4)})`;
      }

      if (sections.length) {
        const line = viewport * 0.38;
        let active = null;

        sections.forEach((item) => {
          if (item.section.getBoundingClientRect().top <= line) active = item.link;
        });

        links.forEach((link) => {
          const isActive = link === active;
          link.classList.toggle('is-active', isActive);
          if (isActive) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }

      if (reduced()) return;

      if (letter) {
        const rect = letter.getBoundingClientRect();
        if (rect.bottom > -120 && rect.top < viewport + 120) {
          const speed = parseFloat(letter.dataset.parallax) || 0;
          const offset = (viewport / 2 - (rect.top + rect.height / 2)) * speed;
          letter.style.setProperty('--shift', `${offset.toFixed(1)}px`);
        }
      }

      notes.forEach((note) => {
        const rect = note.getBoundingClientRect();
        if (rect.bottom < -80 || rect.top > viewport + 80) return;
        const speed = parseFloat(note.dataset.speed) || 0;
        const offset = (viewport / 2 - (rect.top + rect.height / 2)) * speed;
        note.style.setProperty('--py', `${offset.toFixed(1)}px`);
      });
    };

    const queue = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };

    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    window.addEventListener('load', queue);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(queue).catch(() => {});
    update();
  }

  /* Mobile index */

  function setupMenu() {
    const menu = $('[data-menu]');
    const openButton = $('[data-menu-open]');
    const closeButton = $('[data-menu-close]');
    const menuLinks = $$('[data-menu-link]');
    if (!menu || !openButton) return;

    let open = false;
    let returnFocus = null;

    const setMenu = (next, restoreFocus = true) => {
      if (next === open) return;
      open = next;
      menu.classList.toggle('is-open', next);
      openButton.setAttribute('aria-expanded', String(next));
      menu.setAttribute('aria-hidden', String(!next));

      if (next) {
        returnFocus = document.activeElement;
        menu.removeAttribute('inert');
        body.classList.add('menu-open');
        if (closeButton) closeButton.focus();
      } else {
        menu.setAttribute('inert', '');
        body.classList.remove('menu-open');
        if (restoreFocus && returnFocus && typeof returnFocus.focus === 'function') {
          returnFocus.focus();
        }
        returnFocus = null;
      }
    };

    openButton.addEventListener('click', () => setMenu(true));
    if (closeButton) closeButton.addEventListener('click', () => setMenu(false));
    menuLinks.forEach((link) => {
      link.addEventListener('click', () => setMenu(false, false));
    });

    document.addEventListener('keydown', (event) => {
      if (!open) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenu(false);
      } else if (event.key === 'Tab') {
        trapFocus(menu, event);
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1000 && open) setMenu(false, false);
    });
  }

  /* Reply panel */

  function setupSay() {
    const say = $('[data-say]');
    const openButton = $('[data-say-open]');
    const panel = $('[data-say-panel]');
    const closeButton = $('[data-say-close]');
    if (!say || !openButton || !panel) return;

    let open = false;
    let returnFocus = null;

    const setSay = (next) => {
      if (next === open) return;
      open = next;
      say.classList.toggle('is-open', next);
      openButton.setAttribute('aria-expanded', String(next));
      panel.setAttribute('aria-hidden', String(!next));

      if (next) {
        returnFocus = document.activeElement;
        const rect = openButton.getBoundingClientRect();
        panel.style.setProperty('--say-x', `${Math.round(rect.left + rect.width / 2)}px`);
        panel.style.setProperty('--say-y', `${Math.round(rect.top + rect.height / 2)}px`);
        panel.removeAttribute('inert');
        body.classList.add('say-open');
        if (closeButton) closeButton.focus();
      } else {
        panel.setAttribute('inert', '');
        body.classList.remove('say-open');
        if (returnFocus && typeof returnFocus.focus === 'function') returnFocus.focus();
        returnFocus = null;
      }
    };

    openButton.addEventListener('click', () => setSay(true));
    if (closeButton) closeButton.addEventListener('click', () => setSay(false));

    panel.addEventListener('click', (event) => {
      if (event.target === panel) setSay(false);
    });

    document.addEventListener('keydown', (event) => {
      if (!open) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setSay(false);
      } else if (event.key === 'Tab') {
        trapFocus(panel, event);
      }
    });
  }

  /* Email copy */

  function setupCopy() {
    const button = $('[data-copy]');
    if (!button) return;
    const label = $('[data-copy-label]', button);
    const original = label ? label.textContent : 'COPY EMAIL';
    let timer = 0;

    if (label) label.setAttribute('aria-live', 'polite');

    const legacyCopy = (text) => {
      const field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.top = '-1000px';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      const copied = document.execCommand('copy');
      field.remove();
      if (!copied) throw new Error('copy failed');
    };

    const feedback = (message) => {
      if (label) label.textContent = message;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (label) label.textContent = original;
      }, 2200);
    };

    button.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(EMAIL);
        } else {
          legacyCopy(EMAIL);
        }
        feedback('COPIED ✓');
      } catch (error) {
        try {
          legacyCopy(EMAIL);
          feedback('COPIED ✓');
        } catch (fallbackError) {
          feedback('COPY FAILED');
        }
      }
    });
  }

  setupClocks();
  setupContrast();
  setupBinary();
  setupWaves();
  setupReveals();
  setupCursor();
  setupScroll();
  setupMenu();
  setupSay();
  setupCopy();
})();
