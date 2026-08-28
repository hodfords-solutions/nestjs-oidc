/* eslint-disable max-lines-per-function */
import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { RedisAdapter } from '../adapters/redis.adapter.js';
import { IAccountService } from '../interfaces/account-service.interface.js';
import {
    OIDC_ACCOUNT_SERVICE,
    OIDC_ADAPTER_REDIS_HOST,
    OIDC_CONFIGURATION,
    OIDC_CUSTOM_INTERACTION_URL,
    OIDC_MOUNT_PATH
} from '../constants/injector.constant.js';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class OidcService implements OnApplicationBootstrap {
    private provider: any;
    private oidcAccountService: IAccountService;
    private revokeFnc: (ctx: any, grantId: string) => Promise<void>;

    constructor(
        @Inject(OIDC_CONFIGURATION) private configuration: Record<string, any>,
        @Inject(OIDC_MOUNT_PATH) private mountPath: string,
        @Inject(OIDC_ADAPTER_REDIS_HOST) private redisHost: string,
        @Inject(OIDC_CUSTOM_INTERACTION_URL)
        private customInteractionUrl: (uid: string) => string | string,
        private moduleRef: ModuleRef
    ) {}

    get providerInstance(): any {
        return this.provider;
    }

    get revokeFunction(): (ctx: any, grantId: string) => Promise<void> {
        return this.revokeFnc;
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
        const oidcProvider = await import('oidc-provider');
        const policy = oidcProvider.interactionPolicy;

        this.configuration.findAccount = this.oidcAccountService.findAccount.bind(this.oidcAccountService);
        this.provider = new oidcProvider.default(this.configuration.issuer, {
            interactions: this.interactionConfig(policy),
            adapter: (name: string) => {
                return new RedisAdapter(name, this.redisHost);
            },
            cookies: {
                keys: ['interaction', 'session', 'state'],
                long: {
                    signed: true,
                    httpOnly: false,
                    path: '/',
                    secure: true,
                    sameSite: 'none'
                },
                short: {
                    signed: true,
                    httpOnly: false,
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
                revocation: { enabled: true },
                devInteractions: { enabled: false },
                jwtUserinfo: { enabled: true },
                userinfo: { enabled: true }
            },
            pkce: {
                required: () => false
            },
            ...this.configuration,
            clients: [] // NOTE: This will be populated later by addClients()
        });

        this.provider.proxy = true;

        const mountPath = this.mountPath || '/user-services/oidc';
        this.setupUrlForOverride(mountPath);
        await this.addClients();
        await this.loadRevokeFnc();
    }

    private setupUrlForOverride(mountPath: string) {
        const originalUrlFor = this.provider.OIDCContext.prototype.urlFor;
        this.provider.OIDCContext.prototype.urlFor = function (name: string, opt: any) {
            return originalUrlFor.call(this, name, { mountPath, ...opt });
        };
    }

    private async addClients() {
        const clients = this.configuration.clients || [];
        if (!Array.isArray(clients) || clients.length === 0) {
            return;
        }
        await this.providerInstance.Client.adapter.removeAllRegisteredClients?.();

        for (const client of clients) {
            try {
                await this.addClient(client);
            } catch (error) {
                console.error(`Failed to add client ${client.client_id}:`, error);
            }
        }
    }

    private async addClient(metadata: any) {
        const provider = this.providerInstance;
        const client = new provider.Client(metadata);
        await provider.Client.adapter.upsert(client.client_id || client.clientId, client.metadata());

        return client;
    }

    private interactionConfig(policy: any) {
        const interactions = policy.base();
        const customInteractionUrl = this.customInteractionUrl;

        return {
            policy: interactions,
            url(ctx: any, interaction: any) {
                if (typeof customInteractionUrl === 'string') {
                    return `${customInteractionUrl}?uid=${interaction.uid}`;
                }
                return customInteractionUrl(interaction.uid);
            }
        };
    }

    private async loadRevokeFnc(): Promise<void> {
        // NOTE: deep import into an untyped subpath - the specifier is kept in a variable so that
        // TypeScript does not try to resolve declaration files that @types/oidc-provider does not ship.
        const revokeModulePath = 'oidc-provider/lib/helpers/revoke.js';
        const revokeFnc = await import(revokeModulePath);

        this.revokeFnc = revokeFnc.default;
    }

    public createContext(req: any, res: any) {
        const provider = this.providerInstance;
        const ctx = provider.app.createContext(req, res);
        ctx.oidc = new provider.OIDCContext(ctx);

        return ctx;
    }

    public emitEndSessionSuccess(ctx: any) {
        ctx.oidc.provider.emit('end_session.success', ctx);
    }

    public async reloadConfiguration(configuration: Record<string, any>) {
        this.configuration = {
            ...this.configuration,
            ...configuration
        };

        await this.initProvider();
    }
}
