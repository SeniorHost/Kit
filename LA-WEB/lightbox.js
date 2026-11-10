(() => {
  const triggers = [...document.querySelectorAll('[data-lightbox]')];
  if (!triggers.length) return;
  const transparentPixel = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

  const overlay = document.createElement('div');
  overlay.className = 'media-lightbox';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Vista ampliada');
  overlay.innerHTML = `
    <button class="media-lightbox-close" type="button" aria-label="Cerrar vista ampliada">CERRAR <span aria-hidden="true">×</span></button>
    <figure class="media-lightbox-frame">
      <img class="media-lightbox-image" src="${transparentPixel}" alt="" />
      <figcaption class="media-lightbox-caption"></figcaption>
    </figure>
  `;
  document.body.append(overlay);

  const closeButton = overlay.querySelector('.media-lightbox-close');
  const fullImage = overlay.querySelector('.media-lightbox-image');
  const caption = overlay.querySelector('.media-lightbox-caption');
  const pageShell = document.querySelector('.page-shell');
  let activeTrigger = null;
  let shellHadInert = false;
  let shellAriaHidden = null;
  let closeTimer;
  let pointerOrigin = null;
  let pointerDragged = false;

  const sourceImageFor = (trigger) => {
    const currentSelector = trigger.dataset.lightboxCurrent;
    if (currentSelector) return trigger.querySelector(currentSelector);
    if (trigger.matches('img')) return trigger;
    return trigger.querySelector('img');
  };

  const openLightbox = (trigger) => {
    const sourceImage = sourceImageFor(trigger);
    if (!sourceImage) return;

    window.clearTimeout(closeTimer);
    activeTrigger = trigger;
    fullImage.src = sourceImage.currentSrc || sourceImage.src;
    fullImage.alt = sourceImage.alt || 'Imagen ampliada de AMPER A–01';
    caption.textContent = sourceImage.alt || 'AMPER A–01';
    shellHadInert = pageShell?.hasAttribute('inert') ?? false;
    shellAriaHidden = pageShell?.getAttribute('aria-hidden') ?? null;
    pageShell?.setAttribute('inert', '');
    pageShell?.setAttribute('aria-hidden', 'true');
    document.body.classList.add('lightbox-open');
    overlay.hidden = false;
    requestAnimationFrame(() => {
      overlay.classList.add('is-open');
      closeButton.focus({ preventScroll: true });
    });
  };

  const closeLightbox = () => {
    if (overlay.hidden) return;
    overlay.classList.remove('is-open');
    document.body.classList.remove('lightbox-open');

    if (!shellHadInert) pageShell?.removeAttribute('inert');
    if (shellAriaHidden === null) pageShell?.removeAttribute('aria-hidden');
    else pageShell?.setAttribute('aria-hidden', shellAriaHidden);

    closeTimer = window.setTimeout(() => {
      overlay.hidden = true;
      fullImage.src = transparentPixel;
      activeTrigger?.focus({ preventScroll: true });
      activeTrigger = null;
    }, 240);
  };

  document.addEventListener('pointerdown', (event) => {
    const trigger = event.target.closest('[data-lightbox]');
    if (!trigger) return;
    if (trigger.hasAttribute('data-lightbox-disabled')) {
      pointerOrigin = null;
      pointerDragged = false;
      return;
    }
    pointerOrigin = { x: event.clientX, y: event.clientY, trigger };
    pointerDragged = false;
  }, true);

  document.addEventListener('pointermove', (event) => {
    if (!pointerOrigin) return;
    if (Math.hypot(event.clientX - pointerOrigin.x, event.clientY - pointerOrigin.y) > 8) pointerDragged = true;
  }, true);

  document.addEventListener('pointercancel', () => {
    pointerOrigin = null;
    pointerDragged = false;
  }, true);

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      if (trigger.hasAttribute('data-lightbox-disabled')) {
        pointerOrigin = null;
        pointerDragged = false;
        return;
      }
      if (pointerDragged && pointerOrigin?.trigger === trigger) {
        pointerOrigin = null;
        pointerDragged = false;
        return;
      }
      event.preventDefault();
      pointerOrigin = null;
      openLightbox(trigger);
    });

    trigger.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (trigger.hasAttribute('data-lightbox-disabled')) return;
      event.preventDefault();
      openLightbox(trigger);
    });
  });

  closeButton.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeLightbox();
  });
  document.addEventListener('keydown', (event) => {
    if (overlay.hidden) return;
    if (event.key === 'Escape') closeLightbox();
    if (event.key === 'Tab') {
      event.preventDefault();
      closeButton.focus({ preventScroll: true });
    }
  });
})();
