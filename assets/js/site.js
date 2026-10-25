/* ShirakawaFM — site behaviour. No dependencies. */
(() => {
  'use strict';

  const doc = document;
  const root = doc.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  const $ = (sel, scope = doc) => scope.querySelector(sel);
  const $$ = (sel, scope = doc) => Array.from(scope.querySelectorAll(sel));

  /* ------------------------------------------------------------------ */
  /* Theme                                                               */
  /* ------------------------------------------------------------------ */

  const themeBtn = $('[data-theme-toggle]');
  const metaTheme = $('meta[name="theme-color"]');

  function syncThemeButton() {
    if (!themeBtn) return;
    const night = root.dataset.theme === 'night';
    themeBtn.setAttribute('aria-label', night ? '切换到浅色' : '切换到深色');
    themeBtn.textContent = night ? '☾' : '◐';
    if (metaTheme) metaTheme.setAttribute('content', night ? '#0d0d0b' : '#f2efe7');
  }

  function setTheme(value, persist) {
    root.dataset.theme = value;
    if (persist) {
      try {
        localStorage.setItem('fm-theme', value);
      } catch (e) {}
    }
    syncThemeButton();
  }

  if (themeBtn) {
    syncThemeButton();
    themeBtn.addEventListener('click', () => {
      setTheme(root.dataset.theme === 'night' ? 'light' : 'night', true);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Clock (UTC+8)                                                       */
  /* ------------------------------------------------------------------ */

  const clocks = $$('[data-clock]');
  if (clocks.length) {
    const fmt = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const tick = () => {
      const time = fmt.format(new Date());
      clocks.forEach((el) => {
        el.textContent = time;
      });
    };
    tick();
    setInterval(tick, 1000);
  }

  const yearEls = $$('[data-year]');
  yearEls.forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* ------------------------------------------------------------------ */
  /* Header + reveal + load                                              */
  /* ------------------------------------------------------------------ */

  const header = $('.site-header');
  const onScrollHeader = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  const startPage = () => {
    requestAnimationFrame(() => {
      doc.body.classList.add('is-loaded');
      root.classList.add('is-ready');
    });
  };
  if (doc.readyState === 'complete') startPage();
  else window.addEventListener('load', startPage, { once: true });

  /* ------------------------------------------------------------------ */
  /* Mobile menu                                                         */
  /* ------------------------------------------------------------------ */

  const menu = $('#menu');
  const menuBtn = $('[data-menu-toggle]');
  let menuOpen = false;

  function setMenu(open) {
    if (!menu || !menuBtn) return;
    menuOpen = open;
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'CLOSE' : 'MENU';
    doc.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      const first = menu.querySelector('a');
      if (first) first.focus({ preventScroll: true });
    } else {
      menuBtn.focus({ preventScroll: true });
    }
  }

  if (menuBtn && menu) {
    menuBtn.addEventListener('click', () => setMenu(!menuOpen));
    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) setMenu(false);
    });
    doc.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuOpen) setMenu(false);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Cursor                                                              */
  /* ------------------------------------------------------------------ */

  const cursor = $('.cursor');
  const dot = $('.cursor-dot');

  if (cursor && dot && finePointer.matches && !reduced.matches) {
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let visible = false;

    const show = () => {
      if (visible) return;
      visible = true;
      root.classList.add('is-cursor-ready');
      cursor.classList.add('is-visible');
      dot.classList.add('is-visible');
    };

    const hide = () => {
      visible = false;
      cursor.classList.remove('is-visible');
      dot.classList.remove('is-visible');
    };

    window.addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType !== 'mouse') return;
        mx = e.clientX;
        my = e.clientY;
        dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
        show();
      },
      { passive: true }
    );

    doc.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);

    const lerp = (a, b, n) => a + (b - a) * n;
    const loop = () => {
      rx = lerp(rx, mx, 0.16);
      ry = lerp(ry, my, 0.16);
      cursor.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    const interactive = 'a, button, [data-magnetic], .work, .write';
    doc.addEventListener('pointerover', (e) => {
      const target = e.target.closest(interactive);
      cursor.classList.toggle('is-link', Boolean(target));
    });
    doc.addEventListener('pointerdown', () => cursor.classList.add('is-active'));
    doc.addEventListener('pointerup', () => cursor.classList.remove('is-active'));
  }

  /* ------------------------------------------------------------------ */
  /* Magnetic elements                                                   */
  /* ------------------------------------------------------------------ */

  if (finePointer.matches && !reduced.matches) {
    $$('[data-magnetic]').forEach((el) => {
      const strength = Number(el.dataset.magnetic) || 10;
      el.addEventListener('pointermove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * strength;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * strength;
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
      el.addEventListener('pointerleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Sound — generative ambient (opt-in)                                 */
  /* ------------------------------------------------------------------ */

  const soundBtn = $('[data-sound-toggle]');
  const soundLabel = soundBtn ? soundBtn.querySelector('[data-sound-label]') : null;
  let audio = null;
  let soundOn = false;

  function buildAudio() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;

    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 620;
    filter.Q.value = 0.6;
    filter.connect(master);

    const voices = [
      { type: 'sine', freq: 110, gain: 0.5, detune: -4 },
      { type: 'sine', freq: 164.81, gain: 0.22, detune: 3 },
      { type: 'triangle', freq: 220, gain: 0.08, detune: -7 },
    ].map((v) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = v.type;
      osc.frequency.value = v.freq;
      osc.detune.value = v.detune;
      gain.gain.value = v.gain;
      osc.connect(gain).connect(filter);
      osc.start();
      return { osc, gain };
    });

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.06;
    lfoGain.gain.value = 130;
    lfo.connect(lfoGain).connect(filter.frequency);
    lfo.start();

    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1200;
    noiseFilter.Q.value = 0.7;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.05;
    noise.connect(noiseFilter).connect(noiseGain).connect(master);
    noise.start();

    return { ctx, master, voices, filter, lfo };
  }

  function setSound(on) {
    if (!soundBtn) return;
    soundOn = on;

    if (on) {
      if (!audio) audio = buildAudio();
      if (!audio) return;
      if (audio.ctx.state === 'suspended') audio.ctx.resume();
      const now = audio.ctx.currentTime;
      audio.master.gain.cancelScheduledValues(now);
      audio.master.gain.setValueAtTime(audio.master.gain.value, now);
      audio.master.gain.linearRampToValueAtTime(0.06, now + 1.2);
    } else if (audio) {
      const now = audio.ctx.currentTime;
      audio.master.gain.cancelScheduledValues(now);
      audio.master.gain.setValueAtTime(audio.master.gain.value, now);
      audio.master.gain.linearRampToValueAtTime(0, now + 0.6);
    }

    soundBtn.setAttribute('aria-pressed', String(on));
    if (soundLabel) soundLabel.textContent = on ? 'SOUND ON' : 'SILENT';
  }

  if (soundBtn) {
    soundBtn.addEventListener('click', () => setSound(!soundOn));
  }

  /* ------------------------------------------------------------------ */
  /* Article: progress + TOC                                             */
  /* ------------------------------------------------------------------ */

  const progress = $('.progress');
  if (progress) {
    const updateProgress = () => {
      const scrollable = doc.documentElement.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      progress.style.transform = `scaleX(${ratio})`;
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
  }

  const tocLinks = $$('.toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const map = new Map();
    tocLinks.forEach((link) => {
      const id = link.getAttribute('href');
      if (!id || !id.startsWith('#')) return;
      const heading = doc.querySelector(id);
      if (heading) map.set(heading, link);
    });

    const tocObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const link = map.get(entry.target);
          if (!link) return;
          tocLinks.forEach((l) => l.classList.remove('is-active'));
          link.classList.add('is-active');
        });
      },
      { rootMargin: '-15% 0px -70% 0px' }
    );

    map.forEach((link, heading) => tocObserver.observe(heading));
  }

  /* ------------------------------------------------------------------ */
  /* External links                                                      */
  /* ------------------------------------------------------------------ */

  $$('a[href^="http"]').forEach((link) => {
    if (link.hostname === location.hostname) return;
    link.setAttribute('rel', 'noopener noreferrer');
    if (!link.hasAttribute('target')) link.setAttribute('target', '_blank');
  });
})();
