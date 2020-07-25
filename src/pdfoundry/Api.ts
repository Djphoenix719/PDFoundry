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

import {
    fileExists,
    getAbsoluteURL,
    getPDFBookData,
    getUserIdsAtLeastRole,
    getUserIdsAtMostRole,
    getUserIdsBetweenRoles,
    getUserIdsExceptMe,
    getUserIdsOfRole,
    isPDF,
    validateAbsoluteURL,
} from './Util';
import StaticViewer from './viewer/StaticViewer';
import { PDFBookData } from './common/types/PDFBookData';
import Settings from './settings/Settings';
import PDFCache from './cache/PDFCache';
import BaseViewer from './viewer/BaseViewer';
import { PDFDataType } from './common/types/PDFBaseData';

// noinspection JSUnusedGlobalSymbols

/**
 * A function to passed to getPDFData to find user specified PDF data.
 */
type ItemComparer = (item: Item) => boolean;

/**
 * Open the specified PDF in a provided viewer
 * @param viewer
 * @param url
 * @param page
 * @param cache
 * @private
 */
async function _handleOpen(viewer: StaticViewer, url: string, page: number, cache: boolean) {
    if (cache) {
        const cachedBytes = await PDFCache.getCache(url);
        // If we have a cache hit open the cached data
        if (cachedBytes) {
            await viewer.open(cachedBytes, page);
        } else {
            // Otherwise we should open it by url
            await viewer.open(url, page);
            // And when the download is complete set the cache
            viewer.download().then((bytes) => {
                PDFCache.setCache(url, bytes);
            });
        }
    } else {
        await viewer.open(url, page);
    }
}

/**
 * The PDFoundry API
 *
 * You can access the API with `ui.PDFoundry`.
 */
export default class Api {
    /**
     * Enable additional debug information for the specified category.
     * @category Debug
     */
    public static DEBUG = {
        /**
         * When set to true, enables the logging event names and arguments to console.
         */
        EVENTS: false,
    };

    /**
     * A reference to the unclassified utility functions.
     */
    public static get UTIL() {
        return {
            fileExists,
            getAbsoluteURL,
            getPDFBookData,
            getUserIdsAtLeastRole,
            getUserIdsAtMostRole,
            getUserIdsBetweenRoles,
            getUserIdsExceptMe,
            getUserIdsOfRole,
            isPDF,
            validateAbsoluteURL,
        };
    }

    // <editor-fold desc="GetPDFData Methods">

    /**
     * Find a PDF entity from the items directory using a specified comparer.
     * @param comparer
     * @param allowInvisible If true, PDFs hidden from the active user will be returned.
     */
    public static findPDFEntity(comparer: ItemComparer, allowInvisible: boolean = true): Item | null {
        return game.items.find((item: Item) => {
            return item.type === Settings.PDF_ENTITY_TYPE && (item.visible || allowInvisible) && comparer(item);
        });
    }

    /**
     * Helper method. Alias for {@link Api.getPDFData} with a comparer that searches by PDF Code.
     * @param code Which code to search for a PDF with.
     * @param allowInvisible See allowVisible on {@link findPDFEntity}
     * @category PDFData
     */
    public static getPDFDataByCode(code: string, allowInvisible: boolean = true): PDFBookData | null {
        return Api.getPDFData((item) => {
            return item.data.data.code === code;
        }, allowInvisible);
    }

    /**
     * Helper method. Alias for {@link Api.getPDFData} with a comparer that searches by PDF Name.
     * @param name Which name to search for a PDF with.
     * @param caseInsensitive If a case insensitive search should be done.
     * @param allowInvisible See allowVisible on {@link findPDFEntity}
     * @category PDFData
     */
    public static getPDFDataByName(name: string, caseInsensitive: boolean = true, allowInvisible: boolean = true): PDFBookData | null {
        if (caseInsensitive) {
            return Api.getPDFData((item) => {
                return item.name.toLowerCase() === name.toLowerCase();
            }, allowInvisible);
        } else {
            return Api.getPDFData((item) => {
                return item.name === name;
            }, allowInvisible);
        }
    }

    /**
     * Finds a PDF entity created by the user and constructs a {@link PDFBookData} object of the resulting PDF's data.
     * @param comparer A comparison function that will be used.
     * @param allowInvisible See allowVisible on {@link findPDFEntity}
     * @category PDFData
     */
    public static getPDFData(comparer: ItemComparer, allowInvisible: boolean = true): PDFBookData | null {
        const pdf = this.findPDFEntity(comparer, allowInvisible);
        return getPDFBookData(pdf);
    }

    // </editor-fold>

    // <editor-fold desc="OpenActor Methods">

    public static async openActor(actor: Actor, Item) {}

    // </editor-fold>

    // <editor-fold desc="OpenPDF Methods">

    /**
     * Open the PDF with the provided code to the specified page.
     * Helper for {@link getPDFDataByCode} then {@link openPDF}.
     * @category Open
     */
    public static async openPDFByCode(code: string, page: number = 1): Promise<BaseViewer> {
        const pdf = this.getPDFDataByCode(code);

        if (pdf === null) {
            const error = game.i18n.localize('PDFOUNDRY.ERROR.NoPDFWithCode');

            if (Settings.NOTIFICATIONS) {
                ui.notifications.error(error);
            }

            return Promise.reject(error);
        }

        return this.openPDF(pdf, page);
    }

    /**
     * Open the PDF with the provided code to the specified page.
     * Helper for {@link getPDFDataByCode} then {@link openPDF}.
     * @category Open
     */
    public static async openPDFByName(name: string, page: number = 1): Promise<BaseViewer> {
        const pdf = this.getPDFDataByName(name);

        if (pdf === null) {
            const message = game.i18n.localize('PDFOUNDRY.ERROR.NoPDFWithName');
            const error = new Error(message);

            if (Settings.NOTIFICATIONS) {
                ui.notifications.error(error.message);
            }

            return Promise.reject(error);
        }

        return this.openPDF(pdf, page);
    }

    /**
     * Open the provided {@link PDFBookData} to the specified page.
     * @param pdf The PDF to open. See {@link Api.getPDFData}.
     * @param page The page to open the PDF to.
     * @category Open
     */
    public static async openPDF(pdf: PDFBookData, page: number = 1): Promise<BaseViewer> {
        let { url, offset, cache } = pdf;

        if (typeof offset === 'string') {
            offset = parseInt(offset);
        }

        if (!validateAbsoluteURL(url)) {
            url = getAbsoluteURL(url);
        }

        const viewer = new StaticViewer(pdf);
        viewer.render(true);

        await _handleOpen(viewer, url, page + offset, cache);

        return viewer;
    }

    /**
     * Open a URL as a PDF.
     * @param url The URL to open (must be absolute).
     * @param page Which page to open to. Must be >= 1.
     * @param cache If URL based caching should be used.
     * @category Open
     */
    public static async openURL(url: string, page: number = 1, cache: boolean = true): Promise<BaseViewer> {
        if (isNaN(page) || page <= 0) {
            throw new Error(`Page must be > 0, but ${page} was given.`);
        }

        if (!validateAbsoluteURL(url)) {
            url = getAbsoluteURL(url);
        }

        const viewer = new StaticViewer();
        viewer.render(true);

        await _handleOpen(viewer, url, page, cache);

        return viewer;
    }

    /**
     * Shows the user manual to the active user.
     * @category Utility
     */
    public static async showHelp(): Promise<BaseViewer> {
        await game.user.setFlag(Settings.EXTERNAL_SYSTEM_NAME, Settings.SETTING_KEY.HELP_SEEN, true);

        const lang = game.i18n.lang;
        let manualPath = `${window.origin}/systems/${Settings.DIST_PATH}/assets/manual/${lang}/manual.pdf`;
        const manualExists = await fileExists(manualPath);

        if (!manualExists) {
            manualPath = `${window.origin}/systems/${Settings.DIST_PATH}/assets/manual/en/manual.pdf`;
        }

        const pdfData: PDFBookData = {
            name: game.i18n.localize('PDFOUNDRY.MANUAL.Name'),
            type: PDFDataType.Book,
            code: '',
            offset: 0,
            url: manualPath,
            cache: false,
        };

        return Api.openPDF(pdfData);
    }

    // </editor-fold>
}
