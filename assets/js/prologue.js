/* Layered prologue: no page scroll until the last layer is peeled. */
(() => {
  'use strict';

  const doc = document;
  const root = doc.documentElement;
  const pro = doc.querySelector('.prologue');
  if (!pro) return;

  const $ = (s, scope = doc) => scope.querySelector(s);
  const $$ = (s, scope = doc) => Array.from(scope.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const layers = $$('.pro-layer', pro);
  const label = $('[data-step-label]', pro);
  const dots = $$('.prologue__progress i', pro);
  const seal = $('[data-seal]', pro);
  const pull = $('[data-pull]', pro);
  const pullPaper = $('[data-pull-paper]', pro);
  const game = $('[data-pro-game]', pro);
  const bug = $('[data-bug]', pro);
  const closedEl = $('[data-pro-closed]', pro);
  const gameHint = $('[data-pro-game-hint]', pro);
  const afterGame = $('[data-after-game]', pro);
  const afterChoice = $('[data-after-choice]', pro);
  const responseEl = $('[data-response]', pro);

  const steps = [
    { id: 'seal', label: 'SEALED' },
    { id: 'pull', label: 'PULL' },
    { id: 'read', label: 'READ' },
    { id: 'choose', label: 'CHOOSE' },
    { id: 'play', label: 'PLAY' },
    { id: 'end', label: 'UNSEALED' },
  ];

  let index = 0;
  let choice = '';
  let closed = 0;
  let busy = false;
  let finished = false;

  const isOn = () => root.dataset.prologue === 'on';

  function lockPage(on) {
    ['header', 'main', 'footer'].forEach((sel) => {
      const el = doc.querySelector(sel);
      if (!el) return;
      if (on) el.setAttribute('inert', '');
      else el.removeAttribute('inert');
    });
  }

  function setStep(i) {
    index = Math.max(0, Math.min(steps.length - 1, i));
    const step = steps[index];
    if (label) label.textContent = String(index + 1).padStart(2, '0') + ' / 06 · ' + step.label;
    dots.forEach((dot, di) => dot.classList.toggle('is-on', di <= index));
  }

  function showLayer(id, focus = true) {
    const target = layers.find((l) => l.dataset.layer === id);
    if (!target) return;
    const current = layers.find((l) => l.classList.contains('is-active'));
    if (current && current !== target) {
      current.classList.add('is-leaving');
      window.setTimeout(() => {
        current.classList.remove('is-active', 'is-leaving');
        current.hidden = true;
      }, reduced.matches ? 10 : 420);
    }
    target.hidden = false;
    window.requestAnimationFrame(() => {
      target.classList.add('is-active');
    });
    setStep(steps.findIndex((s) => s.id === id));
    if (!focus) return;
    const focusable =
      $('button:not([hidden])', target) || $('h1, h2', target) || target;
    window.setTimeout(() => {
      try {
        focusable.focus({ preventScroll: true });
      } catch (e) {}
    }, reduced.matches ? 20 : 380);
  }

  function advance(id) {
    if (busy || finished) return;
    busy = true;
    showLayer(id);
    window.setTimeout(() => {
      busy = false;
    }, reduced.matches ? 30 : 520);
  }

  /* ------------------------------------------------------------------ */
  /* Seal: hold to break                                                */
  /* ------------------------------------------------------------------ */

  let holdRaf = 0;
  let holdStart = 0;
  let holding = false;
  let broken = false;

  function setHold(value) {
    if (seal) seal.style.setProperty('--hold', String(Math.min(100, value)));
  }

  function stopHold(reset) {
    holding = false;
    cancelAnimationFrame(holdRaf);
    holdRaf = 0;
    if (seal) seal.classList.remove('is-holding');
    if (reset && !broken) setHold(0);
  }

  function breakSeal() {
    if (broken) return;
    broken = true;
    stopHold(false);
    setHold(100);
    if (seal) seal.classList.add('is-broken');
    window.setTimeout(() => {
      advance('pull');
      window.setTimeout(() => {
        if (seal) {
          seal.classList.remove('is-broken', 'is-holding');
          seal.style.removeProperty('--hold');
        }
      }, 350);
    }, reduced.matches ? 10 : 520);
  }

  function startHold() {
    if (broken || !isOn()) return;
    holding = true;
    holdStart = performance.now();
    if (seal) seal.classList.add('is-holding');
    const tick = (now) => {
      if (!holding) return;
      const p = Math.min(100, ((now - holdStart) / 850) * 100);
      setHold(p);
      if (p >= 100) {
        breakSeal();
        return;
      }
      holdRaf = requestAnimationFrame(tick);
    };
    holdRaf = requestAnimationFrame(tick);
  }

  if (seal) {
    seal.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      startHold();
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((evt) => {
      seal.addEventListener(evt, () => stopHold(true));
    });
    seal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        breakSeal();
      }
    });
    seal.addEventListener('click', () => {
      if (!broken && isOn()) breakSeal();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Pull the letter out                                                */
  /* ------------------------------------------------------------------ */

  let pullStartY = 0;
  let pullDelta = 0;
  let pulling = false;

  function resetPull() {
    pullDelta = 0;
    if (pullPaper) pullPaper.style.setProperty('--pull', '0px');
  }

  if (pull) {
    pull.addEventListener('pointerdown', (e) => {
      if (!isOn()) return;
      pulling = true;
      pullStartY = e.clientY;
      pullDelta = 0;
      try {
        pull.setPointerCapture(e.pointerId);
      } catch (err) {}
    });
    pull.addEventListener('pointermove', (e) => {
      if (!pulling) return;
      pullDelta = Math.max(-170, Math.min(0, e.clientY - pullStartY));
      if (pullPaper) pullPaper.style.setProperty('--pull', pullDelta + 'px');
    });
    const endPull = () => {
      if (!pulling) return;
      pulling = false;
      if (pullDelta <= -70) {
        advance('read');
        resetPull();
      } else {
        resetPull();
      }
    };
    pull.addEventListener('pointerup', endPull);
    pull.addEventListener('pointercancel', endPull);
  }

  const pullFallback = $('[data-pull-fallback]', pro);
  if (pullFallback) pullFallback.addEventListener('click', () => advance('read'));

  /* ------------------------------------------------------------------ */
  /* Read + choose                                                      */
  /* ------------------------------------------------------------------ */

  const next = $('[data-next]', pro);
  if (next) next.addEventListener('click', () => advance('choose'));

  const choiceCopy = {
    work: '好。先看作品。',
    writing: '好。先看写作。',
    about: '好。先认识我。',
  };

  $$('[data-choice]', pro).forEach((btn) => {
    btn.addEventListener('click', () => {
      choice = btn.dataset.choice;
      $$('[data-choice]', pro).forEach((b) => b.classList.toggle('is-picked', b === btn));
      if (responseEl) responseEl.textContent = choiceCopy[choice] || '';
      if (afterChoice) afterChoice.hidden = false;
      if (afterChoice) afterChoice.focus({ preventScroll: true });
    });
  });

  if (afterChoice) {
    afterChoice.addEventListener('click', () => {
      advance('play');
      window.setTimeout(() => {
        resetGame();
        spawnBug();
      }, reduced.matches ? 30 : 460);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Three bugs                                                         */
  /* ------------------------------------------------------------------ */

  function spawnBug() {
    if (!game || !bug) return;
    const rect = game.getBoundingClientRect();
    const size = 48;
    const x = 12 + Math.random() * Math.max(12, rect.width - size - 24);
    const y = 54 + Math.random() * Math.max(12, rect.height - size - 66);
    bug.style.left = x + 'px';
    bug.style.top = y + 'px';
    bug.hidden = false;
    try {
      bug.focus({ preventScroll: true });
    } catch (e) {}
  }

  function resetGame() {
    closed = 0;
    if (closedEl) closedEl.textContent = '0 / 3';
    if (gameHint) gameHint.textContent = '点掉随机出现的三个 bug';
    if (afterGame) afterGame.hidden = true;
    if (bug) bug.hidden = true;
  }

  if (bug) {
    bug.addEventListener('click', () => {
      if (closed >= 3) return;
      closed += 1;
      if (closedEl) closedEl.textContent = closed + ' / 3';
      if (closed >= 3) {
        bug.hidden = true;
        if (gameHint) gameHint.textContent = '干净了。最后一层松开了。';
        if (afterGame) {
          afterGame.hidden = false;
          afterGame.focus({ preventScroll: true });
        }
      } else {
        spawnBug();
      }
    });
  }

  if (afterGame) afterGame.addEventListener('click', () => advance('end'));

  /* ------------------------------------------------------------------ */
  /* Finish / skip / replay                                            */
  /* ------------------------------------------------------------------ */

  const enter = $('[data-enter]', pro);

  function finish(skipped) {
    if (finished) return;
    finished = true;
    try {
      localStorage.setItem('fm-prologue', 'done');
      localStorage.setItem('fm-letter', 'open');
      if (choice) localStorage.setItem('fm-choice', choice);
    } catch (e) {}
    root.dataset.letter = 'open';
    lockPage(false);
    pro.classList.add('is-gone');

    window.setTimeout(
      () => {
        root.dataset.prologue = 'done';
        pro.hidden = true;
        window.scrollTo({ top: 0, behavior: 'auto' });
      },
      reduced.matches ? 20 : 620
    );
  }

  if (enter) enter.addEventListener('click', () => finish(false));

  const skip = $('[data-skip]', pro);
  if (skip) skip.addEventListener('click', () => finish(true));

  /* initial state ----------------------------------------------------- */

  if (!isOn()) {
    pro.hidden = true;
  }

  if (isOn()) {
    lockPage(true);
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    resetGame();
    setStep(0);
    if (seal) {
      window.setTimeout(() => {
        try {
          seal.focus({ preventScroll: true });
        } catch (e) {}
      }, 500);
    }
  }

  /* keep the page still while the prologue is open */
  doc.addEventListener(
    'wheel',
    (e) => {
      if (isOn()) e.preventDefault();
    },
    { passive: false }
  );

  doc.addEventListener(
    'touchmove',
    (e) => {
      if (isOn() && !e.target.closest('textarea, input')) e.preventDefault();
    },
    { passive: false }
  );

  doc.addEventListener('keydown', (e) => {
    if (!isOn()) return;
    if (e.target.closest('textarea, input')) return;
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
    }
    if (e.key === ' ' && !e.target.closest('button, a')) {
      e.preventDefault();
    }
  });

  // replay: clear the marker and reload from the seal
  $$('[data-replay]').forEach((btn) => {
    btn.addEventListener('click', () => {
      try {
        localStorage.removeItem('fm-prologue');
        localStorage.removeItem('fm-choice');
      } catch (e) {}
      window.location.reload();
    });
  });
})();
