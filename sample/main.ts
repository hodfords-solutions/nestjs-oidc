import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.use((req: any, res: any, next: any) => {
        // // Website you wish to allow to connect
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001');

        // // Request method you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

        // // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization,skip');

        // Set to true if you need the website to include cookies in the request sent
        // to the API (e.g. in case you use sessions)
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        // Pass to the next layer of middleware
        next();
    });
    app.enableCors({
        origin: true,
        credentials: true
    });
    await app.listen(3000);
}
bootstrap().then();
