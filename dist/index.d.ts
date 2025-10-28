declare function convertUnixTimeFormatToMs(time: number): number | null;
interface OptionsT1EndpointFetchUrl {
    t1EndpointUrl: string;
}
interface OptionsT1EndpointFetchProps {
    t1Endpoint: {
        url: RequestInfo | URL;
        fetchOptions?: RequestInit;
        timeoutDuration?: number;
    };
}
type Options = (OptionsT1EndpointFetchUrl | OptionsT1EndpointFetchProps) & {
    t1CalcFn: (response: Response) => Promise<number | null>;
    t2CalcFn?: (responseHeaders: Headers) => number | null;
    maxSyncAttempts?: number;
    requiredOkSyncAttempts?: number;
};
declare class Ntp {
    #private;
    t1CalcFn: (response: Response) => Promise<number | null>;
    t2CalcFn: ((responseHeaders: Headers) => number | null) | null;
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
