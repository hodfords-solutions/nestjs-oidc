import { DynamicModule } from '@nestjs/common';
import { OIDC_ACCOUNT_SERVICE, OIDC_ADAPTER_REDIS_HOST, OIDC_CONFIGURATION } from '../constants/injector.constant';
import { OidcController } from '../controllers/oidc.controller';
import { OidcService } from '../services/oidc.service';

export class OidcModule {
    public static forRoot(
        configuration: Record<string, any>,
        accountServiceClass: any,
        redisHost: string
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
                OidcService
            ],
            controllers: [OidcController]
        };
    }
}
