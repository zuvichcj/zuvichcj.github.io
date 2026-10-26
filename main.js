// Paper GrainGradient background — values copied from the "Start" frame in Paper
// (@paper-design/shaders-react 0.0.81 <GrainGradient />), rendered without React.
//
// The canvas covers the whole page (not just the screen), so the blobs and grain
// sit at fixed spots on the page and scroll with the text. The composition is
// anchored to the first screen, so that screen matches the Paper frame; the
// blobs are free to drift down into the footer.
import {
  ShaderMount,
  getShaderColorFromString,
  getShaderNoiseTexture,
  grainGradientFragmentShader,
  GrainGradientShapes,
  ShaderFitOptions,
} from './vendor/paper-shaders.js';

const params = {
  speed: 0.17,
  frame: 406088.35,           // starting point of the animation, so it opens on the Paper composition
  colors: ['#00BFFF33', '#4154EC99'],
  colorBack: '#00000000',     // transparent; Grey100 shows through from .paper
  softness: 0.72,
  intensity: 0.55,
  noise: 1,
  shape: 'blob',
  scale: 1.18,
  rotation: -280,
  offsetX: 0.18,
  offsetY: 0,
};

const el = document.getElementById('paper');
const firstScreen = document.querySelector('.main-view');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Place the "world" (the Paper frame) over the first screen of a taller canvas.
// The blob shape is measured in units of the world's shorter side and centred on
// the world, so we size the world to the first screen and shift its origin up.
function layout() {
  const w = el.clientWidth;
  const h = el.clientHeight;           // whole page
  const vh = firstScreen.offsetHeight; // first screen
  const side = Math.min(w, vh);
  const originY = h > side ? 0.5 - (h - vh) / (2 * (h - side)) : 0.5;
  return {
    u_fit: ShaderFitOptions.none,
    u_worldWidth: w,
    u_worldHeight: vh,
    u_originX: 0.5,
    u_originY: originY,
  };
}

try {
  // The noise texture must finish loading before the shader can use it
  const noiseTexture = getShaderNoiseTexture();
  await noiseTexture.decode();

  const mount = new ShaderMount(
    el,
    grainGradientFragmentShader,
    {
      u_colorBack: getShaderColorFromString(params.colorBack),
      u_colors: params.colors.map(getShaderColorFromString),
      u_colorsCount: params.colors.length,
      u_softness: params.softness,
      u_intensity: params.intensity,
      u_noise: params.noise,
      u_shape: GrainGradientShapes[params.shape],
      u_noiseTexture: noiseTexture,
      u_scale: params.scale,
      u_rotation: params.rotation,
      u_offsetX: params.offsetX,
      u_offsetY: params.offsetY,
      ...layout(),
    },
    undefined,
    reduceMotion.matches ? 0 : params.speed,
    params.frame,
    2,                 // min pixel ratio (Paper's default)
    3840 * 2160 * 2,   // pixel budget: the canvas is taller than the screen, and
                       // downscaling it smears the grain, so allow more than the default
  );

  // Keep the composition anchored when the window or page height changes
  let raf;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => mount.setUniforms(layout()));
  });
  ro.observe(el);
  ro.observe(firstScreen);

  // Hold still for people who ask for reduced motion
  reduceMotion.addEventListener('change', (e) => mount.setSpeed(e.matches ? 0 : params.speed));
} catch (err) {
  // No WebGL: the plain Grey100 background stays
  console.warn('Paper shader unavailable:', err);
}
