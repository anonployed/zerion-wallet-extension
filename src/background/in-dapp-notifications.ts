import { getActiveTabOrigin } from 'src/ui/shared/requests/getActiveTabOrigin';
import { networksStore } from 'src/modules/networks/networks-store.background';
import type { ChainId } from 'src/modules/ethereum/transactions/ChainId';
import type { Chain } from 'src/modules/networks/Chain';
import { emitter } from './events';

declare global {
  interface Window {
    createNotification({
      title,
      subtitle,
      iconUrl,
    }: {
      title: string;
      subtitle: string;
      iconUrl?: string;
    }): void;
  }
}

function showNotification({
  title,
  subtitle,
  iconUrl,
}: {
  title: string;
  subtitle: string;
  iconUrl?: string;
}) {
  window.createNotification({ title, subtitle, iconUrl });
}

async function getActiveTabWithOrigin(origin: string) {
  const tabData = await getActiveTabOrigin();
  const tabId = tabData?.tab.id;
  const tabOrigin = tabData?.tabOrigin;

  if (tabId && origin === tabOrigin) {
    return tabId;
  } else {
    return null;
  }
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

async function notify(
  tabId: number,
  args: Parameters<typeof showNotification>
) {
  await insertNotificationScripts(tabId);
  await chrome.scripting.executeScript({
    target: { tabId },
    func: showNotification,
    args,
  });
  setTimeout(() => removeNotificationScripts(tabId), 5000);
}

async function handleChainChanged(chain: Chain, origin: string) {
  const tabId = await getActiveTabWithOrigin(origin);
  if (!tabId) {
    return;
  }
  const networks = await networksStore.load([chain.toString()]);
  const network = networks.getNetworkByName(chain);
  if (!network) {
    return;
  }
  const message = {
    title: 'Network Switched',
    subtitle: network.name,
    iconUrl: network.icon_url,
  };
  await notify(tabId, [message]);
}

async function handleSwitchChainError(chainId: ChainId, origin: string) {
  const tabId = await getActiveTabWithOrigin(origin);
  if (!tabId) {
    return;
  }
  const message = {
    title: `Unrecognized Network`,
    subtitle: `Unable to switch network to the Chain Id: ${chainId.toString()}.
Please check your network settings and try again.`,
    iconUrl: new URL(
      `../images/logo-icon-48-disabled.png`,
      import.meta.url
    ).toString(),
  };
  await notify(tabId, [message]);
}

export function initialize() {
  emitter.on('chainChanged', handleChainChanged);
  emitter.on('switchChainError', handleSwitchChainError);
}
