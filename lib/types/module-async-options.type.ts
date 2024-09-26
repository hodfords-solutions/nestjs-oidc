export type ModuleAsyncOptions = {
    redisHost: string;
    customInteractionUrl: string | ((uid: string) => string);
    configuration:
        | Record<string, any>
        | {
              useFactory: (...args: any[]) => any | Promise<any>;
              inject: any[];
              imports: any[];
          };
};
