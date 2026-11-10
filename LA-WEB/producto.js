const cartButton = document.querySelector('.cart-button');
const cartToast = document.querySelector('.cart-toast');
const cartToastDetail = cartToast?.querySelector('span');
const productShell = document.querySelector('.product-shell');
const productGallery = document.querySelector('.product-gallery');
const galleryFrames = [...document.querySelectorAll('.product-gallery-frame')];
const galleryHintCount = document.querySelector('.product-gallery-hint b');
const finishOptions = [...document.querySelectorAll('.finish-option')];
const selectedFinish = document.querySelector('.selected-finish strong');
let toastTimer;

const imageDirectory = './assets/product-shots/a01';
const angles = [
  ['01-front-3q', 'vista frontal tres cuartos'],
  ['02-side-profile', 'vista de perfil'],
  ['03-top-down', 'vista cenital'],
  ['04-macro-control-dial', 'detalle macro del dial de control'],
  ['05-macro-leather-stitching', 'detalle macro de la costura de cuero'],
  ['06-rear-headband', 'vista posterior de la diadema'],
];
const finishes = {
  graphite: { suffix: 'gunmetal-amber', label: 'Grafito / Ámbar', spokenLabel: 'Grafito y Ámbar', accent: '#e5952e', hot: '#ffb247' },
  black: { suffix: 'matte-black-copper', label: 'Negro mate / Cobre', spokenLabel: 'Negro mate y Cobre', accent: '#c86b3d', hot: '#ef8b52' },
  silver: { suffix: 'warm-silver-rose-gold', label: 'Plata cálida / Oro rosa', spokenLabel: 'Plata cálida y Oro rosa', accent: '#df8d83', hot: '#ffb0a3' },
};

let activeFinish = 'graphite';
let frameIndex = 0;
let visibleLayer = 0;
let transitionLocked = false;
let queuedView = null;
let isDragging = false;
let dragAnchorX = 0;

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

const updateGalleryState = () => {
  galleryHintCount.textContent = `${String(frameIndex + 1).padStart(2, '0')} / 06`;
  productGallery.setAttribute(
    'aria-label',
    `Carrusel de AMPER A–01. ${finishes[activeFinish].spokenLabel}, ${angles[frameIndex][1]}. Arrastra horizontalmente, usa las flechas del teclado o pulsa para ampliar.`,
  );
};

const flushView = () => {
  if (transitionLocked || !queuedView) return;

  const nextView = queuedView;
  queuedView = null;
  const nextSource = sourceFor(nextView.finish, nextView.index);
  if (nextSource === displayedSource) return;

  transitionLocked = true;
  const incomingLayer = 1 - visibleLayer;
  const incomingFrame = galleryFrames[incomingLayer];
  const outgoingFrame = galleryFrames[visibleLayer];

  const revealFrame = () => {
    incomingFrame.alt = `Auriculares AMPER A–01, acabado ${finishes[nextView.finish].spokenLabel}, ${angles[nextView.index][1]}`;
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
  updateGalleryState();
  flushView();
};

const finishDrag = (event) => {
  if (!isDragging) return;
  isDragging = false;
  productGallery.classList.remove('is-dragging');
  if (productGallery.hasPointerCapture(event.pointerId)) productGallery.releasePointerCapture(event.pointerId);
};

productGallery.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  isDragging = true;
  dragAnchorX = event.clientX;
  productGallery.classList.add('is-dragging');
  productGallery.setPointerCapture(event.pointerId);
  event.preventDefault();
});

productGallery.addEventListener('pointermove', (event) => {
  if (!isDragging) return;
  const delta = event.clientX - dragAnchorX;
  const threshold = 46;
  const steps = Math.trunc(Math.abs(delta) / threshold);
  if (!steps) return;

  showView(frameIndex + (delta < 0 ? steps : -steps));
  dragAnchorX += Math.sign(delta) * steps * threshold;
});

productGallery.addEventListener('pointerup', finishDrag);
productGallery.addEventListener('pointercancel', finishDrag);
productGallery.addEventListener('keydown', (event) => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  showView(frameIndex + (event.key === 'ArrowRight' ? 1 : -1));
});

finishOptions.forEach((option, optionIndex) => {
  option.addEventListener('click', () => {
    activeFinish = option.dataset.finish;
    const finish = finishes[activeFinish];

    finishOptions.forEach((item) => {
      const isActive = item === option;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-checked', String(isActive));
    });

    selectedFinish.textContent = finish.label;
    productShell.style.setProperty('--dynamic-accent', finish.accent);
    productShell.style.setProperty('--dynamic-accent-hot', finish.hot);
    showView(frameIndex);
  });

  option.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
    const nextOption = finishOptions[(optionIndex + direction + finishOptions.length) % finishOptions.length];
    nextOption.focus();
    nextOption.click();
  });
});

cartButton.addEventListener('click', () => {
  cartToastDetail.textContent = `— A–01, ${finishes[activeFinish].label}`;
  cartButton.classList.add('is-pressed');
  cartToast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    cartButton.classList.remove('is-pressed');
    cartToast.classList.remove('show');
  }, 1500);
});

updateGalleryState();
