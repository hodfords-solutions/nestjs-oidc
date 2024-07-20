import { IAccountService, OidcModule } from '@mint/nestjs-oidc';
import { Injectable, Module } from '@nestjs/common';
import { AppController } from './app.controller';

@Injectable()
class AccountService implements IAccountService {
    findAccount(ctx: any, id: string): Promise<any> {
        return Promise.resolve({
            accountId: id,
            async claims() {
                return {
                    sub: id,
                    email: 'minh@gmail.com'
                };
            }
        });
    }
}

@Module({
    imports: [
        OidcModule.forRoot(
            {
                issuer: 'http://localhost:3000',
                claims: {
                    email: ['email', 'email_verified'],
                    profile: ['name']
                },
                clients: [
                    {
                        client_id: 'foo',
                        client_secret: 'bar',
                        redirect_uris: [
                            'https://oidcdebugger.com/debug',
                            'https://880d-117-3-71-111.ngrok-free.app/cb'
                        ],
                        response_types: ['code id_token', 'code'],
                        grant_types: ['authorization_code', 'implicit', 'password']
                    }
                ],
                features: {
                    revocation: {
                        enabled: true
                    },
                    jwtUserinfo: { enabled: true },
                    userinfo: { enabled: true }
                },
                pkce: {
                    required: () => false
                }
            },
            new AccountService()
        )
    ],
    providers: [],
    controllers: [AppController]
})
export class AppModule {}
