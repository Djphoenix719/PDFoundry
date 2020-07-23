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

import { PDFData } from './common/types/PDFData';

/**
 * Helper method. Convert a relative URL to a absolute URL
 *  by prepending the window origin to the relative URL.
 * @param dataUrl
 */
export function getAbsoluteURL(dataUrl: string): string {
    // Amazon S3 buckets are already absolute
    if (dataUrl.includes('s3.amazonaws.com')) {
        return dataUrl;
    }
    return `${window.origin}/${dataUrl}`;
}

/**
 * Pull relevant data from an item, creating a {@link PDFData}.
 * @param item The item to pull data from.
 */
export function getPDFDataFromItem(item: Item): PDFData | null {
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
export function validateAbsoluteURL(dataUrl: string): boolean {
    return dataUrl.startsWith(window.origin);
}

/**
 * Return all users ids except the active user
 */
export function getUserIdsExceptMe() {
    return game.users
        .filter((user) => {
            return user.id !== game.userId;
        })
        .map((user) => user.id);
}

/**
 * Gets users with a role number between the provided lower inclusive and upper inclusive bounds.
 * @param lower
 * @param upper
 */
export function getUserIdsBetweenRoles(lower: number, upper: number) {
    return game.users
        .filter((user) => {
            return user.role >= lower && user.role <= upper;
        })
        .map((user) => user.id);
}

/**
 * Gets users with a role number exactly matching the one provided.
 * @param role
 */
export function getUserIdsOfRole(role: number) {
    return game.users
        .filter((user) => {
            return user.role === role;
        })
        .map((user) => user.id);
}

/**
 * Gets users with a role number at least the one provided.
 * @param role
 */
export function getUserIdsAtLeastRole(role: number) {
    return game.users
        .filter((user) => {
            return user.role >= role;
        })
        .map((user) => user.id);
}

/**
 * Gets users with a role number at most the one provided.
 * @param role
 */
export function getUserIdsAtMostRole(role: number) {
    return game.users
        .filter((user) => {
            return user.role <= role;
        })
        .map((user) => user.id);
}

/**
 * Checks if a remote file exists at the specified path. That is, if the URL is valid. This does not guarantee a
 * valid file exists at that location. For example, an HTML file will result in true but not be a valid PDF.
 * @param path
 */
export function fileExists(path: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        $.ajax(path, {
            type: 'HEAD',
            success: () => {
                resolve(true);
            },
            error: () => {
                resolve(false);
            },
        });
    });
}
