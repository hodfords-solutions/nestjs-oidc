import { DynamicModule } from '@nestjs/common';
import { OIDC_CONFIGURATION } from '../constants/injector.constant';
import { OidcController } from '../controllers/oidc.controller';
import { OidcAccountService } from '../services/oidc-account.service';
import { OidcService } from '../services/oidc.service';

export class OidcModule {
    public static forRoot(configuration: Record<string, any>): DynamicModule {
        return {
            module: OidcModule,
            providers: [
                {
                    provide: OIDC_CONFIGURATION,
                    useValue: configuration
                },
                OidcAccountService,
                OidcService
            ],
            controllers: [OidcController]
        };
    }
}
