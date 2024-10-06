import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Request, Response } from 'express';
import { OIDC_ACCOUNT_SERVICE } from '../constants/injector.constant';
import { IAccountService } from '../interfaces/account-service.interface';
import { OidcService } from './oidc.service';
import { OidcPromptEnums } from '../enums/odic.constant';

@Injectable()
export class OidcAuthService implements OnApplicationBootstrap {
    private oidcAccountService: IAccountService;

    constructor(
        private oidcService: OidcService,
        private moduleRef: ModuleRef
    ) {}

    onApplicationBootstrap() {
        this.oidcAccountService = this.moduleRef.get<IAccountService>(OIDC_ACCOUNT_SERVICE, { strict: false });
    }

    async signIn(req: Request, res: Response): Promise<string> {
        const { username, password } = req.body;
        const account = await this.oidcAccountService.authenticate(req, res, {
            username,
            password
        });

        return this.authenticateForConsent(account.accountId, req, res);
    }

    async confirmConsent(req: Request, res: Response): Promise<string> {
        const provider = this.oidcService.providerInstance;
        const interactionDetails = await provider.interactionDetails(req, res);

        const accountId = interactionDetails.session.accountId;
        const grantId = await this.createGrant(provider, accountId, interactionDetails);

        const consentResult = {
            consent: {
                grantId
            }
        };

        return provider.interactionResult(req, res, consentResult, { mergeWithLastSubmission: true });
    }

    async abortConsent(req: Request, res: Response): Promise<string> {
        const provider = this.oidcService.providerInstance;
        const errorResult = {
            error: 'access_denied',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            error_description: 'End-User aborted interaction'
        };

        return provider.interactionResult(req, res, errorResult, { mergeWithLastSubmission: false });
    }

    private async createGrant(provider: any, accountId: string, interactionDetails: any) {
        const {
            params,
            prompt: { details }
        } = interactionDetails;
        const grant = await this.findOrCreateGrant(provider, accountId, params.client_id, interactionDetails);

        grant.addOIDCScope('openid');

        if (details.missingOIDCScope) {
            grant.addOIDCScope(details.missingOIDCScope.join(' '));
        }
        if (details.missingOIDCClaims) {
            grant.addOIDCClaims(details.missingOIDCClaims);
        }
        if (details.missingResourceScopes) {
            for (const [indicator, scopes] of Object.entries(details.missingResourceScopes)) {
                grant.addResourceScope(indicator, (scopes as any).join(' '));
            }
        }

        return await grant.save();
    }

    async authenticateForConsent(accountId: string, req: Request, res: Response): Promise<string> {
        const provider = this.oidcService.providerInstance;
        const loginResult = {
            login: {
                accountId
            }
        };

        return provider.interactionResult(req, res, loginResult, { mergeWithLastSubmission: true });
    }

    async currentUser(req: Request, res: Response): Promise<string> {
        const provider = this.oidcService.providerInstance;
        const interactionDetails = await provider.interactionDetails(req, res);

        return interactionDetails.result?.login?.accountId;
    }

    async signOut(req: Request, res: Response): Promise<void> {
        const provider = this.oidcService.providerInstance;
        const ctx = this.oidcService.createContext(req, res);

        const session = await provider.Session.get(ctx);

        await this.backchannelSignOut(session);
        await this.revokeTokens(ctx, session);

        await session.destroy();

        this.oidcService.emitEndSessionSuccess(ctx);
    }

    async getCurrentPrompt(req: Request, res: Response): Promise<OidcPromptEnums> {
        const provider = this.oidcService.providerInstance;
        const interactionDetails = await provider.interactionDetails(req, res);
        const {
            prompt: { name }
        } = interactionDetails;

        return name as OidcPromptEnums;
    }

    async getCurrentClientId(req: Request, res: Response): Promise<string> {
        const provider = this.oidcService.providerInstance;
        const interactionDetails = await provider.interactionDetails(req, res);

        return interactionDetails.params?.client_id;
    }

    private async revokeTokens(ctx: any, session: any) {
        if (!session.authorizations) {
            return;
        }

        await Promise.all(
            Object.entries(session.authorizations).map(async ([clientId, { grantId }]: any) => {
                if (grantId && !session.authorizationFor(clientId).persistsLogout) {
                    const client = await this.oidcService.providerInstance.Client.find(clientId);
                    ctx.oidc.entity('Client', client);

                    await this.oidcService.revokeFunction(ctx, grantId);
                }
            })
        );

        await session.destroy();
    }

    private async backchannelSignOut(session: any) {
        const clientIds = Object.keys(session.authorizations || {});

        const back = [];
        for (const clientId of clientIds) {
            const client = await this.oidcService.providerInstance.Client.find(clientId);
            if (!client) {
                continue;
            }

            const { accountId } = session;
            const sid = session.sidFor(client.clientId);
            back.push(
                client.backchannelLogout(accountId, sid).then(
                    () => {
                        this.oidcService.providerInstance.emit('backchannel.success', client, accountId, sid);
                    },
                    (err: Error) => {
                        this.oidcService.providerInstance.emit('backchannel.error', err, client, accountId, sid);
                    }
                )
            );
        }

        await Promise.all(back);
    }

    private async findOrCreateGrant(provider: any, accountId: string, clientId: string, details: any) {
        const { grantId } = details;
        let grant: any;
        if (grantId) {
            grant = await provider.Grant.find(grantId);
        } else {
            grant = new provider.Grant({
                accountId,
                clientId
            });
        }

        return grant;
    }
}
