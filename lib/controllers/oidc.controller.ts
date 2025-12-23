import { All, Controller, Inject, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { OidcService } from '../services/oidc.service';
import { OIDC_BASE_PATH } from '../constants/injector.constant';

@Controller()
export class OidcController {
    constructor(
        private oidcService: OidcService,
        @Inject(OIDC_BASE_PATH) private readonly basePath: string
    ) {}

    @All('*')
    mountedOidc(@Req() req: Request, @Res() res: Response): Promise<void> {
        req.url = req.originalUrl.replace(`/${this.basePath}`, '');

        return this.oidcService.providerInstance.callback()(req, res);
    }
}
