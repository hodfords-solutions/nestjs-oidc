import { DynamicModule } from '@nestjs/common';
import {
    OIDC_ADAPTER_REDIS_HOST,
    OIDC_CONFIGURATION,
    OIDC_CUSTOM_INTERACTION_URL
} from '../constants/injector.constant';
import { OidcAuthController } from '../controllers/oidc-auth.controller';
import { OidcController } from '../controllers/oidc.controller';
import { OidcAuthService } from '../services/oidc-auth.service';
import { OidcService } from '../services/oidc.service';

export class OidcModule {
    public static forRoot(
        configuration: Record<string, any>,
        redisHost: string,
        customInteractionUrl: (uid: string) => string | string
    ): DynamicModule {
        return {
            module: OidcModule,
            providers: [
                {
                    provide: OIDC_CONFIGURATION,
                    useValue: configuration
                },
                {
                    provide: OIDC_ADAPTER_REDIS_HOST,
                    useValue: redisHost
                },
                {
                    provide: OIDC_CUSTOM_INTERACTION_URL,
                    useValue: customInteractionUrl
                },
                OidcService,
                OidcAuthService
            ],
            controllers: [OidcController, OidcAuthController],
            exports: [OidcService]
        };
    }
}
