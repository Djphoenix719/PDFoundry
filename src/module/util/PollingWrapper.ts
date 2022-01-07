/*
 * Copyright 2022 Andrew Cuccinello
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
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

export type Pollable<T> = () => Promise<T>;

/**
 * Wrap a function in a polling timeout, which runs the function ever {@param wait} ms, up to a maximum of {@param tries}, until it returns a value.
 * @param executor The function to run at the specified interval.
 * @param wait The number of milliseconds between tries.
 * @param tries The maximum number of attempts, or no maximum if not specified.
 * @constructor
 */
export function PollingWrapper<T>(executor: Pollable<T | undefined>, wait: number = 5, tries: number = -1): Promise<T | undefined> {
    return new Promise<T | undefined>((resolve) => {
        let timeout: NodeJS.Timeout;
        const poll = async () => {
            const value: T | undefined = await executor();
            if (value) {
                return resolve(value);
            }

            // will never end if maxTries is not defined
            if (--tries === 0) {
                return resolve(undefined);
            }

            timeout = setTimeout(poll, wait);
        };
        poll();
    });
}
