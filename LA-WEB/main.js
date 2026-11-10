const buildButton = document.querySelector('.build-button');
const toast = document.querySelector('.toast');
const navLinks = [...document.querySelectorAll('.nav a')];
const pageShell = document.querySelector('.page-shell');
const productStage = document.querySelector('.product-stage');
const productViewer = document.querySelector('.product-viewer');
const viewerFrames = [...document.querySelectorAll('.viewer-frame')];
const viewerHintCount = document.querySelector('.viewer-hint b');
const orbitVideo = document.querySelector('.orbit-video');
const finishChoices = [...document.querySelectorAll('.finish-choice')];
const introOverlay = document.querySelector('.intro-overlay');
const introVideo = document.querySelector('.intro-video');
const introStart = document.querySelector('.intro-start');
const introSkip = document.querySelector('.intro-skip');
const scrollHeroShell = document.querySelector('.scroll-hero-shell');
const scrollHero = document.querySelector('.scroll-hero-sticky');
const scrubStageSlot = document.querySelector('.scrub-stage-slot');
const scrubStage = document.querySelector('.scrub-stage');
const scrubCanvas = document.querySelector('.scrub-canvas');
const scrubLoaderLabel = document.querySelector('.scrub-loader small');
const scrubLoaderCount = document.querySelector('.scrub-loader strong span');
const scrubInstrumentLabel = document.querySelector('.scrub-instrument > span');
const scrubInstrumentFill = document.querySelector('.scrub-instrument i b');
const scrubInstrumentCount = document.querySelector('.scrub-instrument strong');
const scrubHint = document.querySelector('.scrub-hint');
let toastTimer;

let introDismissed = false;
let introDeadlineTimer;
let introSkipTimer;

const dismissIntro = ({ restoreFocus = false } = {}) => {
  if (introDismissed) return;
  introDismissed = true;
  window.clearTimeout(introDeadlineTimer);
  window.clearTimeout(introSkipTimer);
  introVideo.pause();
  introOverlay.classList.add('is-leaving');
  pageShell.inert = false;
  pageShell.removeAttribute('aria-hidden');
  document.body.classList.remove('intro-active');
  window.requestAnimationFrame(() => requestScrubRender());

  window.setTimeout(() => {
    introOverlay.hidden = true;
    if (restoreFocus) document.querySelector('.wordmark')?.focus({ preventScroll: true });
  }, 600);
};

if (introOverlay && introVideo && introStart && introSkip) {
  pageShell.inert = true;
  pageShell.setAttribute('aria-hidden', 'true');
  introVideo.muted = false;
  introVideo.volume = 1;

  const playback = introVideo.play();
  if (playback) playback.catch(() => introOverlay.classList.add('autoplay-blocked'));

  introStart.addEventListener('click', () => {
    introOverlay.classList.remove('autoplay-blocked');
    introVideo.currentTime = 0;
    const resumedPlayback = introVideo.play();
    if (resumedPlayback) resumedPlayback.catch(() => introOverlay.classList.add('autoplay-blocked'));
  });

  introVideo.addEventListener('ended', () => dismissIntro(), { once: true });
  introVideo.addEventListener('error', () => dismissIntro(), { once: true });
  introSkip.addEventListener('click', () => dismissIntro({ restoreFocus: true }));

  introSkipTimer = window.setTimeout(() => {
    introSkip.disabled = false;
    introOverlay.classList.add('show-skip');
  }, 1000);
}

const assemblyFrameCount = 18;
const rotationFrameCount = 36;
const scrubSources = [
  ...Array.from({ length: assemblyFrameCount }, (_, index) =>
    `./assets/product-shots/a01/assembly-sequence/frame-${String(index + 1).padStart(3, '0')}.jpg`),
  ...Array.from({ length: rotationFrameCount - 1 }, (_, index) =>
    `./assets/product-shots/a01/scroll-sequence/frame-${String(index + 2).padStart(3, '0')}.jpg`),
];
const scrubFrameCount = scrubSources.length;
const scrubFrames = new Array(scrubFrameCount);
const scrubContext = scrubCanvas?.getContext('2d', { alpha: true });
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const cinematicPlayEnd = .86;
let scrubReady = false;
let scrubCurrentFrame = -1;
let scrubRenderRequest = 0;
let cinematicActive = false;

const scrubSourceFor = (index) => new URL(scrubSources[index], document.baseURI).href;
const clampUnit = (value) => Math.min(1, Math.max(0, value));

const scrubProgress = () => {
  const shellTop = scrollHeroShell.getBoundingClientRect().top + window.scrollY;
  const scrubDistance = Math.max(1, scrollHeroShell.offsetHeight - scrollHero.offsetHeight);
  return clampUnit((window.scrollY - shellTop) / scrubDistance);
};

const drawScrubFrame = (index, force = false, drawingArea = null) => {
  if (!scrubContext || !scrubCanvas || !scrubFrames[index]) return;
  if (!force && index === scrubCurrentFrame) return;

  scrubCurrentFrame = index;
  const frame = scrubFrames[index];
  const canvasWidth = scrubCanvas.width;
  const canvasHeight = scrubCanvas.height;
  const canvasBounds = scrubCanvas.getBoundingClientRect();
  const scaleX = canvasWidth / Math.max(1, canvasBounds.width);
  const scaleY = canvasHeight / Math.max(1, canvasBounds.height);
  const area = drawingArea
    ? {
        left: drawingArea.left * scaleX,
        top: drawingArea.top * scaleY,
        width: drawingArea.width * scaleX,
        height: drawingArea.height * scaleY,
      }
    : { left: 0, top: 0, width: canvasWidth, height: canvasHeight };
  const scale = Math.min(area.width / frame.naturalWidth, area.height / frame.naturalHeight) * .84;
  const drawWidth = frame.naturalWidth * scale;
  const drawHeight = frame.naturalHeight * scale;

  scrubContext.clearRect(0, 0, canvasWidth, canvasHeight);
  scrubContext.drawImage(
    frame,
    area.left + (area.width - drawWidth) / 2,
    area.top + (area.height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
};

const resizeScrubCanvas = () => {
  if (!scrubCanvas || !scrubContext) return;
  const bounds = scrubCanvas.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const nextWidth = Math.max(1, Math.round(bounds.width * pixelRatio));
  const nextHeight = Math.max(1, Math.round(bounds.height * pixelRatio));

  if (scrubCanvas.width !== nextWidth || scrubCanvas.height !== nextHeight) {
    scrubCanvas.width = nextWidth;
    scrubCanvas.height = nextHeight;
  }

  if (scrubReady) drawScrubFrame(scrubCurrentFrame < 0 ? 0 : scrubCurrentFrame, true);
};

const setCinematicActive = (active) => {
  if (active === cinematicActive) return;
  cinematicActive = active;
  document.body.classList.toggle('cinematic-active', active);
  scrubStage.classList.toggle('is-cinematic', active);

  if (!active) {
    scrubStage.classList.remove('is-settling');
    scrubStage.classList.remove('is-assembly-phase');
    scrubStage.style.removeProperty('clip-path');
    scrubStage.style.removeProperty('-webkit-clip-path');
  }

  resizeScrubCanvas();
};

const cinematicLayout = (progress) => {
  const destination = scrubStageSlot.getBoundingClientRect();
  let viewportAmount = 1;

  if (progress > cinematicPlayEnd) {
    viewportAmount = 1 - clampUnit((progress - cinematicPlayEnd) / (1 - cinematicPlayEnd));
  }

  const inverseAmount = 1 - viewportAmount;
  const insetTop = Math.max(0, destination.top * inverseAmount);
  const insetRight = Math.max(0, (window.innerWidth - destination.right) * inverseAmount);
  const insetBottom = Math.max(0, (window.innerHeight - destination.bottom) * inverseAmount);
  const insetLeft = Math.max(0, destination.left * inverseAmount);
  const clip = `inset(${insetTop}px ${insetRight}px ${insetBottom}px ${insetLeft}px)`;
  scrubStage.style.clipPath = clip;
  scrubStage.style.webkitClipPath = clip;
  scrubStage.classList.toggle('is-settling', progress > cinematicPlayEnd);

  return {
    left: destination.left * inverseAmount,
    top: destination.top * inverseAmount,
    width: destination.width + (window.innerWidth - destination.width) * viewportAmount,
    height: destination.height + (window.innerHeight - destination.height) * viewportAmount,
  };
};

const renderScrub = () => {
  scrubRenderRequest = 0;
  if (!scrubReady) return;

  const progress = scrubProgress();
  if (reduceMotionQuery.matches) {
    setCinematicActive(false);
    const reducedIndex = progress > 0 ? scrubFrameCount - 1 : 0;
    drawScrubFrame(reducedIndex);
    return;
  }

  const isTakeover = progress < 1;
  setCinematicActive(isTakeover);

  const frameProgress = progress >= cinematicPlayEnd
    ? 1
    : clampUnit(progress / cinematicPlayEnd);
  const index = Math.round(frameProgress * (scrubFrameCount - 1));
  const drawingArea = isTakeover ? cinematicLayout(progress) : null;
  const morphingViewport = isTakeover && progress > cinematicPlayEnd;
  drawScrubFrame(index, morphingViewport, drawingArea);
  const inAssembly = index < assemblyFrameCount;
  scrubStage.classList.toggle('is-assembly-phase', inAssembly && isTakeover);
  scrubInstrumentLabel.textContent = inAssembly ? 'MONTAJE / A–01' : 'ÓRBITA / A–01';
  scrubHint.lastChild.textContent = inAssembly ? ' DESLIZA PARA ENSAMBLAR' : ' DESLIZA PARA GIRAR';
  scrubInstrumentFill.style.width = `${frameProgress * 100}%`;
  scrubInstrumentCount.textContent = `${String(index + 1).padStart(2, '0')} / ${scrubFrameCount}`;
};

const requestScrubRender = () => {
  if (scrubRenderRequest) return;
  scrubRenderRequest = window.requestAnimationFrame(renderScrub);
};

const preloadScrubSequence = async () => {
  if (!scrubStage || !scrubStageSlot || !scrubCanvas || !scrollHeroShell || !scrollHero) {
    document.body.classList.remove('scrub-loading');
    return;
  }

  if (!reduceMotionQuery.matches && scrubProgress() < 1) {
    setCinematicActive(true);
    cinematicLayout(0);
    scrubStage.classList.add('is-assembly-phase');
  }

  let loadedCount = 0;
  try {
    await Promise.all(Array.from({ length: scrubFrameCount }, (_, index) => new Promise((resolve, reject) => {
      const frame = new Image();
      frame.decoding = 'async';
      frame.onload = async () => {
        try { await frame.decode(); } catch (_) { /* onload is sufficient for local frames */ }
        scrubFrames[index] = frame;
        loadedCount += 1;
        scrubLoaderCount.textContent = String(loadedCount).padStart(2, '0');
        resolve();
      };
      frame.onerror = reject;
      frame.src = scrubSourceFor(index);
    })));

    scrubReady = true;
    resizeScrubCanvas();
    renderScrub();
    scrubStage.classList.add('is-ready');
    scrubLoaderLabel.textContent = 'SECUENCIA PREPARADA';
  } catch (error) {
    scrubStage.classList.add('has-error');
    scrubLoaderLabel.textContent = 'SECUENCIA NO DISPONIBLE';
    console.error('No se pudo precargar la secuencia continua de AMPER.', error);
  } finally {
    document.body.classList.remove('scrub-loading');
  }
};

window.addEventListener('scroll', requestScrubRender, { passive: true });
window.addEventListener('resize', () => {
  resizeScrubCanvas();
  requestScrubRender();
});
reduceMotionQuery.addEventListener?.('change', requestScrubRender);
preloadScrubSequence();

const angles = [
  ['01-front-3q', 'vista frontal tres cuartos'],
  ['02-side-profile', 'vista de perfil'],
  ['03-top-down', 'vista cenital'],
  ['04-macro-control-dial', 'detalle macro del dial de control'],
  ['05-macro-leather-stitching', 'detalle macro de la costura de cuero'],
  ['06-rear-headband', 'vista posterior de la diadema'],
];
const finishes = {
  graphite: { suffix: 'gunmetal-amber', label: 'Grafito y Ámbar', accent: '#e5952e', hot: '#ffb247' },
  black: { suffix: 'matte-black-copper', label: 'Negro mate y Cobre', accent: '#c86b3d', hot: '#ef8b52' },
  silver: { suffix: 'warm-silver-rose-gold', label: 'Plata cálida y Oro rosa', accent: '#df8d83', hot: '#ffb0a3' },
};
const imageDirectory = './assets/product-shots/a01';

let activeFinish = 'graphite';
let frameIndex = 0;
let visibleLayer = 0;
let transitionLocked = false;
let queuedView = null;
let isDragging = false;
let dragAnchorX = 0;
let interactiveMode = false;
let orbitPauseTimer;

const wrapFrame = (index) => (index + angles.length) % angles.length;
const sourceFor = (finish, index) => new URL(
  `${imageDirectory}/${angles[index][0]}-${finishes[finish].suffix}.png`,
  document.baseURI,
).href;
let displayedSource = sourceFor(activeFinish, frameIndex);

Object.keys(finishes).forEach((finish) => {
  angles.forEach((_, index) => {
    const preload = new Image();
    preload.src = sourceFor(finish, index);
  });
});

const updateViewerState = () => {
  viewerHintCount.textContent = `${String(frameIndex + 1).padStart(2, '0')} / 06`;
  productViewer.setAttribute(
    'aria-label',
    interactiveMode
      ? `Visor 360 de AMPER A–01. ${finishes[activeFinish].label}, ${angles[frameIndex][1]}. Arrastra horizontalmente, usa las flechas del teclado o pulsa para ampliar.`
      : 'Órbita de AMPER A–01. Toca o arrastra para explorar el producto.',
  );
};

const enterInteractiveMode = () => {
  if (interactiveMode) return;
  interactiveMode = true;
  productViewer.classList.add('is-interactive');
  updateViewerState();

  window.clearTimeout(orbitPauseTimer);
  orbitPauseTimer = window.setTimeout(() => {
    orbitVideo?.pause();
    productViewer.removeAttribute('data-lightbox-disabled');
  }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 540);
};

orbitVideo?.addEventListener('error', enterInteractiveMode, { once: true });

const flushView = () => {
  if (transitionLocked || !queuedView) return;

  const nextView = queuedView;
  queuedView = null;
  const nextSource = sourceFor(nextView.finish, nextView.index);

  if (nextSource === displayedSource) {
    if (queuedView) flushView();
    return;
  }

  transitionLocked = true;
  const incomingLayer = 1 - visibleLayer;
  const incomingFrame = viewerFrames[incomingLayer];
  const outgoingFrame = viewerFrames[visibleLayer];

  const revealFrame = () => {
    incomingFrame.alt = `Auriculares AMPER A–01, acabado ${finishes[nextView.finish].label}, ${angles[nextView.index][1]}`;
    incomingFrame.removeAttribute('aria-hidden');
    outgoingFrame.setAttribute('aria-hidden', 'true');
    requestAnimationFrame(() => {
      incomingFrame.classList.add('is-active');
      outgoingFrame.classList.remove('is-active');
    });

    window.setTimeout(() => {
      visibleLayer = incomingLayer;
      displayedSource = nextSource;
      transitionLocked = false;
      if (queuedView) flushView();
    }, 145);
  };

  incomingFrame.src = nextSource;
  if (incomingFrame.complete) revealFrame();
  else incomingFrame.addEventListener('load', revealFrame, { once: true });
};

const showView = (index) => {
  frameIndex = wrapFrame(index);
  queuedView = { finish: activeFinish, index: frameIndex };
  updateViewerState();
  flushView();
};

const finishDrag = (event) => {
  if (!isDragging) return;
  isDragging = false;
  productViewer.classList.remove('is-dragging');
  if (productViewer.hasPointerCapture(event.pointerId)) productViewer.releasePointerCapture(event.pointerId);
};

productViewer.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  enterInteractiveMode();
  isDragging = true;
  dragAnchorX = event.clientX;
  productViewer.classList.add('is-dragging');
  productViewer.setPointerCapture(event.pointerId);
  event.preventDefault();
});

productViewer.addEventListener('pointermove', (event) => {
  if (!isDragging) return;
  const delta = event.clientX - dragAnchorX;
  const threshold = 46;
  const steps = Math.trunc(Math.abs(delta) / threshold);
  if (!steps) return;

  showView(frameIndex + (delta < 0 ? steps : -steps));
  dragAnchorX += Math.sign(delta) * steps * threshold;
});

productViewer.addEventListener('pointerup', finishDrag);
productViewer.addEventListener('pointercancel', finishDrag);

productViewer.addEventListener('keydown', (event) => {
  if (!interactiveMode && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    enterInteractiveMode();
    return;
  }
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  enterInteractiveMode();
  showView(frameIndex + (event.key === 'ArrowRight' ? 1 : -1));
});

finishChoices.forEach((choice, choiceIndex) => {
  choice.addEventListener('click', () => {
    enterInteractiveMode();
    activeFinish = choice.dataset.finish;
    const finish = finishes[activeFinish];

    finishChoices.forEach((item) => {
      const isActive = item === choice;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-checked', String(isActive));
    });

    pageShell.style.setProperty('--dynamic-accent', finish.accent);
    pageShell.style.setProperty('--dynamic-accent-hot', finish.hot);
    showView(frameIndex);
  });

  choice.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
    const nextChoice = finishChoices[(choiceIndex + direction + finishChoices.length) % finishChoices.length];
    nextChoice.focus();
    nextChoice.click();
  });
});

updateViewerState();
if (reduceMotionQuery.matches) enterInteractiveMode();

buildButton.addEventListener('click', (event) => {
  event.preventDefault();
  const target = buildButton.href;
  buildButton.classList.add('is-pressed');
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    buildButton.classList.remove('is-pressed');
    toast.classList.remove('show');
  }, 800);
  window.setTimeout(() => {
    window.location.href = target;
  }, 320);
});

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.forEach((item) => item.classList.remove('active'));
    link.classList.add('active');
  });
});
