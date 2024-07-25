import { AccountClaimsType } from '../types/account.type';

export interface IAccount {
    accountId: string;

    claims(): Promise<AccountClaimsType>;
}
