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
import { PDFViewerWeb } from '../viewer/PDFViewerWeb';

export class PDFoundryAPIError extends Error {
    constructor(message?: string) {
        super(message);
    }
}

/**
 * All the properties of a PDF that can be specified by a user
 */
export type PDFData = {
    code: string;
    url: string;
    offset: number;
    cache: boolean;
};

export class PDFoundryAPI {
    /**
     * Register your system with the API.
     * @param system The module YOU are calling this from.
     */
    public static async registerSystem(system: string) {
        PDFSettings.EXTERNAL_SYSTEM_NAME = system;
    }

    /**
     * Get an object containing the user specified PDF data for a specific PDF code.
     * @param code
     */
    public static getPDFData(code: string): null | PDFData {
        const entity = game.items.find((item) => {
            return item.data.type === PDFSettings.PDF_ENTITY_TYPE && item.data.data.code === code;
        });
        if (entity === undefined || entity === null) {
            return null;
        }

        const data = entity.data.data;
        if (data.offset === '') {
            data.offset = 0;
        }
        data.offset = parseInt(data.offset);
        return data;
    }

    /**
     * Open a PDF by code to the specified page.
     * @param code
     * @param page
     */
    public static open(code: string, page: number = 1) {
        const pdf = this.getPDFData(code);
        if (pdf === null) {
            throw new PDFoundryAPIError(`Unable to find a PDF with the code "${code}. Did the user declare it?`);
        }

        const { url, offset } = pdf;
        // coerce to number; safety first
        page = offset + parseInt(page.toString());

        this.openURL(`${window.origin}/${url}`, page);
    }

    /**
     * Open a PDF by URL to the specified page.
     * @param url
     * @param page
     */
    public static openURL(url: string, page: number = 1) {
        if (url === undefined) {
            throw new PDFoundryAPIError('Unable to open PDF; "url" must be defined');
        }

        // coerce to number; safety first
        page = parseInt(page.toString());
        if (isNaN(page) || page <= 0) {
            throw new PDFoundryAPIError(`Page must be > 0 but ${page} was given.`);
        }

        new PDFViewerWeb(url, page).render(true);
    }
}
