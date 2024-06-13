import { client } from 'defi-sdk';
import { chainConfigStore } from '../ethereum/chains/ChainConfigStore';
import { configureBackgroundTestClient } from '../defi-sdk/background';
import { NetworksStore } from './networks-store';

export const networksStore = new NetworksStore(
  { networks: null },
  {
    getEthereumChainConfigs: async () => {
      await chainConfigStore.ready();
      return chainConfigStore.getState().ethereumChainConfigs;
    },
    client,
    testnetMode: false,
  }
);

export const testenvNetworksStore = new NetworksStore(
  { networks: null },
  {
    getEthereumChainConfigs: async () => {
      await chainConfigStore.ready();
      return chainConfigStore.getState().ethereumChainConfigs;
    },
    client: configureBackgroundTestClient(),
    testnetMode: true,
  }
);

chainConfigStore.on('change', () => {
  networksStore.update();
  testenvNetworksStore.update();
});
