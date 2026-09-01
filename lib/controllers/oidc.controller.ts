import { All, Controller, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { OidcService } from '../services/oidc.service.js';

@Controller('oidc')
export class OidcController {
    constructor(private oidcService: OidcService) {}

    @All('/{*splat}')
    mountedOidc(@Req() req: Request, @Res() res: Response): Promise<void> {
        req.url = req.originalUrl.replace('/oidc', '');

        return this.oidcService.providerInstance.callback()(req, res);
    }
}
