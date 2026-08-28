import { AccountClaimsType } from '../types/account.type.js';

export interface IAccount {
    accountId: string;

    claims(): Promise<AccountClaimsType>;
}
