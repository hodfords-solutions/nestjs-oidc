import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { OIDC_CONFIGURATION } from '../constants/injector.constant';
import { nanoid } from 'nanoid';
import Provider from 'oidc-provider';

@Injectable()
export class OidcService implements OnApplicationBootstrap {
    private configuration: Record<string, any>;
    private provider: Provider;

    constructor(private moduleRef: ModuleRef) {
        console.log('-----------');
        this.configuration = this.moduleRef.get(OIDC_CONFIGURATION, { strict: false });
    }

    get providerInstance(): Provider {
        return this.provider;
    }

    onApplicationBootstrap() {
        this.provider = new Provider(this.configuration.issuer, this.configuration);

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

    private async passwordGrant(ctx: any, next: any) {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { AccessToken, Session, Grant, IdToken } = ctx.oidc.provider;

        const sessionId = nanoid(10);
        const loginTs = Math.floor(Date.now() / 1000);
        const accountId = nanoid();
        const account = await ctx.oidc.provider.Account.findAccount(ctx, accountId);

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
                sid: nanoid(),
                grantId
            }
        };
        await session.save(3600);
        const at = new AccessToken({
            accountId,
            client: ctx.oidc.client,
            expiresWithSession: '123',
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
            expires_in: 3600,
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
