/* GitHub geek interactions: contributions, commits, palette, reactions. */
(() => {
  'use strict';

  const doc = document;
  const $ = (s, scope = doc) => scope.querySelector(s);
  const $$ = (s, scope = doc) => Array.from(scope.querySelectorAll(s));
  const store = {
    get(key, fallback) {
      try {
        const v = JSON.parse(localStorage.getItem(key));
        return v == null ? fallback : v;
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {}
    },
  };

  /* ---------------------------------------------------------------- */
  /* Contributions + commits                                           */
  /* ---------------------------------------------------------------- */

  const contrib = $('[data-contrib]');
  const commitList = $('[data-commits]');

  function levelFor(count) {
    if (!count) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count === 3) return 3;
    return 4;
  }

  function renderContrib(data) {
    const counts = data.days || {};
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - 364);
    start.setDate(start.getDate() - start.getDay());

    const frag = doc.createDocumentFragment();
    const cursor = new Date(start);

    while (cursor <= end) {
      const week = doc.createElement('div');
      week.className = 'contrib__week';
      for (let d = 0; d < 7; d++) {
        const cell = doc.createElement('i');
        cell.className = 'contrib__cell';
        const key = cursor.toISOString().slice(0, 10);
        const count = counts[key] || 0;
        cell.classList.add('l' + levelFor(count));
        cell.title = key + ' · ' + count + ' commit' + (count === 1 ? '' : 's');
        cell.setAttribute('aria-label', cell.title);
        week.appendChild(cell);
        cursor.setDate(cursor.getDate() + 1);
      }
      frag.appendChild(week);
    }

    contrib.innerHTML = '';
    contrib.appendChild(frag);
    if (data.generated) {
      const gen = $('[data-generated]');
      if (gen) gen.textContent = data.generated;
    }
  }

  function renderCommits(data) {
    const list = (data.commits || []).slice(0, 8);
    commitList.innerHTML = '';
    list.forEach((c) => {
      const li = doc.createElement('li');
      const a = doc.createElement('a');
      a.href = c.url;
      a.rel = 'noopener';
      a.innerHTML =
        '<code>' + c.hash + '</code>' +
        '<span>' + c.subject.replace(/</g, '&lt;') + '</span>' +
        '<time datetime="' + c.date + '">' + c.date + '</time>';
      li.appendChild(a);
      commitList.appendChild(li);
    });
  }

  fetch('/assets/data/repo.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data) return;
      if (contrib) renderContrib(data);
      if (commitList) renderCommits(data);
    })
    .catch(() => {});

  /* ---------------------------------------------------------------- */
  /* Reactions                                                         */
  /* ---------------------------------------------------------------- */

  const reactions = $('[data-reactions]');
  if (reactions) {
    const KEY = 'fm-reactions';
    const state = store.get(KEY, { counts: {}, mine: {} });
    const buttons = $$('[data-reaction]', reactions);

    function render() {
      buttons.forEach((btn) => {
        const emoji = btn.dataset.reaction;
        const count = state.counts[emoji] || 0;
        const mine = !!state.mine[emoji];
        btn.classList.toggle('is-active', mine);
        btn.setAttribute('aria-pressed', String(mine));
        const span = btn.querySelector('span');
        if (span) span.textContent = String(count);
      });
    }

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const emoji = btn.dataset.reaction;
        const mine = !!state.mine[emoji];
        state.counts[emoji] = Math.max(0, (state.counts[emoji] || 0) + (mine ? -1 : 1));
        state.mine[emoji] = !mine;
        store.set(KEY, state);
        render();
      });
    });

    render();
  }

  /* ---------------------------------------------------------------- */
  /* Close / reopen issue                                             */
  /* ---------------------------------------------------------------- */

  const issueHead = $('.issue-head');
  const closeBtn = $('[data-close-issue]');
  if (issueHead && closeBtn) {
    const KEY = 'fm-issue-closed';
    const stateEl = $('.issue-state', issueHead);

    function apply(closed, animate) {
      issueHead.classList.toggle('is-closed', closed);
      closeBtn.textContent = closed ? 'Reopen issue' : 'Close as completed';
      if (stateEl) {
        const textNode = Array.from(stateEl.childNodes).find((n) => n.nodeType === 3);
        if (textNode) textNode.nodeValue = closed ? ' Closed' : ' Open';
      }
      if (closed) store.set(KEY, true);
      else store.set(KEY, false);
      if (animate && closed) {
        closeBtn.textContent = 'Closed as completed';
      }
    }

    apply(store.get(KEY, false), false);

    closeBtn.addEventListener('click', () => {
      const closed = !issueHead.classList.contains('is-closed');
      apply(closed, true);
      if (closed) {
        closeBtn.animate(
          [{ transform: 'scale(1)' }, { transform: 'scale(0.96)' }, { transform: 'scale(1)' }],
          { duration: 220, easing: 'ease-out' }
        );
      }
    });
  }

  /* ---------------------------------------------------------------- */
  /* Local-only comment                                               */
  /* ---------------------------------------------------------------- */

  const commentInput = $('[data-comment]');
  const commentSave = $('[data-comment-save]');
  const commentStatus = $('[data-comment-status]');
  const commentSaved = $('[data-comment-saved]');
  if (commentInput && commentSave) {
    const KEY = 'fm-comment';

    function show(text) {
      if (!commentSaved) return;
      if (!text) {
        commentSaved.hidden = true;
        commentSaved.textContent = '';
        return;
      }
      commentSaved.hidden = false;
      commentSaved.textContent = '你写下的：' + text;
    }

    show(store.get(KEY, ''));
    commentInput.value = store.get(KEY, '');

    commentSave.addEventListener('click', () => {
      const value = commentInput.value.trim().slice(0, 280);
      if (!value) {
        if (commentStatus) commentStatus.textContent = '写点什么再提交';
        commentInput.focus();
        return;
      }
      store.set(KEY, value);
      show(value);
      if (commentStatus) commentStatus.textContent = 'Saved to localStorage';
      window.setTimeout(() => {
        if (commentStatus) commentStatus.textContent = '';
      }, 2600);
    });

    commentInput.addEventListener('input', () => {
      if (commentStatus) commentStatus.textContent = '';
    });
  }

  /* ---------------------------------------------------------------- */
  /* Command palette                                                   */
  /* ---------------------------------------------------------------- */

  const palette = $('[data-palette]');
  if (palette) {
    const input = $('[data-palette-input]', palette);
    const list = $('[data-palette-list]', palette);
    const backdrop = $('[data-palette-close]', palette);
    let filtered = [];
    let active = 0;

    const items = [
      { label: '信 · Letter #1', hint: '#letter', href: '#letter' },
      { label: '随信附上 · Work', hint: '#work', href: '#work' },
      { label: '写作 · Writing index', hint: '/writing/', href: '/writing/' },
      { label: '关于 · About', hint: '/about/', href: '/about/' },
      { label: '小游戏 · Bug hunt', hint: '#game', href: '#game' },
      { label: '刮刮卡 · Secret gist', hint: '#scratch', href: '#scratch' },
      { label: '活动 · Contribution graph', hint: '#activity', href: '#activity' },
      { label: '提交 · Recent commits', hint: '#commits', href: '#commits' },
      { label: 'GitHub · 源码', hint: '↗', href: 'https://github.com/ShirakawaFM/ShirakawaFM.github.io' },
      { label: 'Bilibili', hint: '↗', href: 'https://space.bilibili.com/209300529' },
      { label: 'Email · 写回信', hint: '↗', href: 'mailto:shirakawafm@outlook.com' },
      { label: '切换主题 · Theme', hint: 'toggle', action: 'theme' },
      { label: '复制邮箱 · Copy email', hint: 'clipboard', action: 'copy-email' },
      { label: '回到顶部 · Top', hint: '#', href: '#' },
    ];

    function render(query) {
      const q = (query || '').trim().toLowerCase();
      filtered = items.filter((it) => {
        if (!q) return true;
        return (it.label + ' ' + it.hint).toLowerCase().includes(q);
      });
      active = 0;
      list.innerHTML = '';
      filtered.forEach((it, i) => {
        const li = doc.createElement('li');
        if (i === 0) li.classList.add('is-active');
        const el = doc.createElement(it.action ? 'button' : 'a');
        if (it.action) el.type = 'button';
        else el.href = it.href;
        if (it.href && it.href.startsWith('http')) {
          el.target = '_blank';
          el.rel = 'noopener';
        }
        el.innerHTML = '<span>' + it.label + '</span><span class="mono">' + it.hint + '</span>';
        el.addEventListener('click', () => run(it));
        li.appendChild(el);
        list.appendChild(li);
      });
      if (!filtered.length) {
        list.innerHTML = '<li><span class="mono" style="padding:10px;display:block;color:var(--faint)">没有匹配项</span></li>';
      }
    }

    function run(it) {
      close();
      if (it.action === 'theme') {
        const t = $('[data-theme-toggle]');
        if (t) t.click();
        return;
      }
      if (it.action === 'copy-email') {
        const email = 'shirakawafm@outlook.com';
        if (navigator.clipboard) navigator.clipboard.writeText(email).catch(() => {});
        return;
      }
      if (it.href === '#') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (it.href && it.href.startsWith('#')) {
        const el = doc.querySelector(it.href);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    function move(delta) {
      if (!filtered.length) return;
      const rows = $$('li', list);
      if (rows[active]) rows[active].classList.remove('is-active');
      active = (active + delta + filtered.length) % filtered.length;
      if (rows[active]) {
        rows[active].classList.add('is-active');
        rows[active].scrollIntoView({ block: 'nearest' });
      }
    }

    function open() {
      palette.hidden = false;
      input.value = '';
      render('');
      window.setTimeout(() => input.focus(), 20);
    }

    function close() {
      palette.hidden = true;
    }

    $$('[data-cmdk]').forEach((btn) => btn.addEventListener('click', open));
    backdrop.addEventListener('click', close);

    input.addEventListener('input', () => render(input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        move(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        move(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[active]) run(filtered[active]);
      } else if (e.key === 'Escape') {
        close();
      }
    });

    doc.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (palette.hidden) open();
        else close();
      }
      if (e.key === 'Escape' && !palette.hidden) close();
    });
  }
})();
