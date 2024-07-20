import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { OidcModule } from '@mint/nestjs-oidc';

@Module({
    imports: [
        OidcModule.forRoot({
            issuer: 'http://localhost:3000',
            claims: {
                email: ['email', 'email_verified'],
                profile: ['name']
            },
            clients: [
                {
                    client_id: 'foo',
                    client_secret: 'bar',
                    redirect_uris: ['https://oidcdebugger.com/debug', 'https://880d-117-3-71-111.ngrok-free.app/cb'],
                    response_types: ['code id_token', 'code'],
                    grant_types: ['authorization_code', 'implicit', 'password']
                }
            ],
            features: {
                revocation: {
                    enabled: true
                },
                jwtUserinfo: { enabled: true },
                userinfo: { enabled: true }
            },
            pkce: {
                required: () => false
            }
        })
    ],
    providers: [],
    controllers: [AppController]
})
export class AppModule {}
