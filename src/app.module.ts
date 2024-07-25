import { IAccountService, OidcModule } from '@mint/nestjs-oidc';
import { Injectable, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { randomUUID } from 'crypto';

@Injectable()
class AccountService implements IAccountService {
    findAccount(_ctx: any, id: string): Promise<any> {
        return Promise.resolve({
            accountId: id,
            async claims() {
                return {
                    sub: 'admin-123',
                    email: 'minh_1@gmail.com',
                    name: 'John Doe (Mint)',
                    nickname: 'john.doe (mint)',
                    picture: 'https://myawesomeavatar.com/avatar.png',
                    updated_at: '2017-03-30T15:13:40.474Z',
                    email_verified: false,
                    iss: 'http://localhost:3000',
                    aud: '{yourClientId}',
                    exp: 1490922820,
                    iat: 1490886820,
                    nonce: 'crypto-value',
                    at_hash: 'IoS3ZGppJKUn3Bta_LgE21'
                };
            }
        });
    }

    authenticate(): Promise<any> {
        return Promise.resolve({
            accountId: randomUUID(),
            async claims() {
                return {
                    sub: randomUUID(),
                    email: 'minh@gmail.com'
                };
            }
        });
    }
}

const configuration = {
    issuer: 'http://localhost:3000',
    claims: {
        email: ['email', 'email_verified'],
        profile: ['name']
    },
    ttl: {
        AccessToken: 60 * 60, // 1 hour
        AuthorizationCode: 60 * 10, // 10 minutes
        IdToken: 60 * 60, // 1 hour
        RefreshToken: 60 * 60 * 24 * 14, // 14 days,
        Interaction: 60 * 60, // 1 hour
        Session: 60 * 60 * 24 * 14 // 14 days
    },
    cookies: {
        keys: ['foo']
    },
    clients: [
        {
            client_id: 'foo',
            client_secret: 'bar',
            redirect_uris: [
                'https://499a-2402-800-629c-eb7f-440f-c018-5084-c02.ngrok-free.app/test',
                'https://oidcdebugger.com/debug',
                'https://880d-117-3-71-111.ngrok-free.app/cb',
                'https://8b3d-2a09-bac5-d5ca-15f-00-23-2e0.ngrok-free.app/auth/oidc.callback'
            ],
            response_types: ['code id_token', 'code'],
            grant_types: ['authorization_code', 'implicit', 'password']
        }
    ],
    features: {
        revocation: {
            enabled: true
        },
        devInteractions: {
            enabled: false
        },
        jwtUserinfo: { enabled: true },
        userinfo: { enabled: true }
    },
    pkce: {
        required: () => false
    }
};

@Module({
    imports: [OidcModule.forRoot(configuration, AccountService, 'localhost:6379')],
    providers: [],
    controllers: [AppController]
})
export class AppModule {}
