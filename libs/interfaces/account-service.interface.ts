import { IAccount } from './account.interface';

export interface IAccountService {
    findAccount(ctx: any, id: string): Promise<IAccount>;
    authenticate(username: string, password: string): Promise<IAccount>;
}
