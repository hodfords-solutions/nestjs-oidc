export interface IAccountService {
    findAccount(ctx: any, id: string): Promise<any>;
}
