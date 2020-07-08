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

import { PDFData } from '../types/PDFData';
import { PDFLog } from '../log/PDFLog';

/**
 * Contains various utility functions for common operations.
 */
export class PDFUtil {
    /**
     * Helper method. Convert a relative URL to a absolute URL
     *  by prepending the window origin to the relative URL.
     * @param dataUrl
     */
    public static getAbsoluteURL(dataUrl: string): string {
        return `${window.origin}/${dataUrl}`;
    }

    /**
     * Pull relevant data from an item, creating a {@link PDFData}.
     * @param item The item to pull data from.
     */
    public static getPDFDataFromItem(item: Item): PDFData | null {
        if (item === undefined || item === null) {
            return null;
        }

        let { code, url, offset, cache } = item.data.data;
        let name = item.name;

        if (typeof offset === 'string') {
            offset = parseInt(offset);
        }

        return {
            name,
            code,
            url,
            offset,
            cache,
        };
    }

    /**
     * Returns true if the URL starts with the origin.
     * @param dataUrl A url.
     */
    public static validateAbsoluteURL(dataUrl: string): boolean {
        return dataUrl.startsWith(window.origin);
    }

    public static getUserIdsOfRole(role: number) {
        return game.users
            .filter((user) => {
                return user.role === role;
            })
            .map((user) => user.id);
    }

    public static getUserIdsAtLeastRole(role: number) {
        return game.users
            .filter((user) => {
                return user.role >= role;
            })
            .map((user) => user.id);
    }

    public static getUserIdsAtMostRole(role: number) {
        return game.users
            .filter((user) => {
                return user.role <= role;
            })
            .map((user) => user.id);
    }
}
