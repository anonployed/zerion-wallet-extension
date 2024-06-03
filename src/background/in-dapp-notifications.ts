import browser from 'webextension-polyfill';
import { networksStore } from 'src/modules/networks/networks-store.background';
import type { ChainId } from 'src/modules/ethereum/transactions/ChainId';
import type { Chain } from 'src/modules/networks/Chain';
import { emitter } from './events';

interface Notification {
  title: string;
  message: string;
  icon: string;
  compact: boolean;
}

declare global {
  interface Window {
    createNotification(notification: Notification): void;
  }
}

async function getTabWithOrigin(origin: string) {
  // The tab we're looking for doesn't have to be active or in the current window
  const tabs = await browser.tabs.query({});
  const tab = tabs.find((tab) => tab.url && new URL(tab.url).origin === origin);
  return tab?.id;
}

// We can't directly pass the window.createNotification to the chrome.scripting.executeScript,
// so we have to create a separate wrapper function. More info: https://developer.chrome.com/docs/extensions/reference/api/scripting#type-ScriptInjection
function showNotification(notification: Notification) {
  window.createNotification(notification);
}

const SCRIPT_PATH = 'content-script/in-dapp-notification/index.js';
const STYLES_PATH = 'content-script/in-dapp-notification/index.css';
const LOGO_ICON_PATH = 'content-script/in-dapp-notification/zerion-logo.svg';

async function insertNotificationScripts(tabId: number) {
  await chrome.scripting.insertCSS({ target: { tabId }, files: [STYLES_PATH] });
  await chrome.scripting.executeScript({
    target: { tabId },
    files: [SCRIPT_PATH],
  });
}

async function removeNotificationScripts(tabId: number) {
  try {
    await chrome.scripting.removeCSS({
      target: { tabId },
      files: [STYLES_PATH],
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Failed to remove CSS for in-dapp notifications:', error);
  }
}

async function notify(tabId: number, notification: Notification) {
  await insertNotificationScripts(tabId);
  await chrome.scripting.executeScript({
    target: { tabId },
    func: showNotification,
    args: [notification],
  });
  setTimeout(() => removeNotificationScripts(tabId), 3000);
}

async function handleChainChanged(chain: Chain, origin: string) {
  const tabId = await getTabWithOrigin(origin);
  if (!tabId) {
    return;
  }
  const networks = await networksStore.load([chain.toString()]);
  const network = networks.getNetworkByName(chain);
  if (!network) {
    return;
  }

  await notify(tabId, {
    title: 'Network Switched',
    message: network.name,
    icon: network.icon_url,
    compact: true,
  });
}

async function handleSwitchChainError(chainId: ChainId, origin: string) {
  const tabId = await getTabWithOrigin(origin);
  if (!tabId) {
    return;
  }
  await notify(tabId, {
    title: `Unrecognized Network`,
    message: `Unable to switch network to the Chain Id: <b>${chainId.toString()}</b>.
Please check your network settings and try again.`,
    icon: LOGO_ICON_PATH,
    compact: false,
  });
}

export function initialize() {
  emitter.on('chainChanged', handleChainChanged);
  emitter.on('switchChainError', handleSwitchChainError);
}
