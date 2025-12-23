import { DynamicModule, Provider } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import {
    OIDC_ADAPTER_REDIS_HOST,
    OIDC_BASE_PATH,
    OIDC_CONFIGURATION,
    OIDC_CUSTOM_INTERACTION_URL
} from '../constants/injector.constant';
import { OidcController } from '../controllers/oidc.controller';
import { OidcAuthService } from '../services/oidc-auth.service';
import { OidcService } from '../services/oidc.service';
import { ModuleAsyncOptions } from '../types/module-async-options.type';

export class OidcModule {
    public static forRootAsync(options: ModuleAsyncOptions): DynamicModule {
        const redisHost = options.redisHost;
        const customInteractionUrl = options.customInteractionUrl;
        const basePath = options.basePath || 'user-services/oidc';

        // Dynamically set the controller path
        Reflect.defineMetadata(PATH_METADATA, basePath, OidcController);

        const providers: Provider[] = [
            {
                provide: OIDC_ADAPTER_REDIS_HOST,
                useValue: redisHost
            },
            {
                provide: OIDC_CUSTOM_INTERACTION_URL,
                useValue: customInteractionUrl
            },
            {
                provide: OIDC_BASE_PATH,
                useValue: basePath
            },
            OidcService,
            OidcAuthService
        ];

        if (options.configuration?.useFactory) {
            providers.push({
                provide: OIDC_CONFIGURATION,
                useFactory: options.configuration.useFactory,
                inject: options.configuration.inject
            });
        } else {
            providers.push({
                provide: OIDC_CONFIGURATION,
                useValue: options.configuration
            });
        }

        const imports = options.configuration?.imports || [];

        return {
            module: OidcModule,
            providers,
            imports,
            controllers: [OidcController],
            exports: [OidcService, OidcAuthService]
        };
    }
}
