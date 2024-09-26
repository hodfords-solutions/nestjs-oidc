/* eslint-disable @typescript-eslint/naming-convention */
import { IAccountService, OIDC_ACCOUNT_SERVICE, OidcModule } from '@mint/nestjs-oidc';
import { Injectable, Module } from '@nestjs/common';
import { AppController } from './app.controller';

@Injectable()
class UserService {}

@Injectable()
class AccountService implements IAccountService {
    constructor(private userService: UserService) {}

    findAccount(ctx: any, id: string): Promise<any> {
        return Promise.resolve({
            accountId: id,
            async claims() {
                return {
                    sub: '84b779c9-08d7-424e-9484-529582b99288',
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
            accountId: '84b779c9-08d7-424e-9484-529582b99288',
            async claims() {
                return {
                    sub: '84b779c9-08d7-424e-9484-529582b99288',
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
    clients: [
        {
            client_id: 'foo',
            client_secret: 'bar',
            post_logout_redirect_uris: ['https://google.com'],
            redirect_uris: [
                'https://499a-2402-800-629c-eb7f-440f-c018-5084-c02.ngrok-free.app/test',
                'https://oidcdebugger.com/debug',
                'https://880d-117-3-71-111.ngrok-free.app/cb',
                'https://8b3d-2a09-bac5-d5ca-15f-00-23-2e0.ngrok-free.app/auth/oidc.callback'
            ],
            response_types: ['code id_token', 'code'],
            grant_types: ['authorization_code', 'implicit']
        }
    ],
    cookies: {
        keys: ['interaction', 'session', 'state'],
        long: {
            signed: true,
            httpOnly: true,
            secure: false,
            sameSite: 'none',
            path: '/'
            // domain: env.OIDC_PROVIDER.SUB_DOMAIN
        },
        short: {
            signed: true,
            httpOnly: true,
            secure: false,
            sameSite: 'none',
            path: '/'
            // domain: env.OIDC_PROVIDER.SUB_DOMAIN
        },
        names: {
            session: '_session',
            interaction: '_interaction',
            resume: '_resume',
            state: '_state'
        }
    }
};

@Injectable()
class ConfigService {
    getConfig() {
        return configuration;
    }
}

@Module({
    providers: [ConfigService],
    exports: [ConfigService]
})
class ConfigModule {}

@Module({
    imports: [
        ConfigModule,
        OidcModule.forRootAsync({
            redisHost: 'localhost',
            customInteractionUrl: 'http://localhost:3001/interaction/{uid}',
            configuration: {
                useFactory: (configService: ConfigService) => configService.getConfig(),
                inject: [ConfigService],
                imports: [ConfigModule]
            }
        })
    ],
    providers: [
        UserService,
        {
            provide: OIDC_ACCOUNT_SERVICE,
            useClass: AccountService
        }
    ],
    controllers: [AppController]
})
export class AppModule {}
