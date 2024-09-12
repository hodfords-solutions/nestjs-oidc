<p align="center">
  <a href="http://opensource.hodfords.uk" target="blank"><img src="https://opensource.hodfords.uk/img/logo.svg" width="320" alt="Hodfords Logo" /></a>
</p>

NestJS-OIDC is easy way to turn our server as oidc provider with minimum configuratiohn

## Installation
This package is using redis as adapter to store authentication session and relevant stuffs, so you need to have install redis first

### Register module
This is setup to register essential configuration for OIDC provider such as (client, ttls, cookies,...). You can get more at [OIDC Provider](https://github.com/panva/node-oidc-provider/tree/main/docs)

```ts
import { OidcModule as NestOidc, OIDC_ACCOUNT_SERVICE } from '@hodfords/nestjs-oidc';

@Module({
    imports: [
        NestOidc.forRootAsync({
            configuration: {
                useFactory: async function () {
                    return {
                        issuer: `${env.BACKEND_URL}/oidc`,
                        claims: {
                            email: ['email', 'email_verified'],
                            profile: ['name'],
                            groups: ['groups']
                        },
                        ttl: {
                            AccessToken: 5 * 60, // 5 minutes
                            AuthorizationCode: 60 * 10, // 10 minutes
                            IdToken: 60 * 60, // 1 hour
                            RefreshToken: 60 * 60 * 24 * 1, // 1 day
                            Interaction: 60 * 60, // 1 hour
                            Session: 60 * 60 * 24 * 14, // 14 days
                            Grant: 5 * 60 // 5 minutes
                        },
                        jwks: {
                            keys: [env.OIDC_PROVIDER.JWKS]
                        },
                        conformIdTokenClaims: false,
                        cookies: {
                            keys: ['interaction', 'session', 'state'],
                            long: {
                                signed: true,
                                httpOnly: true,
                                secure: true, // this should be false at local
                                sameSite: 'none',
                                path: '/',
                                domain: 'localhost'
                            },
                            short: {
                                signed: true,
                                httpOnly: true,
                                secure: true, // this should be false at local
                                sameSite: 'none',
                                path: '/',
                                domain: 'localhost'
                            },
                            names: {
                                session: '_session',
                                interaction: '_interaction',
                                resume: '_resume',
                                state: '_state'
                            }
                        }
                    }
                },
                imports: [],
                inject: []
            },
            redisHost: `redis://${env.REDIS_HOST}:${env.REDIS_PORT}/${env.REDIS_DB}`,
            customInteractionUrl: 'http://localhost:3000'
        }),
    ],
    providers: [
        {
            provide: OIDC_ACCOUNT_SERVICE,
            useClass: OidcService
        },
    ],
})
```

### Define OidcService
Basically this service will be responsible for retrieving account information that will be returned by OIDC  Provider to 3rd party

```ts
import { IAccount } from '@hodfords/nestjs-oidc';
import { AccountClaimsType } from '@hodfords/nestjs-oidc/types/account.type';

@Injectable()
export class OidcService {
    async findAccount(ctx: any, id: string): Promise<IAccount> {
        const account = await this.userService.findById(id);
        return this.getAccountInfo(account);
    }

    private async getAccountInfo(account: UserEntity): Promise<IAccount> {
        return {
            accountId: account.id,
            async claims(): Promise<AccountClaimsType> {
                return snakecaseKeys({
                    sub: account.id,
                    email: account.email,
                    name: account.fullName,
                    emailVerified: true,
                    groups: []
                });
            }
        };
    }
}
```

That is all you need to do to setup OIDC provider with NestJS-OIDC, you can now start your server and access to `http://localhost:3000/oidc/.well-known/openid-configuration` to see the configuration of OIDC provider

## License

NestJS-OIDC is [MIT licensed](LICENSE).
