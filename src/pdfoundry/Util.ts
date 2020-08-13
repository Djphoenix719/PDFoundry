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

import { PDFData, PDFDataDelete, PDFDataUpdate } from './common/types/PDFData';
import Settings from './Settings';
import { PDFType } from './common/types/PDFType';
import { DOMAIN_WHITELIST } from './common/Whitelist';

// *************
// URL HELPERS
// *************
// <editor-fold desc='URL Helpers">

/**
 * Convert a relative URL to a absolute URL by prepending the window origin to the relative URL.
 * If the URL is of a white listed domain, will simply return the provided URL.
 * @param dataUrl A url to be validated.
 * @see {@link DOMAIN_WHITELIST}
 */
export function getAbsoluteURL(dataUrl: string): string {
    // Some domains are white listed, these should be considered absolute already
    for (const domain of DOMAIN_WHITELIST) {
        if (dataUrl.includes(domain)) {
            return dataUrl;
        }
    }

    return `${window.origin}/${dataUrl}`;
}

/**
 * Returns true if the URL starts with the origin or the domain is one of the
 *  white listed domains.
 * @param dataUrl A url to be validated.
 * @see {@link DOMAIN_WHITELIST}
 */
export function validateAbsoluteURL(dataUrl: string): boolean {
    // Some domains are white listed
    for (const domain of DOMAIN_WHITELIST) {
        if (dataUrl.includes(domain)) {
            return true;
        }
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
 * @param entity The entity to check. Only JournalEntities are allowed to be PDFs natively.
 */
export function isEntityPDF(entity: Entity): boolean {
    return entity.getFlag(Settings.MODULE_NAME, Settings.FLAGS_KEY.PDF_DATA) !== undefined;
}

/**
 * Pull relevant data from an journal entry, creating a {@link PDFData} object.
 * @param journalEntry The journal entry to pull data from.
 */
export function getPDFData(journalEntry: JournalEntry | null | undefined): PDFData | undefined {
    if (journalEntry === undefined || journalEntry === null) {
        return undefined;
    }

    const pdfData = journalEntry.getFlag(Settings.MODULE_NAME, Settings.FLAGS_KEY.PDF_DATA) as PDFData | undefined;
    if (pdfData === undefined) {
        return undefined;
    }
    pdfData.name = journalEntry.name;
    return pdfData;
}

/**
 * Set one or more {@link PDFData} attributes to the provided values. Makes no changes to fields that
 *  are not specified. If you wish to update the PDF name, use Entity.update as normal in Foundry.
 * @param journalEntry The PDF to update the data on.
 * @param pdfData A partial mapping of a {@link PDFData} object.
 */
export function setPDFData(journalEntry: JournalEntry, pdfData: Partial<PDFDataUpdate>) {
    return journalEntry.setFlag(Settings.MODULE_NAME, Settings.FLAGS_KEY.PDF_DATA, pdfData);
}

/**
 * Deletes a key from the PDF data. Requires the value of the key to be set to null.
 * @param journalEntry The journal entry to delete the key from.
 * @param pdfData A mapping of {key: null} pairs to delete.
 */
export function deletePDFData(journalEntry: JournalEntry, pdfData: Partial<PDFDataDelete>) {
    const update = {};

    // TODO: Feature request to use Symbols to perform this type of operation
    for (const key of Object.keys(pdfData)) {
        update[`flags.${Settings.MODULE_NAME}.${Settings.FLAGS_KEY.PDF_DATA}.-=${key}`] = null;
    }

    return journalEntry.update(update);
}

/**
 * Returns true or false if all required data is set such that the PDF is possible to open.
 *  Does not guarantee any specific data for a type of open (e.g. opening as a fillable PDF)
 *  only that the static viewer is able to open the PDF.
 * @param pdfData The PDF data to check.
 */
export function canOpenPDF(pdfData: PDFData) {
    if (PDFType[pdfData.type] === undefined) {
        return false;
    }

    if (pdfData.url === undefined || pdfData.url === '') {
        return false;
    }

    return true;
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
