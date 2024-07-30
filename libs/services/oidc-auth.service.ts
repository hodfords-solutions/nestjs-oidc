import { BadRequestException, Injectable, OnApplicationBootstrap } from '@nestjs/common';
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
        const provider = this.oidcService.providerInstance;
        const interactionDetails = await provider.interactionDetails(req, res);
        const {
            prompt: { name }
        } = interactionDetails;
        if (name !== 'login') {
            throw new BadRequestException('expected a login prompt');
        }

        const { username, password } = req.body;
        const account = await this.oidcAccountService.authenticate(username, password);

        return this.authenticateForConsent(account.accountId, req, res);
    }

    async confirmConsent(req: Request, res: Response): Promise<string> {
        const provider = this.oidcService.providerInstance;
        const interactionDetails = await provider.interactionDetails(req, res);
        const {
            prompt: { name }
        } = interactionDetails;
        if (name !== 'consent') {
            throw new BadRequestException('expected a consent prompt');
        }

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
            error_description: 'End-User aborted interaction'
        };

        return provider.interactionResult(req, res, errorResult, { mergeWithLastSubmission: false });
    }

    private async createGrant(provider: any, accountId: string, details: any) {
        const { params } = details;
        const grant = await this.findOrCreateGrant(provider, accountId, params.client_id, details);

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

    async getCurrentPrompt(req: Request, res: Response): Promise<OidcPromptEnums> {
        const provider = this.oidcService.providerInstance;
        const interactionDetails = await provider.interactionDetails(req, res);
        const {
            prompt: { name }
        } = interactionDetails;

        return name as OidcPromptEnums;
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
