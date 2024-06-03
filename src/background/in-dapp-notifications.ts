import browser from 'webextension-polyfill';
import { networksStore } from 'src/modules/networks/networks-store.background';
import type { ChainId } from 'src/modules/ethereum/transactions/ChainId';
import type { Chain } from 'src/modules/networks/Chain';
import type { InDappNotification } from 'src/shared/types/InDappNotification';
import { emitter } from './events';

declare global {
  interface Window {
    showNotification(notification: InDappNotification): void;
  }
}

async function getActiveTabIdWithOrigin(origin: string) {
  // In dev environment the tab we're looking for doesn't have to be active or in the current window.
  // Otherwise it would be hard to debug the chainSwitchError case
  const query =
    process.env.NODE_ENV === 'production'
      ? { currentWindow: true, active: true }
      : {};
  const tabs = await browser.tabs.query(query);
  const tab = tabs.find((tab) => tab.url && new URL(tab.url).origin === origin);
  return tab?.id;
}

// We can't directly pass the window.showNotification to the chrome.scripting.executeScript,
// so we have to create a separate wrapper function. More info: https://developer.chrome.com/docs/extensions/reference/api/scripting#type-ScriptInjection
function showNotification(notification: InDappNotification) {
  window.showNotification(notification);
}

const SCRIPT_PATH = 'content-script/in-dapp-notification/index.js';
const STYLES_PATH = 'content-script/in-dapp-notification/index.css';

async function insertNotificationScripts(tabId: number) {
  await chrome.scripting.insertCSS({ target: { tabId }, files: [STYLES_PATH] });
  await chrome.scripting.executeScript({
    target: { tabId },
    files: [SCRIPT_PATH],
  });
}

async function notify(tabId: number, notification: InDappNotification) {
  await insertNotificationScripts(tabId);
  await chrome.scripting.executeScript({
    target: { tabId },
    func: showNotification,
    args: [notification],
  });
}

async function handleChainChanged(chain: Chain, origin: string) {
  const tabId = await getActiveTabIdWithOrigin(origin);
  if (!tabId) {
    return;
  }
  const networks = await networksStore.load([chain.toString()]);
  const network = networks.getNetworkByName(chain);
  if (!network) {
    return;
  }

  await notify(tabId, {
    event: 'chainChanged',
    networkName: network.name,
    networkIcon: network.icon_url,
  });
}

async function handleSwitchChainError(chainId: ChainId, origin: string) {
  const tabId = await getActiveTabIdWithOrigin(origin);
  if (!tabId) {
    return;
  }
  await notify(tabId, {
    event: 'switchChainError',
    chainId: chainId.toString(),
  });
}

export function initialize() {
  emitter.on('chainChanged', handleChainChanged);
  emitter.on('switchChainError', handleSwitchChainError);
}
