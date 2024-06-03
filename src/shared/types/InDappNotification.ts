export type InDappNotification =
  | {
      event: 'chainChanged';
      networkName: string;
      networkIcon: string;
    }
  | {
      event: 'switchChainError';
      chainId: string;
    };
