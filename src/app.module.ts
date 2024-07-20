import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
// import { ResponseModule } from '../libs/modules/response.module';

// const nestjsResponseConfig = ResponseModule.forRoot({
//     excludedKeys: ['secret']
// });

@Module({
    imports: [],
    providers: [],
    controllers: [AppController]
})
export class AppModule {}
