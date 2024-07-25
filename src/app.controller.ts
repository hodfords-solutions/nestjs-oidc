import { OidcService } from '@mint/nestjs-oidc';
import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {
    constructor(private oidcService: OidcService) {}

    @Get()
    hello(): string {
        return 'Hello World!';
    }

    @Post('signin/:uid')
    async signIn(@Req() req: Request, @Res() res: Response) {
        const provider = this.oidcService.providerInstance;
        const details = await provider.interactionDetails(req, res);
        const accountId = 'ff0c6866-0796-45cb-a7ca-1f956d2c7e6a';
        const result = {
            login: {
                accountId
            }
        };
        const grantId = await this.createGrant(provider, accountId, details);
        Object.assign(result, { consent: { grantId } });

        const redirectTo = await provider.interactionResult(req, res, result, { mergeWithLastSubmission: true });

        return res.send({
            redirectTo
        });
    }

    private async createGrant(provider: any, accountId: string, details: any) {
        let { grantId } = details;
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
