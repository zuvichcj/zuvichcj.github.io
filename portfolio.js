// Portfolio gallery: free scrolling that snaps to the nearest work when you
// let go (CSS scroll-snap does the snapping). This keeps the "01 / 23" counter
// in sync and adds arrow-key / Page Up-Down stepping between works.

const sheet = document.getElementById('portfolio');
const gallery = document.getElementById('pf-gallery');
const slides = [...gallery.querySelectorAll('.pf-slide')];
const countN = document.getElementById('pf-count-n');
const countTitle = document.getElementById('pf-count-title');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let current = 0;

const pad = (n) => String(n).padStart(2, '0');

function setCurrent(i) {
  if (i === current) return;
  current = i;
  countN.textContent = pad(i + 1);
  countTitle.textContent = slides[i].dataset.title;
}

// The work whose middle is nearest the middle of the gallery is "current"
function nearest() {
  const box = gallery.getBoundingClientRect();
  const mid = box.top + box.height / 2;
  let best = 0, bestD = Infinity;
  slides.forEach((s, i) => {
    const r = s.getBoundingClientRect();
    const d = Math.abs(r.top + r.height / 2 - mid);
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

let raf;
const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setCurrent(nearest())); };
gallery.addEventListener('scroll', onScroll, { passive: true });
// on phones the whole sheet scrolls instead of the gallery
sheet.querySelector('.pf').addEventListener('scroll', onScroll, { passive: true });

function go(i) {
  i = Math.max(0, Math.min(slides.length - 1, i));
  slides[i].scrollIntoView({ block: 'center', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
}

gallery.addEventListener('keydown', (e) => {
  const next = ['ArrowDown', 'ArrowRight', 'PageDown', ' '];
  const prev = ['ArrowUp', 'ArrowLeft', 'PageUp'];
  if (next.includes(e.key) && !e.shiftKey) { e.preventDefault(); go(nearest() + 1); }
  else if (prev.includes(e.key) || (e.key === ' ' && e.shiftKey)) { e.preventDefault(); go(nearest() - 1); }
  else if (e.key === 'Home') { e.preventDefault(); go(0); }
  else if (e.key === 'End') { e.preventDefault(); go(slides.length - 1); }
});

// Keep the counter at the bottom of the gallery, lined up with the right
// edge of the image (on wide screens that's the image's bottom-right corner;
// on tablets, where the image is narrower than the space, it stays at the
// bottom instead of following the image up). Every work has the same frame,
// so one image's box is enough.
const main = gallery.parentElement;
function pinCounter() {
  const img = slides[0].querySelector('img');
  const g = gallery.getBoundingClientRect();
  const r = img.getBoundingClientRect();
  if (!r.width) return;
  const inset = 12;
  main.style.setProperty('--count-right', `${Math.round(g.right - r.right + inset)}px`);
  main.style.setProperty('--count-bottom', `${8 + inset}px`);
}
new ResizeObserver(pinCounter).observe(gallery);
slides[0].querySelector('img').addEventListener('load', pinCounter);

// Start from the first work each time the sheet opens
sheet.addEventListener('sheet:open', () => { current = -1; setCurrent(0); requestAnimationFrame(pinCounter); });
