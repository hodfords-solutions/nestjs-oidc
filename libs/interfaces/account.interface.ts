export interface IAccount {
    email: string;

    [key: string]: any;

    get accountId(): string;

    get claims(): any;

    findByEmail(email: string): Promise<IAccount>;

    findById(id: string): Promise<IAccount>;
}
