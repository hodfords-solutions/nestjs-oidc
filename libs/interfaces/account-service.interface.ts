export interface IAccountService {
    findAccount(ctx: any, id: string): Promise<any>;
    authenticate(username: string, password: string): Promise<any>;
}
