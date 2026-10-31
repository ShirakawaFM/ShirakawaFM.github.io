/* Letter, mini-game and scratch card. No dependencies. */
(() => {
  'use strict';

  window.__fmLetterReady = true;

  const doc = document;
  const root = doc.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (sel, scope = doc) => scope.querySelector(sel);
  const $$ = (sel, scope = doc) => Array.from(scope.querySelectorAll(sel));

  const letter = $('.letter');
  const openBtn = $('[data-open-letter]');
  const envelopeHint = $('[data-envelope-hint]');
  const letterBody = $('[data-letter-body]');

  /* ------------------------------------------------------------------ */
  /* Letter                                                              */
  /* ------------------------------------------------------------------ */

  function saveLetterState() {
    try {
      localStorage.setItem('fm-letter', 'open');
    } catch (e) {}
  }

  function clearOpening() {
    if (!letter) return;
    letter.classList.remove('is-opening');
  }

  function finishOpening() {
    if (!letter) return;
    root.dataset.letter = 'open';
    clearOpening();
    if (envelopeHint) envelopeHint.textContent = '已拆开 · 往下读';
    if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
    saveLetterState();
    if (letterBody) {
      letterBody.setAttribute('tabindex', '-1');
      const top = letterBody.getBoundingClientRect().top + window.scrollY - 90;
      window.setTimeout(() => {
        window.scrollTo({ top, behavior: reduced.matches ? 'auto' : 'smooth' });
        letterBody.focus({ preventScroll: true });
      }, reduced.matches ? 0 : 380);
    }
  }

  function openLetter() {
    if (root.dataset.letter === 'open') return;
    if (!letter) {
      root.dataset.letter = 'open';
      return;
    }
    letter.classList.add('is-opening');
    if (!reduced.matches) {
      window.setTimeout(finishOpening, 900);
    } else {
      finishOpening();
    }
  }

  if (openBtn) {
    openBtn.setAttribute('aria-expanded', String(root.dataset.letter === 'open'));
    openBtn.addEventListener('click', openLetter);
  }

  if (root.dataset.letter === 'open' && envelopeHint) {
    envelopeHint.textContent = '已拆开 · 往下读';
  }

  doc.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() !== 'l' || e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (root.dataset.letter === 'sealed') openLetter();
  });

  /* ------------------------------------------------------------------ */
  /* Ink splats                                                          */
  /* ------------------------------------------------------------------ */

  let lastSplat = 0;

  function splat(x, y) {
    if (reduced.matches) return;
    const now = performance.now();
    if (now - lastSplat < 70) return;
    lastSplat = now;

    for (let i = 0; i < 6; i++) {
      const dot = doc.createElement('span');
      dot.className = 'ink-splat';
      const angle = Math.random() * Math.PI * 2;
      const dist = 14 + Math.random() * 34;
      dot.style.left = x + 'px';
      dot.style.top = y + 'px';
      dot.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
      dot.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
      dot.style.animationDelay = i * 8 + 'ms';
      doc.body.appendChild(dot);
      window.setTimeout(() => dot.remove(), 800);
    }
  }

  doc.addEventListener(
    'pointerdown',
    (e) => {
      if (!e.target.closest('main')) return;
      if (!e.target.closest('a, button')) return;
      splat(e.clientX, e.clientY);
    },
    { passive: true }
  );

  /* ------------------------------------------------------------------ */
  /* Game: ten ink dots                                                  */
  /* ------------------------------------------------------------------ */

  const game = $('[data-game]');
  if (game) {
    const stage = $('[data-game-stage]', game);
    const startBtn = $('[data-game-start]', game);
    const dot = $('[data-game-dot]', game);
    const timeEl = $('[data-game-time]', game);
    const hitEl = $('[data-game-hit]', game);
    const bestEl = $('[data-game-best]', game);
    const result = $('[data-game-result]', game);
    const finalEl = $('[data-game-final]', game);
    const verdictEl = $('[data-game-verdict]', game);
    const restartBtn = $('[data-game-restart]', game);

    const TARGETS = 10;
    const SIZE = 46;
    const BEST_KEY = 'fm-ink-best';
    let playing = false;
    let hits = 0;
    let startedAt = 0;
    let raf = 0;
    let best = null;

    try {
      const stored = parseFloat(localStorage.getItem(BEST_KEY));
      if (Number.isFinite(stored) && stored > 0) best = stored;
    } catch (e) {}

    function renderBest() {
      if (bestEl) bestEl.textContent = best ? best.toFixed(2) + 's' : '—';
    }

    function renderHits() {
      hitEl.textContent = hits + ' / ' + TARGETS;
    }

    function tick() {
      if (!playing) return;
      timeEl.textContent = ((performance.now() - startedAt) / 1000).toFixed(2);
      raf = requestAnimationFrame(tick);
    }

    function placeDot() {
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      // 320px 窄屏时 width - SIZE - 20 会变成负数，Math.max(10, …) 反而把点推出容器
      const x = 10 + Math.random() * Math.max(0, width - SIZE - 20);
      const y = 10 + Math.random() * Math.max(0, height - SIZE - 20);
      dot.style.left = x + 'px';
      dot.style.top = y + 'px';
      dot.focus({ preventScroll: true });
    }

    function startGame() {
      playing = true;
      hits = 0;
      renderHits();
      startBtn.hidden = true;
      result.hidden = true;
      dot.hidden = false;
      startedAt = performance.now();
      timeEl.textContent = '0.00';
      placeDot();
      cancelAnimationFrame(raf);
      tick();
    }

    function verdictFor(seconds) {
      if (seconds < 4.5) return '很快。你的手比眼睛快。';
      if (seconds < 7) return '不错。你大概经常点鼠标。';
      if (seconds < 11) return '稳。你甚至还读完了这封信。';
      return '慢一点也好。至少你玩完了。';
    }

    function endGame() {
      playing = false;
      cancelAnimationFrame(raf);
      dot.hidden = true;
      const seconds = (performance.now() - startedAt) / 1000;
      timeEl.textContent = seconds.toFixed(2);
      if (finalEl) finalEl.textContent = seconds.toFixed(2);
      if (verdictEl) verdictEl.textContent = verdictFor(seconds);

      if (!best || seconds < best) {
        best = seconds;
        try {
          localStorage.setItem(BEST_KEY, String(best));
        } catch (e) {}
      }

      renderBest();
      result.hidden = false;
      if (restartBtn) restartBtn.focus({ preventScroll: true });
    }

    dot.addEventListener('click', () => {
      if (!playing) return;
      hits += 1;
      renderHits();
      if (hits >= TARGETS) {
        endGame();
      } else {
        placeDot();
      }
    });

    startBtn.addEventListener('click', startGame);
    if (restartBtn) restartBtn.addEventListener('click', startGame);
    renderBest();
  }

  /* ------------------------------------------------------------------ */
  /* Scratch card                                                        */
  /* ------------------------------------------------------------------ */

  const scratch = $('[data-scratch]');
  if (scratch) {
    const canvas = $('[data-scratch-canvas]', scratch);
    const skip = $('[data-scratch-skip]');
    const ctx = canvas.getContext('2d');
    let drawing = false;
    let revealed = false;
    let moves = 0;
    let last = null;
    const css = getComputedStyle(doc.documentElement);

    function palette() {
      return {
        paper2: css.getPropertyValue('--paper-2').trim() || '#e9e5db',
        paper: css.getPropertyValue('--paper').trim() || '#f2efe7',
        ink: css.getPropertyValue('--ink').trim() || '#12120f',
        muted: css.getPropertyValue('--muted').trim() || '#6f6a60',
        line: css.getPropertyValue('--line').trim() || 'rgba(18,18,15,.16)',
      };
    }

    function paintCover() {
      const rect = scratch.getBoundingClientRect();
      if (!rect.width || !rect.height) return; // 还没布局，等 ResizeObserver 再来
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const c = palette();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = c.paper2;
      ctx.fillRect(0, 0, rect.width, rect.height);

      ctx.strokeStyle = c.line;
      ctx.lineWidth = 1;
      for (let x = -rect.height; x < rect.width; x += 14) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + rect.height, rect.height);
        ctx.stroke();
      }

      ctx.globalAlpha = 0.75;
      ctx.fillStyle = c.ink;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '500 15px "IBM Plex Mono", Consolas, monospace';
      ctx.fillText('刮 开', rect.width / 2, rect.height / 2 - 10);
      ctx.font = '10px "IBM Plex Mono", Consolas, monospace';
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = c.ink;
      ctx.fillText('SCRATCH TO REVEAL', rect.width / 2, rect.height / 2 + 16);
    }

    function reveal() {
      if (revealed) return;
      revealed = true;
      scratch.classList.add('is-revealed');
      const status = $('[data-scratch-reveal]', scratch);
      if (status) status.setAttribute('aria-live', 'polite');
      if (skip) skip.hidden = true;
    }

    function checkProgress() {
      if (revealed) return;
      const w = canvas.width;
      const h = canvas.height;
      if (!w || !h) return;
      const data = ctx.getImageData(0, 0, w, h).data;
      let clear = 0;
      let total = 0;
      for (let y = 0; y < h; y += 16) {
        for (let x = 0; x < w; x += 16) {
          total += 1;
          if (data[(y * w + x) * 4 + 3] < 40) clear += 1;
        }
      }
      if (total && clear / total > 0.42) reveal();
    }

    function erase(e) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.fill();

      if (last) {
        ctx.lineWidth = 56;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      last = { x, y };
      moves += 1;
      if (moves % 6 === 0) checkProgress();
    }

    canvas.addEventListener('pointerdown', (e) => {
      if (revealed) return;
      drawing = true;
      last = null;
      canvas.setPointerCapture(e.pointerId);
      erase(e);
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!drawing || revealed) return;
      erase(e);
    });

    const stop = () => {
      drawing = false;
      last = null;
      checkProgress();
    };
    canvas.addEventListener('pointerup', stop);
    canvas.addEventListener('pointercancel', stop);
    canvas.addEventListener('pointerleave', () => {
      drawing = false;
      last = null;
      checkProgress();
    });

    if (skip) skip.addEventListener('click', reveal);

    paintCover();
    if ('ResizeObserver' in window) {
      let resizeTimer = 0;
      new ResizeObserver(() => {
        if (revealed) return;
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(paintCover, 160);
      }).observe(scratch);
    }
  }
})();
