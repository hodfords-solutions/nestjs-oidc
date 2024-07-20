export interface IAccount {
    email: string;

    [key: string]: any;

    get accountId(): string;

    findByEmail(email: string): Promise<IAccount>;

    claims(): any;
}
