declare function convertUnixTimeFormatToMs(time: number): number | null;
interface DefaultOptions {
    maxSyncAttempts: number;
    requiredOkSyncAttempts: number;
}
interface Options extends Partial<DefaultOptions> {
    t1EndpointUrl?: string;
    t1Endpoint?: {
        url: RequestInfo | URL;
        fetchOptions?: RequestInit;
        timeoutDuration?: number;
    };
    t1CalcFn: (httpRes: Response) => Promise<number | null>;
    t2CalcFn?: (httpResHeaders: Headers) => number | null;
}
declare class Ntp {
    t1FetchOptions: [RequestInfo | URL, RequestInit?, number?];
    t1CalcFn: (httpResponse: Response) => Promise<number | null>;
    t2CalcFn: ((httpResponseHeaders: Headers) => number | null) | null;
    maxSyncAttempts: number;
    requiredOkSyncAttempts: number;
    constructor(options: Options);
    generateData(): Promise<{
        roundTripDelay: number;
        clientOffset: number;
    }>;
    sync(): Promise<{
        roundTripDelay: number;
        clientOffset: number;
        correctedDate: number;
    }>;
}
export { type Options, Ntp as default, convertUnixTimeFormatToMs };
