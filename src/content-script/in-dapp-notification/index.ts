import * as styles from './styles.module.css';

function preloadIcon(url: string): Promise<HTMLImageElement> {
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
  subtitle,
  iconUrl,
}: {
  title: string;
  subtitle: string;
  iconUrl?: string;
}) {
  clearNotifications();

  let isIconLoaded = false;
  if (iconUrl) {
    try {
      await preloadIcon(iconUrl);
      isIconLoaded = true;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`Failed to load icon ${iconUrl}`, e);
    }
  }

  const notification = document.createElement('div');
  notification.className = styles.notification;

  notification.innerHTML = `
    ${
      iconUrl && isIconLoaded
        ? `<img src="${iconUrl}" class="${styles.icon}" alt="">`
        : ''
    }
    <div class="${styles.content}">
      <div class="${styles.title}">${title}</div>
      <div class="${styles.subtitle}">${subtitle}</div>
    </div>
    <button aria-label="Close" class="${styles.close}">
    </button>
  `;

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
