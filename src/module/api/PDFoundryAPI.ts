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

import { PDFSettings } from '../settings/PDFSettings';
import { PDFViewer } from '../viewer/PDFViewer';
import { PDFCache } from '../cache/PDFCache';
import { PDFEvents } from './PDFEvents';
import { PDFUtil } from './PDFUtil';
import { PDFData } from '../types/PDFData';

type ItemComparer = (item: Item) => boolean;

/**
 * The PDFoundry API <br>
 *
 * You can access the API with `ui.PDFoundry`. Note the primary way to observe behavior of the PDF viewer is to use
 * the provided {@link PDFEvents} class.
 */
export class PDFoundryAPI {
    /**
     * A reference to the static {@link PDFEvents} class.
     */
    public static get events() {
        return PDFEvents;
    }

    /**
     * A reference to the static {@link PDFUtil} class.
     */
    public static get util() {
        return PDFUtil;
    }

    // <editor-fold desc="GetPDFData Methods">

    /**
     * Helper method. Alias for {@link PDFoundryAPI.getPDFData} with a
     *  comparer that searches by PDF Code.
     * @param code Which code to search for a PDF with.
     */
    public static getPDFDataByCode(code: string): PDFData | null {
        return PDFoundryAPI.getPDFData((item) => {
            return item.data.data.code === code;
        });
    }

    /**
     * Helper method. Alias for {@link PDFoundryAPI.getPDFData} with a
     *  comparer that searches by PDF Name.
     * @param name Which name to search for a PDF with.
     * @param caseInsensitive If a case insensitive search should be done.
     */
    public static getPDFDataByName(name: string, caseInsensitive: boolean = true): PDFData | null {
        if (caseInsensitive) {
            return PDFoundryAPI.getPDFData((item) => {
                return item.name.toLowerCase() === name.toLowerCase();
            });
        } else {
            return PDFoundryAPI.getPDFData((item) => {
                return item.name === name;
            });
        }
    }

    /**
     * Finds a PDF entity created by the user and constructs a
     *  {@link PDFData} object of the resulting PDF's data.
     * @param comparer A comparison function that will be used.
     */
    public static getPDFData(comparer: ItemComparer): PDFData | null {
        const pdf: Item = game.items.find((item: Item) => {
            return item.type === PDFSettings.PDF_ENTITY_TYPE && comparer(item);
        });

        return PDFUtil.getPDFDataFromItem(pdf);
    }

    // </editor-fold>

    // <editor-fold desc="OpenPDF Methods">

    /**
     * Open the PDF with the provided code to the specified page.
     * Helper for {@link getPDFDataByCode} then {@link openPDF}.
     */
    public static async openPDFByCode(code: string, page: number = 1) {
        const pdf = this.getPDFDataByCode(code);

        if (pdf === null) {
            const error = game.i18n.localize('PDFOUNDRY.ERROR.NoPDFWithCode');

            if (PDFSettings.NOTIFICATIONS) {
                ui.notifications.error(error);
            }

            return Promise.reject(error);
        }

        return this.openPDF(pdf, page);
    }

    /**
     * Open the PDF with the provided code to the specified page.
     * Helper for {@link getPDFDataByCode} then {@link openPDF}.
     */
    public static async openPDFByName(name: string, page: number = 1) {
        const pdf = this.getPDFDataByName(name);

        if (pdf === null) {
            const message = game.i18n.localize('PDFOUNDRY.ERROR.NoPDFWithName');
            const error = new Error(message);

            if (PDFSettings.NOTIFICATIONS) {
                ui.notifications.error(error.message);
            }

            return Promise.reject(error);
        }

        return this.openPDF(pdf, page);
    }

    /**
     * Open the provided {@link PDFData} to the specified page.
     * @param pdf The PDF to open. See {@link PDFoundryAPI.getPDFData}.
     * @param page The page to open the PDF to.
     */
    public static async openPDF(pdf: PDFData, page: number = 1) {
        let { url, offset, cache } = pdf;

        if (typeof offset === 'string') {
            offset = parseInt(offset);
        }

        if (!PDFUtil.validateAbsoluteURL(url)) {
            url = PDFUtil.getAbsoluteURL(url);
        }

        const viewer = new PDFViewer(pdf);
        viewer.render(true);

        await PDFoundryAPI._handleOpen(viewer, url, page + offset, cache);

        return viewer;
    }

    /**
     * Open a URL as a PDF.
     * @param url The URL to open (must be absolute).
     * @param page Which page to open to. Must be >= 1.
     * @param cache If URL based caching should be used.
     */
    public static async openURL(url: string, page: number = 1, cache: boolean = true): Promise<PDFViewer> {
        if (isNaN(page) || page <= 0) {
            throw new Error(`Page must be > 0, but ${page} was given.`);
        }

        if (!PDFUtil.validateAbsoluteURL(url)) {
            url = PDFUtil.getAbsoluteURL(url);
        }

        const viewer = new PDFViewer();
        viewer.render(true);

        await PDFoundryAPI._handleOpen(viewer, url, page, cache);

        return viewer;
    }

    private static async _handleOpen(viewer: PDFViewer, url: string, page: number, cache: boolean) {
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

    // </editor-fold>
}
