// The treasury is the counterparty for opening deposits. It is not a real account,
// but using it keeps the ledger balanced: every cent in any account has a ledger entry.
const TREASURY_ACCOUNT_NUMBER = '000000000000';
const TREASURY_NAME = 'IronVault Treasury';

const ACCOUNT_NUMBER_REGEX = /^\d{12}$/;
const MAX_TRANSFER_AMOUNT_CENTS = 999999999;

module.exports = {
  TREASURY_ACCOUNT_NUMBER,
  TREASURY_NAME,
  ACCOUNT_NUMBER_REGEX,
  MAX_TRANSFER_AMOUNT_CENTS,
};
