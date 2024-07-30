import { Controller, Post, Res, Req, HttpStatus } from '@nestjs/common';
import { OidcAuthService } from '../services/oidc-auth.service';
import { Request, Response } from 'express';
import { OidcPromptEnums } from 'libs/enums/odic.constant';

@Controller('oidc-auth')
export class OidcAuthController {
    constructor(private oidcAuthService: OidcAuthService) {}

    @Post('signin/:uid')
    async signIn(@Req() req: Request, @Res() res: Response) {
        const redirectTo = await this.oidcAuthService.signIn(req, res);

        return res.status(HttpStatus.OK).json({
            nextPrompt: OidcPromptEnums.CONSENT,
            redirectTo
        });
    }

    @Post('consent/:uid/confirm')
    async confirmConsent(@Req() req: Request, @Res() res: Response) {
        const redirectTo = await this.oidcAuthService.confirmConsent(req, res);

        return res.status(HttpStatus.OK).json({
            nextPrompt: OidcPromptEnums.CALLBACK,
            redirectTo
        });
    }
}
