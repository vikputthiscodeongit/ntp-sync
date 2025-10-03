import { fetchWithTimeout, getAverage, wait } from "@codebundlesbyvik/js-helpers";

function convertUnixTimeFormatToMs(time: number) {
    if (typeof time !== "number" || Number.isNaN(time)) {
        console.warn("`time` must be of type `number` and not NaN.");
        return null;
    }

    const timeString = time.toString().replace(".", "");
    const processedTimeString =
        timeString.length > 16 ? timeString.slice(0, 16) : timeString.padEnd(16, "0");
    const timeInMs = Math.round(Number.parseInt(processedTimeString) / 1000);

    return timeInMs;
}

function filterOutliers(values: number[]) {
    if (values.length < 5) return values;

    return values.sort((a, b) => a - b).slice(1, values.length - 2);
}

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

const DEFAULT_INSTANCE_OPTIONS: DefaultOptions = {
    maxSyncAttempts: 6,
    requiredOkSyncAttempts: 4,
};

class Ntp {
    t1FetchOptions: [RequestInfo | URL, RequestInit?, number?];
    t1CalcFn: (httpResponse: Response) => Promise<number | null>;
    t2CalcFn: ((httpResponseHeaders: Headers) => number | null) | null;
    maxSyncAttempts: number;
    requiredOkSyncAttempts: number;

    constructor(options: Options) {
        const mergedOptions = {
            ...DEFAULT_INSTANCE_OPTIONS,
            ...options,
        };

        if (mergedOptions.t1EndpointUrl && mergedOptions.t1Endpoint) {
            console.warn(
                "t1EndpointUrl and t1Endpoint.url are both provided. t1Endpoint.url will take preference.",
            );
        }

        const t1EndpointUrl = mergedOptions.t1Endpoint
            ? mergedOptions.t1Endpoint.url
            : mergedOptions.t1EndpointUrl;

        if (!t1EndpointUrl) {
            throw new Error(
                "t1 endpoint URL must be provided, either as t1EndpointUrl or t1Endpoint.url.",
            );
        }

        this.t1FetchOptions = [
            t1EndpointUrl,
            mergedOptions.t1Endpoint?.fetchOptions,
            mergedOptions.t1Endpoint?.timeoutDuration,
        ];
        this.t1CalcFn = mergedOptions.t1CalcFn;
        this.t2CalcFn = mergedOptions.t2CalcFn || null;
        this.maxSyncAttempts = mergedOptions.maxSyncAttempts;
        this.requiredOkSyncAttempts = mergedOptions.requiredOkSyncAttempts;
    }

    // t0 is the client's timestamp at the request packet transmission
    // t1 is the server's timestamp at the request packet reception
    // t2 is the server's timestamp at the response packet transmission
    // t3 is the client's timestamp at the response packet reception
    async generateData() {
        console.info("generateData: Running...");

        const t0 = new Date().valueOf();
        console.debug(`generateData - t0:`, t0);

        const response = await fetchWithTimeout(...this.t1FetchOptions);

        if (!response.ok) {
            throw new Error(`t1 data fetch failed.`);
        }

        const t1 = await this.t1CalcFn(response);
        console.debug(`generateData - t1:`, t1);

        if (t1 === null) {
            throw new Error("t1 calculation returned `null`.");
        }

        let t2 = t1;

        if (this.t2CalcFn) {
            console.debug("generateData: Using provided function for t2 calculation.");

            const t2CalcFnResult = this.t2CalcFn(response.headers);

            if (t2CalcFnResult !== null && t2CalcFnResult > t1) {
                t2 = t2CalcFnResult;
            } else {
                console.warn("t2 calculation with provided function failed. Using t1 as t2.");
            }
        }

        console.debug(`generateData - t2:`, t2);

        const t3 = new Date().valueOf();
        console.debug(`generateData - t3:`, t3);

        if ([t0, t1, t2, t3].some((time) => Number.isNaN(time))) {
            throw new Error("Some of the time values aren't of type `number`.");
        }

        const roundTripDelay = t3 - t0 - (t2 - t1);
        const clientOffset = (t1 - t0 + (t2 - t3)) / 2; // client > server
        console.debug(`generateData: RTD & CO:`, [roundTripDelay, clientOffset]);

        return { roundTripDelay, clientOffset };
    }

    async sync() {
        console.info("sync: Running...");

        const data = [];

        for (let iteration = 0, okIterations = 0; iteration < this.maxSyncAttempts; iteration++) {
            console.debug(`sync - fetch loop run: ${iteration}`);

            try {
                if (iteration > this.requiredOkSyncAttempts) {
                    await wait(1000);
                }

                const ntpData = await this.generateData();
                data.push(ntpData);

                okIterations++;

                if (okIterations > this.requiredOkSyncAttempts) break;
            } catch (error) {
                console.error(error);

                if (iteration < this.maxSyncAttempts - 1) {
                    console.debug(
                        `sync: Retrying ${this.maxSyncAttempts - 1 - iteration} more time(s).`,
                    );
                }
            }
        }

        if (data.length < this.requiredOkSyncAttempts) {
            throw new Error(
                `Didn't meet the required amount of successful sync attempts (${this.requiredOkSyncAttempts} out of ${this.maxSyncAttempts}).`,
            );
        }

        const roundTripDelay = getAverage(
            filterOutliers(data.map((item) => item.roundTripDelay)),
            "floor",
        );
        const clientOffset = getAverage(
            filterOutliers(data.map((item) => item.clientOffset)),
            "floor",
        );
        const correctedDate = new Date().valueOf() - clientOffset;

        const values = { roundTripDelay, clientOffset, correctedDate };
        console.debug("sync - values:", values);

        return values;
    }
}

export { type Options, Ntp as default, convertUnixTimeFormatToMs };
