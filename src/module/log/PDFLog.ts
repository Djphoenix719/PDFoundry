/* Copyright 2020 Andrew Cuccinello
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

type ConsoleMessage = object | string | number;
type LogType = 'log' | 'warn' | 'error' | 'verbose';

/**
 * A console logging wrapper that includes some additional information
 *  with output to help filter messages easier.
 */
export class PDFLog {
    public static readonly PREFIX: string = 'PDFoundry';

    private static format(message: ConsoleMessage) {
        const time = new Date();

        const pad = (n: number) => {
            return n >= 10 ? n : `0${n}`;
        };
        const pad_ms = (n: number) => {
            const s = n.toString();
            return '0000'.substring(0, 4 - s.length) + s;
        };

        const hh = pad(time.getHours());
        const mm = pad(time.getMinutes());
        const ss = pad(time.getSeconds());
        const ms = pad_ms(time.getMilliseconds());

        return `[${PDFLog.PREFIX}@${hh}:${mm}:${ss}.${ms}] ${message}`;
    }

    /**
     * Snapshot an object to preserve it's CURRENT state in console
     * Otherwise consoles 'lazy load' objects, and it is very hard
     *  to inspect their values when they were printed (sans breakpoints)
     * @param value The object to snapshot
     * @param level What logging level should be used
     */
    public static snapshot(value: object, level: LogType = 'log') {
        const snap = JSON.parse(JSON.stringify(value));
        let fn: Function;

        switch (level) {
            case 'log':
                fn = console.log;
                break;
            case 'warn':
                fn = console.warn;
                break;
            case 'error':
                fn = console.error;
                break;
            case 'verbose':
                fn = console.debug;
                break;
        }

        fn(PDFLog.format(':: Frozen Object ::'));
        fn(snap);
    }

    /**
     * Print a log level message to console.
     * @param message The message to print.
     */
    public static log(message: ConsoleMessage) {
        if (typeof message === 'string' || typeof message === 'number') {
            console.log(PDFLog.format(message));
        } else {
            console.log(PDFLog.format(':: Live Object ::'));
            console.log(message);
        }
    }

    /**
     * Print an info level message to console.
     * @param message The message to print.
     */
    public static info(message: ConsoleMessage) {
        if (typeof message === 'string' || typeof message === 'number') {
            console.info(PDFLog.format(message));
        } else {
            console.info(PDFLog.format(':: Live Object ::'));
            console.info(message);
        }
    }

    /**
     * Print a verbose level message to console.
     * @param message The message to print.
     */
    public static verbose(message: ConsoleMessage) {
        if (typeof message === 'string' || typeof message === 'number') {
            console.debug(PDFLog.format(message));
        } else {
            console.debug(PDFLog.format(':: Live Object ::'));
            console.debug(message);
        }
    }

    /**
     * Print a warning level message to console.
     * @param message The message to print.
     */
    public static warn(message: ConsoleMessage) {
        if (typeof message === 'string' || typeof message === 'number') {
            console.warn(PDFLog.format(message));
        } else {
            console.warn(PDFLog.format(':: Live Object ::'));
            console.warn(message);
        }
    }

    /**
     * Print a error level message to console.
     * @param message The message to print.
     */
    public static error(message: ConsoleMessage) {
        if (typeof message === 'string' || typeof message === 'number') {
            console.error(PDFLog.format(message));
        } else {
            console.error(PDFLog.format(':: Live Object ::'));
            console.error(message);
        }
    }
}
