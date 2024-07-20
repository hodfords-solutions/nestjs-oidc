import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { randomUUID } from 'crypto';
import { IAccountService } from 'libs/interfaces/account-service.interface';
import { OIDC_ACCOUNT_SERVICE, OIDC_CONFIGURATION } from '../constants/injector.constant';

@Injectable()
export class OidcService implements OnApplicationBootstrap {
    private configuration: Record<string, any>;
    private provider: any;

    constructor(
        private moduleRef: ModuleRef,
        @Inject(OIDC_ACCOUNT_SERVICE) private oidcAccountService: IAccountService
    ) {
        this.configuration = this.moduleRef.get(OIDC_CONFIGURATION, { strict: false });
    }

    get providerInstance(): any {
        return this.provider;
    }

    async onApplicationBootstrap() {
        await this.initProvider();

        const parameters = [
            'audience',
            'resource',
            'scope',
            'requested_token_type',
            'subject_token',
            'subject_token_type',
            'actor_token',
            'actor_token_type'
        ];
        const allowedDuplicateParameters = ['audience', 'resource'];
        const grantType = 'password';
        this.provider.registerGrantType(
            grantType,
            this.passwordGrant.bind(this),
            parameters,
            allowedDuplicateParameters
        );
    }

    private async initProvider() {
        const oidcProvider = await (eval(`import('oidc-provider')`) as Promise<typeof import('oidc-provider')>);
        const Provider = oidcProvider.default;

        this.configuration.findAccount = this.oidcAccountService.findAccount.bind(this.oidcAccountService);

        this.provider = new Provider(this.configuration.issuer, this.configuration);
    }

    private async passwordGrant(ctx: any, next: any) {
        const { AccessToken, Session, Grant, IdToken } = ctx.oidc.provider;

        const sessionId = randomUUID();
        const loginTs = Math.floor(Date.now() / 1000);
        const accountId = randomUUID();
        const { username, password } = ctx.oidc.body;

        const account = await this.oidcAccountService.authenticate(username, password);

        ctx.oidc.entity('Account', account);

        const session = new Session({ jti: sessionId, loginTs, accountId });
        const grant = new Grant({
            clientId: 'foo',
            accountId
        });

        const scope = new Set((ctx.oidc.params.scope || ctx.oidc.client.defaultScopes).split(' '));

        for (const s of scope) {
            grant.addOIDCScope(s);
        }

        const grantId = await grant.save();
        session.authorizations = {
            foo: {
                sid: randomUUID(),
                grantId
            }
        };
        await session.save(3600);
        const at = new AccessToken({
            accountId,
            client: ctx.oidc.client,
            expiresWithSession: true,
            grantId,
            sessionUid: session.uid
        });

        at.scope = grant.getOIDCScopeFiltered(scope);
        ctx.oidc.entity('AccessToken', at);

        const accessToken = await at.save();

        const token = new IdToken(
            {
                ...(await account.claims('id_token', accountId)),
                acr: '0',
                amr: ['pwd'],
                auth_time: loginTs,
                sub: accountId
            },
            { ctx }
        );

        token.set('at_hash', accessToken);
        const idToken = await token.issue({ use: 'idtoken' });

        ctx.body = {
            access_token: accessToken,
            expires_in: at.expiration,
            id_token: idToken,
            refresh_token: 'refresh_token',
            scope: 'openid email',
            token_type: 'Bearer',
            authorization_details: {
                grant_type: 'password'
            }
        };

        await next();
    }
}
