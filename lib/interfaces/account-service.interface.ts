import { IAccount } from './account.interface.js';
import type { Request, Response } from 'express';

export interface IAccountService {
    findAccount(ctx: any, id: string): Promise<IAccount>;
    authenticate(req: Request, res: Response, payload: { username: string; password: string }): Promise<IAccount>;
}
