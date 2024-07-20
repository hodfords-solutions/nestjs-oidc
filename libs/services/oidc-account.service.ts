import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import bcrypt from 'bcrypt';
import { IAccount } from '../interfaces/account.interface';
import { OIDC_ACCOUNT_MODEL } from '../constants/injector.constant';

@Injectable()
export class OidcAccountService {
    private readonly account: IAccount;

    constructor(private moduleRef: ModuleRef) {
        this.account = this.moduleRef.get(OIDC_ACCOUNT_MODEL, { strict: false });
    }

    async authenticate(email: string, password: string) {
        const account = await this.account.findByEmail(email);
        if (!account) {
            // TODO: throw error
            return null;
        }

        const isCorrectPwd = await bcrypt.compare(password, account.password);
        if (!isCorrectPwd) {
            // TODO: throw error
            return null;
        }

        return account;
    }
}
