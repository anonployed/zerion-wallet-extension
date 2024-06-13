import { useQuery } from '@tanstack/react-query';
import { getNetworksStore } from 'src/modules/networks/networks-store.client';
import type { Chain } from 'src/modules/networks/Chain';
import { fetchNativeEvmPosition } from './fetchNativeEvmPosition';

export function useEvmNativeAddressPosition({
  address,
  chain,
  enabled = true,
}: {
  address: string | null;
  chain: Chain;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['eth_getBalance/nativeAddressEvmPosition', address, chain],
    queryFn: async () => {
      const networksStore = await getNetworksStore();
      const networks = await networksStore.load({ chains: [chain.toString()] });
      const chainId = networks.getChainId(chain);
      return !address || !chainId
        ? null
        : fetchNativeEvmPosition({
            address,
            chainId,
            networks,
          });
    },
    enabled: enabled && Boolean(address),
  });
}
