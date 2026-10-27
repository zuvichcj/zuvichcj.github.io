// Rising sheets (Philosophy, Portfolio): modal <dialog>s that rise from the
// bottom of the screen. Any <dialog class="sheet" id="x"> is opened by links
// to "#x". The URL gets #x while it's open, so the link can be shared and the
// browser's Back button closes it.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const sheets = new Map();

for (const el of document.querySelectorAll('dialog.sheet[id]')) {
  const hash = `#${el.id}`;
  const state = { el, hash, closing: false, opener: null, viaKeyboard: false };
  sheets.set(hash, state);

  document.querySelectorAll(`a[href="${hash}"]`).forEach((a) =>
    a.addEventListener('click', (e) => { e.preventDefault(); open(state); }));
  el.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => close(state)));

  // Esc: animate out instead of the dialog's instant close
  el.addEventListener('cancel', (e) => { e.preventDefault(); close(state); });

  // A click in the margin around the panel (on the backdrop) closes it
  el.addEventListener('click', (e) => {
    if (e.target !== el) return;
    const r = el.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) close(state);
  });
}

function open(state, { push = true } = {}) {
  const { el, hash } = state;
  if (el.open) return;
  for (const other of sheets.values()) if (other !== state && other.el.open) close(other, { fromHistory: true, instant: true });
  state.opener = document.activeElement;
  // Opened from the keyboard? Then focus returns to the link on close.
  // Opened by mouse/touch? Then the link goes back to its resting state.
  state.viaKeyboard = !!(state.opener && state.opener.matches && state.opener.matches(':focus-visible'));
  document.documentElement.classList.add('sheet-open');
  el.showModal();
  el.querySelectorAll('.sheet-scroll, .pf-gallery, .pf').forEach((s) => { s.scrollTop = 0; });
  el.dispatchEvent(new CustomEvent('sheet:open'));
  // let the closed position paint first so the rise animates
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-open')));
  if (push && location.hash !== hash) history.pushState({ sheet: hash }, '', hash);
}

function close(state, { fromHistory = false, instant = false } = {}) {
  const { el, hash } = state;
  if (!el.open || state.closing) return;
  state.closing = true;
  el.classList.remove('is-open');

  const done = () => {
    state.closing = false;
    el.close(); // the browser puts focus back on the opener here
    if (![...sheets.values()].some((s) => s.el.open)) document.documentElement.classList.remove('sheet-open');
    const opener = state.opener;
    if (opener && opener.focus) {
      if (!instant && state.viaKeyboard) opener.focus({ preventScroll: true });
      else if (document.activeElement === opener) opener.blur();
    }
  };
  if (instant) done();
  else setTimeout(done, (reduceMotion.matches ? 180 : 320) + 20);

  if (!fromHistory && location.hash === hash) {
    // undo our own history entry if we made one; otherwise just clear the hash
    if (history.state && history.state.sheet === hash) history.back();
    else history.replaceState(null, '', location.pathname + location.search);
  }
}

function syncToHash() {
  const target = sheets.get(location.hash);
  if (target) open(target, { push: false });
  for (const s of sheets.values()) if (s !== target && s.el.open) close(s, { fromHistory: true });
}

window.addEventListener('popstate', syncToHash);
if (sheets.has(location.hash)) syncToHash();
