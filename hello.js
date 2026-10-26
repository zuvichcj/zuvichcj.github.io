// Logo wink + waving video card.
// Mouse: hover. Keyboard: focus. Touch: tap to toggle, tap anywhere else to close.

const hello = document.getElementById('hello');
const btn = document.getElementById('logo-btn');
const video = document.getElementById('hello-video');

const EXIT_MS = 240; // matches the card's exit transition
let open = false;
let pauseTimer;
let lastPointer = 'mouse';

function show() {
  if (open) return;
  open = true;
  clearTimeout(pauseTimer);
  hello.classList.add('is-waving');
  btn.setAttribute('aria-expanded', 'true');
  try { video.currentTime = 0; } catch {}
  video.play().catch(() => {}); // the poster frame stays if playback is refused
}

function hide() {
  if (!open) return;
  open = false;
  hello.classList.remove('is-waving');
  btn.setAttribute('aria-expanded', 'false');
  // let the card finish leaving before the video stops
  pauseTimer = setTimeout(() => video.pause(), EXIT_MS);
}

btn.addEventListener('pointerdown', (e) => { lastPointer = e.pointerType; });

btn.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') show(); });
btn.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hide(); });

btn.addEventListener('click', () => {
  if (lastPointer === 'touch' || lastPointer === 'pen') open ? hide() : show();
  lastPointer = 'mouse';
});

btn.addEventListener('focus', () => { if (btn.matches(':focus-visible')) show(); });
btn.addEventListener('blur', hide);

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
document.addEventListener('pointerdown', (e) => {
  if (open && e.pointerType !== 'mouse' && !hello.contains(e.target)) hide();
});
