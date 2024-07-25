import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { OIDC_ACCOUNT_SERVICE } from '../constants/injector.constant';
import { IAccountService } from '../interfaces/account-service.interface';
import { OidcService } from './oidc.service';

@Injectable()
export class OidcAuthService {
    constructor(
        private oidcService: OidcService,
        @Inject(OIDC_ACCOUNT_SERVICE) private oidcAccountService: IAccountService
    ) {}

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

        const loginResult = {
            login: {
                accountId: account.accountId
            }
        };

        const redirectTo = await provider.interactionResult(req, res, loginResult, { mergeWithLastSubmission: true });

        return redirectTo;
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

        const redirectTo = await provider.interactionResult(req, res, consentResult, { mergeWithLastSubmission: true });

        return redirectTo;
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
