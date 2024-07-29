import { Controller, Post, Res, Req, HttpStatus } from '@nestjs/common';
import { OidcAuthService } from '../services/oidc-auth.service';
import { Request, Response } from 'express';

@Controller('oidc-auth')
export class OidcAuthController {
    constructor(private oidcAuthService: OidcAuthService) {}

    @Post('signin/:uid')
    async signIn(@Req() req: Request, @Res() res: Response) {
        const redirectTo = await this.oidcAuthService.signIn(req, res);

        return res.status(HttpStatus.OK).json({
            nextPrompt: 'consent',
            redirectTo
        });
    }

    @Post('consent/:uid/confirm')
    async confirmConsent(@Req() req: Request, @Res() res: Response) {
        const redirectTo = await this.oidcAuthService.confirmConsent(req, res);

        return res.status(HttpStatus.OK).json({
            redirectTo
        });
    }
}
