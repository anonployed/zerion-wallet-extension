import * as styles from './styles.module.css';

function preloadIcon(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

function removeNotification(notification: HTMLElement) {
  notification.classList.add(styles.fadeOut);
  setTimeout(() => {
    notification.remove();
  }, 500);
}

function createNotification(title: string, subtitle: string, iconUrl: string) {
  preloadIcon(iconUrl).then(() => {
    const notification = document.createElement('div');
    notification.className = styles.notification;

    notification.innerHTML = `
    <img src="${iconUrl}" class="${styles.icon}" alt="">
    <div class="${styles.content}">
      <div class="${styles.title}">${title}</div>
      <div class="${styles.subtitle}">${subtitle}</div>
    </div>
    <button class="${styles.close}">
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
  });
}

Object.assign(window, { createNotification, removeNotification });
