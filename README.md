# NTP Sync

[![npm](https://img.shields.io/npm/v/@codebundlesbyvik/ntp-sync)](https://www.npmjs.com/package/@codebundlesbyvik/ntp-sync)
[![npm - downloads per week](https://img.shields.io/npm/dw/@codebundlesbyvik/ntp-sync)](https://www.npmjs.com/package/@codebundlesbyvik/ntp-sync)

A basic Network Time Protocol synchronization library.

<br>

## Table of Contents

1. [Usage](#usage)
2. [Compatibility](#compatibility)
3. [Instance options](#instance-options)
4. [Methods](#methods)
    * [`.generateData()`](#generatedata)
    * [`.sync()`](#sync)
5. [License](#license)

<br>

## Usage

If you're not familiar with NTP yet then I highly recommend to [read up on what the values mean](https://en.wikipedia.org/wiki/Network_Time_Protocol#Clock_synchronization_algorithm) first.

``` shell
# Install package from npm
npm install @codebundlesbyvik/ntp-sync
```

If you're not using a module bundler then either:

* [Download the latest release from the GitHub releases page](https://github.com/vikputthiscodeongit/ntp-sync/releases/latest), or
* [Load the JavaScript](https://cdn.jsdelivr.net/npm/@codebundlesbyvik/ntp-sync@1.0.0) via the jsdelivr CDN.

In your HTML file, import the JavaScript as a module.

For the example below I assume the main JavaScript file is processed by a module bundler.

``` javascript
import Ntp, { convertUnixTimeFormatToMs } from "@codebundlesbyvik/ntp-sync";

const ntp = new Ntp({
    t1EndpointUrl: "./api/ntp/get-server-time.php",
    t1CalcFn: async function t1CalcFn(response: Response) {
        const data = (await response.json()) as { req_received_time: number };

        return convertUnixTimeFormatToMs(data.req_received_time);
    },
    // Providing a t2CalcFn for greater accuracy is recommended but not required.
    t2CalcFn: function t2CalcFn(resHeaders: Headers) {
        // Header value example: t=1747777363406069 D=110
        const header = resHeaders.get("Response-Timing");

        if (!header) {
            return null;
        }

        const reqReceivedTime = /\bt=([0-9]+)\b/.exec(header);
        const reqProcessingTime = /\bD=([0-9]+)\b/.exec(header);

        if (!reqReceivedTime || !reqProcessingTime) {
            return null;
        }

        const resTransmitTime =
            Number.parseInt(reqReceivedTime[1]) + Number.parseInt(reqProcessingTime[1]);

        return convertUnixTimeFormatToMs(resTransmitTime);
    },
});

const values = await this.ntp.sync();
// {
//     clientOffset: -296,
//     correctedDate: 1747828823908,
//     roundTripDelay: 591,
// }
```

<br>

## Compatibility

Requires an ECMAScript 2022 (ES13) compatible environment. Practically speaking, all browsers released in 2021 and onwards are fully supported.

<br>

## Instance options

| Property                                                        | Type                                                                                                                                                                                   | Default     | Description                                                                                                                                                                            |
| :-------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `t1EndpointUrl` <br> **Required if `t1Endpoint` not provided.** | `string`                                                                                                                                                                               | -           | URL of the endpoint to retrieve t1 from.                                                                                                                                               |
| `t1Endpoint` <br> **Required if `t1EndpointUrl` not provided.** | [@codebundlesbyvik/js-helpers `fetchWithTimeout` options](https://github.com/vikputthiscodeongit/js-helpers?tab=readme-ov-file#fetchwithtimeoutresource-fetchoptions-timeoutduration). | -           | Options for the fetcher used to retrieve t1.                                                                                                                                           |
| `t1CalcFn` <br> **Required**                                    | `(httpResponse: Response) => Promise<number \| null>`                                                                                                                                  | -           | Function used to process t1.                                                                                                                                                           |
| `t2CalcFn`                                                      | `(httpResponseHeaders: Headers) => number \| null`                                                                                                                                     | `undefined` | Function used for calculating t2. Recommended for greater precision. If not provided then t1 = t2.                                                                                     |
| `maxSyncAttempts`                                               | `number`                                                                                                                                                                               | `6`         | Maximum amount of t1 fetch requests when `.sync()` is called (i.e. the amount of times `.generateData()` is called).                                                                   |
| `requiredOkSyncAttempts`                                        | `number`                                                                                                                                                                               | `4`         | Required amount of successful t1 fetch requests per `.sync()` call (i.e. the amount of `.generateData()` calls that must return a HTTP 200 status code).                               |

<br>

## Methods

### `.generateData()`

Returns an object containing round-trip delay and client offset.

### `.sync()`

Calls `.generateData()` multiple times and returns an average of these values alongside a corrected Unix timestamp.

A `convertUnixTimeFormatToMs()` helper function is also exported, which can be used to convert any format Unix timestamp dated after September 9th 2001 to one with millisecond precision.

<br>

## License

Mozilla Public License 2.0 © 2025 [Viktor Chin-Kon-Sung](https://github.com/vikputthiscodeongit)
