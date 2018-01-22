export declare const simpleMethods: ReadonlyArray<string>;
export declare const simpleRequestHeaders: ReadonlyArray<string>;
export declare const simpleResponseHeaders: ReadonlyArray<string>;
export interface CorsResult {
    headers: {
        [key: string]: string;
    };
    vary: Array<string>;
    status?: number;
}
export declare type OriginsFunction = ((header: string) => boolean) | ((header: string) => Promise<boolean>);
export declare type Origins = string[] | OriginsFunction;
export interface CorsOptions {
    origins: Origins;
    methods: ReadonlyArray<string>;
    requestHeaders: ReadonlyArray<string>;
    responseHeaders: ReadonlyArray<string>;
    supportsCredentials: boolean;
    maxAge: number;
    endPreflightRequests: boolean;
}
export declare type Headers = {
    [key: string]: string;
};
export declare type CorsFunction = (method: string, headers: Readonly<Headers>) => Promise<CorsResult>;
export declare function setup(opts?: Partial<CorsOptions>): CorsFunction;
