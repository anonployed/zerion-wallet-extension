import * as styles from './styles.module.css';

function preloadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

function clearNotifications() {
  document
    .querySelectorAll(`.${styles.notification}`)
    .forEach((notification) => notification.remove());
}

function removeNotification(notification: HTMLElement) {
  notification.classList.add(styles.fadeOut);
  setTimeout(() => {
    notification.remove();
  }, 500);
}

async function createNotification({
  title,
  message,
  icon,
  compact,
}: {
  title: string;
  message: string;
  icon: string;
  compact: boolean;
}) {
  clearNotifications();

  const iconSrc = icon.startsWith('http') ? icon : chrome.runtime.getURL(icon);
  let isIconLoaded = false;

  if (iconSrc) {
    try {
      await preloadImage(iconSrc);
      isIconLoaded = true;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`Failed to load icon ${iconSrc}`, e);
    }
  }

  const notification = document.createElement('div');
  const layout = compact ? 'compact' : 'large';
  notification.className = `${styles.notification} ${styles[layout]}`;

  const iconHTML =
    iconSrc && isIconLoaded
      ? `<img src="${iconSrc}" class="${styles.icon}" alt="">`
      : '';
  const closeButtonHTML = `
      <button aria-label="Close" class="${styles.closeButton}">
      </button>
  `;

  if (compact) {
    notification.innerHTML = `
      <div class="${styles.hstack}" style="grid-gap: 12px;">
        ${iconHTML}
        <div class="${styles.vstack}" style="grid-gap: 4px;">
          <div class="${styles.title}">${title}</div>
          <div class="${styles.message}">${message}</div>
        </div>
      </div>
      ${closeButtonHTML}
  `;
  } else {
    notification.innerHTML = `
      <div class="${styles.vstack}" style="grid-gap: 8px;">
        <div class="${styles.hstack}" style="grid-gap: 12px">
          ${iconHTML}
          <div class="${styles.title}">${title}</div>
        </div>
        <div class="${styles.message}">${message}</div>
      </div>
      ${closeButtonHTML}
    `;
  }

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add(styles.show);
  }, 100);

  setTimeout(() => {
    removeNotification(notification);
  }, 2400);

  notification
    .querySelector(`.${styles.close}`)
    ?.addEventListener('click', () => {
      removeNotification(notification);
    });
}

Object.assign(window, { createNotification, removeNotification });
