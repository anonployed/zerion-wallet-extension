import type { NetworkConfig } from 'src/modules/networks/NetworkConfig';
import { getActiveTabOrigin } from 'src/ui/shared/requests/getActiveTabOrigin';
import { networksStore } from 'src/modules/networks/networks-store.background';
import { emitter } from './events';

declare global {
  interface Window {
    createNotification(title: string, subtitle: string, iconUrl: string): void;
  }
}

function showNetworkSwitchedNotification(network: NetworkConfig) {
  window.createNotification('Network Switched', network.name, network.icon_url);
}

const SCRIPT_PATH = 'content-script/in-dapp-notification/index.js';
const STYLES_PATH = 'content-script/in-dapp-notification/index.css';

export function initialize() {
  emitter.on('chainChanged', async (chain, origin, initiator) => {
    // Do not show in-dapp notifications if the chain change was not triggered by a dapp
    if (initiator !== 'dapp') {
      return;
    }

    const activeTabData = await getActiveTabOrigin();
    const activeTabId = activeTabData?.tab.id;
    const activeTabOrigin = activeTabData?.tabOrigin;

    if (!activeTabId || origin !== activeTabOrigin) {
      return;
    }

    const networks = await networksStore.load([chain.toString()]);
    const network = networks.getNetworkByName(chain);

    if (!network) {
      return;
    }

    await chrome.scripting.insertCSS({
      target: { tabId: activeTabId },
      files: [STYLES_PATH],
    });
    await chrome.scripting.executeScript({
      target: { tabId: activeTabId },
      files: [SCRIPT_PATH],
    });
    await chrome.scripting.executeScript({
      target: { tabId: activeTabId },
      func: showNetworkSwitchedNotification,
      args: [network],
    });

    setTimeout(async () => {
      try {
        await chrome.scripting.removeCSS({
          target: { tabId: activeTabId },
          files: [STYLES_PATH],
        });
      } catch (error) {
        console.warn('Failed to remove CSS:', error);
      }
    }, 5000);

    // TODO: how to handle/display chain switching errors?
  });
}
