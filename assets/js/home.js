/* Home: a live trace line + light parallax. */
(() => {
  'use strict';

  const canvas = document.getElementById('trace');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const wrap = canvas ? canvas.parentElement : null;
  const timeEls = Array.from(document.querySelectorAll('[data-trace-time]'));

  if (canvas && wrap) {
    const ctx = canvas.getContext('2d', { alpha: true });
    let width = 0;
    let height = 0;
    let dpr = 1;
    let visible = true;
    let running = false;
    let raf = 0;
    let t = 0;
    let targetAmp = 0.35;
    let amp = 0.35;
    let pointer = { x: 0.5, y: 0.5, active: false };
    let lastScroll = window.scrollY;
    let velocity = 0;
    let colors = readColors();

    function readColors() {
      const css = getComputedStyle(document.documentElement);
      return {
        ink: css.getPropertyValue('--ink').trim() || '#12120f',
        line: css.getPropertyValue('--line').trim() || 'rgba(18,18,15,.16)',
        accent: css.getPropertyValue('--accent').trim() || '#d63a12',
        muted: css.getPropertyValue('--muted').trim() || '#6f6a60',
      };
    }

    function resize() {
      const rect = wrap.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduced.matches) draw(0);
    }

    function wave(x, time) {
      const n = x / width;
      return (
        Math.sin(n * Math.PI * 6 + time * 0.9) * 0.42 +
        Math.sin(n * Math.PI * 13 - time * 1.4) * 0.2 +
        Math.sin(n * Math.PI * 29 + time * 0.4) * 0.07
      );
    }

    function draw(time) {
      ctx.clearRect(0, 0, width, height);
      const mid = height / 2;
      const pad = 18;

      // baseline grid
      ctx.save();
      ctx.strokeStyle = colors.line;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const y = pad + ((height - pad * 2) / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      for (let i = 1; i < 9; i++) {
        const x = (width / 9) * i;
        ctx.beginPath();
        ctx.moveTo(x, pad);
        ctx.lineTo(x, height - pad);
        ctx.stroke();
      }
      ctx.restore();

      // envelope
      const ampPx = (height * 0.36) * Math.min(1.15, amp);
      const points = [];
      const step = 2;
      for (let x = 0; x <= width; x += step) {
        let y = wave(x, time);
        if (pointer.active) {
          const px = pointer.x * width;
          const dist = Math.abs(x - px) / width;
          const pull = Math.max(0, 1 - dist * 7);
          y += Math.sin(dist * 22 + time * 3) * 0.18 * pull;
        }
        points.push([x, mid + y * ampPx]);
      }

      // accent span that drifts
      const spanStart = ((time * 0.07) % 1.4) - 0.2;
      ctx.save();
      ctx.beginPath();
      points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.strokeStyle = colors.ink;
      ctx.globalAlpha = 0.86;
      ctx.lineWidth = 1.15;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      points.forEach(([x, y], i) => {
        const n = x / width;
        if (n < spanStart || n > spanStart + 0.22) return;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();

      // live cursor
      const cx = ((time * 0.05) % 1) * width;
      const cy = mid + wave(cx, time) * ampPx;
      ctx.save();
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function frame() {
      raf = 0;
      if (!running) return;
      t += 0.016;
      const target = 0.36 + Math.min(0.5, Math.abs(velocity) * 0.012) + (pointer.active ? 0.12 : 0);
      amp += (target - amp) * 0.08;
      velocity *= 0.92;
      draw(t);
      if (timeEls.length && Math.floor(t * 60) % 18 === 0) {
        const total = Math.floor(t);
        const mm = String(Math.floor(total / 60)).padStart(2, '0');
        const ss = String(total % 60).padStart(2, '0');
        timeEls.forEach((el) => {
          el.textContent = mm + ':' + ss;
        });
      }
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (running) return;
      running = true;
      if (!raf) raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visible = entry.isIntersecting;
          if (visible && !document.hidden) start();
          else stop();
        });
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (visible) start();
    };
    document.addEventListener('visibilitychange', onVisibility);

    window.addEventListener('resize', resize);
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(wrap);

    wrap.addEventListener(
      'pointermove',
      (e) => {
        const rect = wrap.getBoundingClientRect();
        pointer.x = (e.clientX - rect.left) / rect.width;
        pointer.y = (e.clientY - rect.top) / rect.height;
        pointer.active = true;
      },
      { passive: true }
    );
    wrap.addEventListener('pointerleave', () => {
      pointer.active = false;
    });

    window.addEventListener(
      'scroll',
      () => {
        velocity = window.scrollY - lastScroll;
        lastScroll = window.scrollY;
      },
      { passive: true }
    );

    resize();
    if (reduced.matches) {
      draw(1.2);
    } else {
      start();
    }

    // keep colours in sync with theme
    new MutationObserver(() => {
      colors = readColors();
      if (reduced.matches) draw(0);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  /* Light parallax — elements drift against scroll. */
  const parallaxEls = Array.from(document.querySelectorAll('[data-parallax]'));
  if (parallaxEls.length && !reduced.matches) {
    let ticking = false;
    const apply = () => {
      const y = window.scrollY;
      parallaxEls.forEach((el) => {
        const speed = Number(el.dataset.parallax) || 0.08;
        el.style.transform = `translate3d(0, ${(y * speed).toFixed(2)}px, 0)`;
      });
      ticking = false;
    };
    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(apply);
      },
      { passive: true }
    );
    apply();
  }
})();
