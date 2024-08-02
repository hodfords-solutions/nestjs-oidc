import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { RedisAdapter } from '../adapters/redis.adapter';
import { IAccountService } from '../interfaces/account-service.interface';
import {
    OIDC_ACCOUNT_SERVICE,
    OIDC_ADAPTER_REDIS_HOST,
    OIDC_CONFIGURATION,
    OIDC_CUSTOM_INTERACTION_URL
} from '../constants/injector.constant';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class OidcService implements OnApplicationBootstrap {
    private provider: any;
    private oidcAccountService: IAccountService;

    constructor(
        @Inject(OIDC_CONFIGURATION) private configuration: Record<string, any>,
        @Inject(OIDC_ADAPTER_REDIS_HOST) private redisHost: string,
        @Inject(OIDC_CUSTOM_INTERACTION_URL)
        private customInteractionUrl: (uid: string) => string | string,
        private moduleRef: ModuleRef
    ) {}

    get providerInstance(): any {
        return this.provider;
    }

    async onApplicationBootstrap() {
        this.oidcAccountService = this.moduleRef.get<IAccountService>(OIDC_ACCOUNT_SERVICE, { strict: false });
        if (!this.oidcAccountService) {
            throw new Error(`
                OIDC_ACCOUNT_SERVICE not found.
                Please provide a service that implements IAccountService interface.
                And inject by
                {
                    provide: OIDC_ACCOUNT_SERVICE,
                    useClass: YourAccountService
                }
            `);
        }

        await this.initProvider();
    }

    private async initProvider() {
        const oidcProvider = await (eval(`import('oidc-provider')`) as Promise<typeof import('oidc-provider')>);
        const Provider = oidcProvider.default;
        const policy = oidcProvider.interactionPolicy;

        this.configuration.findAccount = this.oidcAccountService.findAccount.bind(this.oidcAccountService);
        this.provider = new Provider(this.configuration.issuer, {
            interactions: this.interactionConfig(policy),
            adapter: (name: string) => {
                return new RedisAdapter(name, this.redisHost);
            },
            cookies: {
                keys: ['interaction', 'session', 'state'],
                long: {
                    signed: true,
                    httpOnly: true,
                    path: '/',
                    secure: true,
                    sameSite: 'none'
                },
                short: {
                    signed: true,
                    httpOnly: true,
                    secure: true,
                    path: '/',
                    sameSite: 'none'
                },
                names: {
                    session: '_session',
                    interaction: '_interaction',
                    resume: '_resume',
                    state: '_state'
                }
            },
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
            },
            ...this.configuration
        });

        this.provider.proxy = true;
    }

    private interactionConfig(policy: any) {
        const interactions = policy.base();
        const customInteractionUrl = this.customInteractionUrl;

        return {
            policy: interactions,
            url(_ctx: any, interaction: any) {
                if (typeof customInteractionUrl === 'string') {
                    return `${customInteractionUrl}?uid=${interaction.uid}`;
                }
                return customInteractionUrl(interaction.uid);
            }
        };
    }
}
