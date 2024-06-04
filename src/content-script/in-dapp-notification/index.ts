import type { InDappNotification } from 'src/shared/types/InDappNotification';
import * as styles from './styles.module.css';

function preloadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

const notifications = {
  async chainChanged(networkName: string, networkUrl: string) {
    const el = document.createElement('div');
    el.className = `${styles.notification} ${styles.chainChanged}`;

    let isIconLoaded = false;
    try {
      await preloadImage(networkUrl);
      isIconLoaded = true;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`Failed to load network icon ${networkUrl}`, e);
    }

    const networkIconHTML = isIconLoaded
      ? `<img src="${networkUrl}" class="${styles.networkIcon}" alt="">`
      : '';

    el.innerHTML = `
    <div class="${styles.hstack}" style="grid-gap: 12px;">
      <div class=${styles.zerionLogo}>
        ${networkIconHTML}
      </div>
      <div class="${styles.vstack}" style="grid-gap: 0px;">
        <div class="${styles.title}">Network Switched</div>
        <div class="${styles.message}">${networkName}</div>
      </div>
    </div>
    <button aria-label="Close" class="${styles.closeButton}">
    </button>
  `;

    return el;
  },

  switchChainError(chainId: string) {
    const el = document.createElement('div');
    el.className = `${styles.notification} ${styles.switchChainError}`;

    el.innerHTML = `
    <div class="${styles.vstack}" style="grid-gap: 8px;">
      <div class="${styles.hstack}" style="grid-gap: 12px">
        <div class=${styles.zerionLogo}></div>
        <div class="${styles.title}">Unrecognized Network</div>
      </div>
      <div class="${styles.message}">
        Unable to switch network to the <span class="${
          styles.chainId
        }">Chain Id: ${chainId.toString()}</span>.
        Please check your network settings and try again.
      </div>
    </div>
    <button aria-label="Close" class="${styles.closeButton}">
    </button>
  `;

    return el;
  },
};

async function createNotification(notification: InDappNotification) {
  if (notification.event === 'chainChanged') {
    return await notifications.chainChanged(
      notification.networkName,
      notification.networkIcon
    );
  } else {
    return notifications.switchChainError(notification.chainId);
  }
}

function clearNotifications() {
  document
    .querySelectorAll(`.${styles.notification}`)
    .forEach((el) => el.remove());
}

function removeNotification(el: HTMLElement) {
  el.classList.add(styles.fadeOut);
  setTimeout(() => {
    el.remove();
  }, 500);
}

async function showNotification(notification: InDappNotification) {
  clearNotifications();
  const el = await createNotification(notification);
  document.body.appendChild(el);

  setTimeout(() => {
    el.classList.add(styles.show);
  }, 100);
  setTimeout(() => {
    removeNotification(el);
  }, 2400);

  el.querySelector(`.${styles.closeButton}`)?.addEventListener('click', () => {
    removeNotification(el);
  });
}

Object.assign(window, { showNotification, removeNotification });
