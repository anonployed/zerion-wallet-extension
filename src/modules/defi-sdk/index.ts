import memoizeOne from 'memoize-one';
import { client, Client } from 'defi-sdk';
import {
  DEFI_SDK_API_URL,
  DEFI_SDK_API_TOKEN,
  BACKEND_ENV,
} from 'src/env/config';
import { invariant } from 'src/shared/invariant';
import { version } from 'src/shared/packageVersion';
import { platform } from 'src/shared/analytics/platform';
import { BackgroundMemoryCache } from './BackgroundMemoryCache';
import { hooks } from './defi-sdk-config';

export const backgroundCache = new BackgroundMemoryCache();

export async function configureUIClient() {
  // This client instance uses background script's memory as cache
  return backgroundCache.load().then(() => {
    if (!DEFI_SDK_API_URL || !DEFI_SDK_API_TOKEN) {
      throw new Error(
        'DEFI_SDK_API_URL and DEFI_SDK_API_TOKEN must be defined in ENV'
      );
    }
    client.configure({
      getCacheKey: ({ key }) => key,
      cache: backgroundCache,
      url: DEFI_SDK_API_URL,
      apiToken: DEFI_SDK_API_TOKEN,
      hooks,
      ioOptions: {
        query: Object.assign(
          { platform, platform_version: version },
          BACKEND_ENV ? { backend_env: BACKEND_ENV } : undefined
        ),
      },
    });
  });
}

export const configureUITestClient = memoizeOne(() => {
  invariant(DEFI_SDK_API_URL, 'DEFI_SDK_API_URL not defined');
  invariant(DEFI_SDK_API_TOKEN, 'DEFI_SDK_API_TOKEN not defined');
  const client = new Client({
    url: 'wss://api-testnet.zerion.io', // TODO: move to src/env/config?
    apiToken: DEFI_SDK_API_TOKEN,
    hooks,
    ioOptions: {
      query: Object.assign(
        { platform, platform_version: version },
        BACKEND_ENV ? { backend_env: BACKEND_ENV } : undefined
      ),
    },
  });
  return client;
});
