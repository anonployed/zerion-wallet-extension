import { Account, AccountPublicRPC } from './account/Account';
import { TransactionService } from './transactions/TransactionService';

let didInitialize = false;

export async function initialize() {
  if (didInitialize) {
    throw new Error('Initialize function should be run only once');
  }
  didInitialize = true;

  // This method is called only when background script runs for the first time
  // This means that either the user is opening the extension for the first time,
  // or that the browser decided to "restart" the background scripts
  // Either way, we either create a user from scratch or find one in storage
  await Account.ensureUserAndWallet();
  const account = new Account();
  const accountPublicRPC = new AccountPublicRPC(account);
  const transactionService = new TransactionService();
  await transactionService.initialize();

  Object.assign(window, {
    account,
    Account,
    accountPublicRPC,
    transactionService,
  });
  return { account, accountPublicRPC, transactionService };
}
