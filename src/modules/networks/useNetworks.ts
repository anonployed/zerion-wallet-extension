import { useCallback, useEffect } from 'react';
import { useQuery, hashQueryKey } from '@tanstack/react-query';
import { queryClient } from 'src/ui/shared/requests/queryClient';
import { emitter } from 'src/ui/shared/events';
import {
  mainNetworksStore,
  testenvNetworksStore,
} from 'src/modules/networks/networks-store.client';
import { usePreferences } from 'src/ui/features/preferences';
import { invariant } from 'src/shared/invariant';
import { getNetworksBySearch } from '../ethereum/chains/requests';
import type { ChainId } from '../ethereum/transactions/ChainId';
import { NetworksStore } from './networks-store';

function useNetworksStore() {
  const { preferences } = usePreferences();
  return !preferences
    ? null
    : preferences.testnetMode
    ? testenvNetworksStore
    : mainNetworksStore;
}

export function useNetworks(chains?: string[]) {
  const networksStore = useNetworksStore();
  const { data: networks = null, ...query } = useQuery({
    queryKey: ['loadNetworks', chains, networksStore],
    queryKeyHashFn: (queryKey) => {
      const stringifiable = queryKey.map((x) =>
        x instanceof NetworksStore ? x.client.url : x
      );
      return hashQueryKey(stringifiable);
    },
    queryFn: () => {
      invariant(networksStore, 'Enable query when networks store is ready');
      return networksStore.load(chains ? { chains } : undefined);
    },
    staleTime: 1000 * 60 * 5,
    suspense: false,
    useErrorBoundary: true,
    enabled: Boolean(networksStore),
  });

  useEffect(() => {
    return networksStore?.on('change', ({ networks }) => {
      if (networks) {
        queryClient.setQueryData(['loadNetworks', chains], networks);
      }
    });
  }, [chains, networksStore]);

  return {
    networks,
    ...query,
    loadNetworkByChainId: useCallback(
      (chainId: ChainId) => {
        invariant(
          networksStore,
          'networksStore is not ready until preferences are read'
        );
        return networksStore.loadNetworksByChainId(chainId);
      },
      [networksStore]
    ),
  };
}

export function useSearchNetworks({ query = '' }: { query?: string }) {
  const networksStore = useNetworksStore();
  const { data: queryData, ...queryResult } = useQuery({
    queryKey: ['getNetworksBySearch', query],
    queryFn: () => getNetworksBySearch({ query: query.trim().toLowerCase() }),
    suspense: false,
    keepPreviousData: true,
    onSuccess(results) {
      emitter.emit('networksSearchResponse', query, results.length);
    },
  });
  const { networks } = useNetworks();
  useEffect(() => {
    if (queryData) {
      networksStore?.pushConfigs(...queryData);
    }
  }, [networksStore, queryData]);
  return { networks, ...queryResult };
}
