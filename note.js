// Email note: a grid-paper tag hanging from "Email".
// Mouse: hover "Email" (the tag stays while you move onto it); clicking
// "Email" opens the mail app as usual. Keyboard: focus opens it, Tab moves
// into it. Touch: the first tap opens the tag. Clicking the address copies it.

const link = document.getElementById('email-link');
const note = document.getElementById('note');
const copyBtn = document.getElementById('note-copy');
const status = document.getElementById('note-status');
const nav = link.closest('.nav');

const HINT = status.textContent;
let open = false;
let hideTimer;
let lastPointer = 'mouse';

// Hang the tag straight below "Email", but keep it on screen
function place() {
  const navBox = nav.getBoundingClientRect();
  const linkBox = link.getBoundingClientRect();
  const w = note.offsetWidth;
  const gutter = 16;
  let x = linkBox.left + linkBox.width / 2 - navBox.left - w / 2;
  const maxX = document.documentElement.clientWidth - gutter - navBox.left - w;
  x = Math.max(Math.min(x, maxX), gutter - navBox.left);
  note.style.setProperty('--note-x', `${Math.round(x)}px`);
}

function show() {
  clearTimeout(hideTimer);
  if (open) return;
  open = true;
  place();
  note.classList.add('is-open');
  link.setAttribute('aria-expanded', 'true');
}

function hide(delay = 0) {
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    open = false;
    note.classList.remove('is-open');
    link.setAttribute('aria-expanded', 'false');
  }, delay);
}

for (const el of [link, note]) {
  el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') show(); });
  el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hide(180); });
}

link.addEventListener('pointerdown', (e) => { lastPointer = e.pointerType; });
link.addEventListener('click', (e) => {
  if (lastPointer !== 'mouse' && !open) { e.preventDefault(); show(); }
  lastPointer = 'mouse';
});

link.addEventListener('focus', () => { if (link.matches(':focus-visible')) show(); });
nav.addEventListener('focusout', () => {
  setTimeout(() => {
    const a = document.activeElement;
    if (open && a !== link && !note.contains(a) && !note.matches(':hover')) hide();
  }, 0);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && open) { hide(); link.focus({ preventScroll: true }); }
});
document.addEventListener('pointerdown', (e) => {
  if (open && e.pointerType !== 'mouse' && !note.contains(e.target) && e.target !== link) hide();
});
window.addEventListener('resize', () => { if (open) place(); });

// Click the address to copy it
let resetTimer;
copyBtn.addEventListener('click', async () => {
  const text = copyBtn.textContent.trim();
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; }
  catch {
    const range = document.createRange();
    range.selectNodeContents(copyBtn);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    try { ok = document.execCommand('copy'); } catch {}
  }
  status.textContent = ok ? 'copied!' : 'selected, press ⌘C';
  status.classList.toggle('is-copied', ok);
  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    status.textContent = HINT;
    status.classList.remove('is-copied');
  }, 1800);
});
