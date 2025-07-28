import { All, Controller, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { OidcService } from '../services/oidc.service';
import { ApiExcludeEndpoint, ApiExcludeController } from '@nestjs/swagger';

@Controller('oidc')
@ApiExcludeController()
export class OidcController {
    constructor(private oidcService: OidcService) {}

    @All('/{*splat}')
    @ApiExcludeEndpoint()
    mountedOidc(@Req() req: Request, @Res() res: Response): Promise<void> {
        req.url = req.originalUrl.replace('/oidc', '');

        return this.oidcService.providerInstance.callback()(req, res);
    }
}
