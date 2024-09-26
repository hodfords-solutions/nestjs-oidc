import { OidcAuthService, OidcService } from '@mint/nestjs-oidc';
import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Response } from 'express';
import { Request } from 'express';

@Controller()
export class AppController {
    constructor(
        private oidcService: OidcService,
        private oidcAuthService: OidcAuthService
    ) {}

    @Get()
    hello(): string {
        return 'Hello World!';
    }

    @Post('signin/:uid')
    async signIn(@Req() req: Request, @Res() res: Response) {
        const provider = this.oidcService.providerInstance;
        const details = await provider.interactionDetails(req, res);
        console.log('details', details);
        const accountId = 'ff0c6866-0796-45cb-a7ca-1f956d2c7e6a';
        const result = {
            login: {
                accountId
            }
        };
        const grantId = await this.createGrant(provider, accountId, details);
        Object.assign(result, { consent: { grantId } });

        const redirectUrl = await provider.interactionResult(req, res, result, { mergeWithLastSubmission: true });

        return res.send({
            redirectUrl
        });
    }

    @Post('oidc-auth/sign-out/:id')
    async signOut(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        await this.oidcAuthService.signOut(req, res);

        return {};
    }

    private async createGrant(provider: any, accountId: string, interactionDetails: any) {
        const {
            grantId,
            prompt: { details }
        } = interactionDetails;
        let grant: any;
        if (grantId) {
            // we'll be modifying existing grant in existing session
            grant = await provider.Grant.find(grantId);
        } else {
            // we're establishing a new grant
            grant = new provider.Grant({
                accountId,
                clientId: 'foo'
            });
        }

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
}
