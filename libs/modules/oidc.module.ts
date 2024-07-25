import { DynamicModule, Type } from '@nestjs/common';
import {
    OIDC_ACCOUNT_SERVICE,
    OIDC_ADAPTER_REDIS_HOST,
    OIDC_CONFIGURATION,
    OIDC_CUSTOM_INTERACTION_URL
} from '../constants/injector.constant';
import { OidcController } from '../controllers/oidc.controller';
import { OidcService } from '../services/oidc.service';
import { OidcAuthService } from '../services/oidc-auth.service';
import { IAccountService } from '../interfaces/account-service.interface';
import { OidcAuthController } from '../controllers/oidc-auth.controller';

export class OidcModule {
    public static forRoot(
        configuration: Record<string, any>,
        accountServiceClass: Type<IAccountService>,
        redisHost: string,
        customInteractionUrl: string
    ): DynamicModule {
        return {
            module: OidcModule,
            providers: [
                {
                    provide: OIDC_CONFIGURATION,
                    useValue: configuration
                },
                {
                    provide: OIDC_ACCOUNT_SERVICE,
                    useClass: accountServiceClass
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
