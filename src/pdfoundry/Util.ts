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
import Settings from './settings/Settings';

// *************
// URL HELPERS
// *************
// <editor-fold desc='URL Helpers">

/**
 * Helper method. Convert a relative URL to a absolute URL
 *  by prepending the window origin to the relative URL.
 * @param dataUrl
 */
export function getAbsoluteURL(dataUrl: string): string {
    // Amazon S3 buckets are already absolute
    if (dataUrl.includes('amazonaws.com')) {
        return dataUrl;
    }
    return `${window.origin}/${dataUrl}`;
}

/**
 * Returns true if the URL starts with the origin.
 * @param dataUrl A url.
 */
export function validateAbsoluteURL(dataUrl: string): boolean {
    // Amazon S3 buckets are already absolute
    if (dataUrl.includes('amazonaws.com')) {
        return true;
    }

    return dataUrl.startsWith(window.origin);
}

// </editor-fold>

// *************
// DATA HELPERS
// *************
// <editor-fold desc='Data Helpers">

/**
 * Returns true if the provided entity contains PDF data
 * @param entity
 */
export function isEntityPDF(entity: Entity): boolean {
    return entity.getFlag(Settings.MODULE_NAME, Settings.FLAGS_KEY.PDF_DATA) !== undefined;
}

/**
 * Pull relevant data from an journal entry, creating a {@link PDFData} object.
 * @param journal The journal entry to pull data from.
 */
export function getPDFData(journal: JournalEntry | null | undefined): PDFData | undefined {
    if (journal === undefined || journal === null) {
        return undefined;
    }

    return journal.getFlag(Settings.MODULE_NAME, Settings.FLAGS_KEY.PDF_DATA);
}

// </editor-fold>

/**
 * Return all users ids except the active user
 */
export function getUserIdsExceptMe() {
    return game.users
        .filter((user: User) => {
            return user.id !== game.userId;
        })
        .map((user: User) => user.id);
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
