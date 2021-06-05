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

/**
 * The PDFoundry API.
 *
 * You can access the API with `ui.PDFoundry`.
 * @moduledefinition API
 */

import {
    canOpenPDF,
    deletePDFData,
    getAbsoluteURL,
    getPDFData,
    getRoutePrefix,
    getUserIdsExceptMe,
    isEntityPDF,
    setPDFData,
    validateAbsoluteURL,
} from './Util';
import StaticViewer from './viewer/StaticViewer';
import { PDFData } from './common/types/PDFData';
import Settings from './Settings';
import PDFCache from './cache/PDFCache';
import BaseViewer from './viewer/BaseViewer';
import { PDFType } from './common/types/PDFType';
import FillableViewer from './viewer/FillableViewer';

// noinspection JSUnusedGlobalSymbols

/**
 * A function to passed to {@link Api.findPDFData} to find user specified PDF data.
 * @module API
 */
export type PDFValidator = (data: PDFData) => boolean;

/**
 * Open the specified PDF in a provided viewer
 * @param viewer
 * @param url
 * @param page
 * @param cache
 * @internal
 */
export async function _handleOpen(viewer: BaseViewer, url: string, page: number | undefined, cache: boolean) {
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
 * Options passed to the {@link Api.openPDF} function.
 * @module API
 */
export interface PDFOpenOptions {
    /**
     * The page to open to. If not specified, PDFoundry will attempt to open the
     *  last page the user was viewing.
     */
    page?: number;
    /**
     * If you're opening a fillable pdf, you must specify an entity for data storage.
     */
    entity?: JournalEntry;
}

/**
 * A definition for a viewer theme.
 * @module API
 */
export interface ViewerTheme {
    /**
     *
     */
    id: string;
    name: string;
    filePath: string;
}

/**
 * The PDFoundry API
 *
 * You can access the API with `ui.PDFoundry`.
 * @module API
 */
export default class Api {
    /**
     * Enable additional debug information for the specified category.
     * @category Debug
     */
    public static DEBUG = {
        // TODO
        /**
         * When set to true, enables the logging event names and arguments to console.
         */
        EVENTS: false,
    };

    // <editor-fold desc="Static Methods">

    private static _availableThemes: { [id: string]: ViewerTheme } = {};

    /**
     * Get a full theme definition by id.
     * @param id The unique id of the theme to lookup.
     */
    public static getTheme(id: string): ViewerTheme | null {
        return Api._availableThemes[id] ?? null;
    }

    /**
     * Get the currently enabled theme id.
     */
    public static get activeTheme(): ViewerTheme {
        const id = Settings.get(Settings.SETTINGS_KEY.VIEWER_THEME);
        return Api._availableThemes[id];
    }

    /**
     * Get a map of themes available for use.
     */
    public static get availableThemes() {
        const themesMap = {};
        for (const key of Object.keys(Api._availableThemes)) {
            themesMap[key] = Api._availableThemes[key].name;
        }
        return themesMap;
    }

    /**
     * Register a theme for use with PDFoundry. You must register a theme before `ready`. Do so in `setup`.
     * @param id The unique id of the theme. Providing an already existing id will over-write the existing theme.
     * @param name The user-facing display name of the theme.
     * @param filePath The relative path of the theme css file
     */
    public static registerTheme(id: string, name: string, filePath: string) {
        if (!filePath.endsWith('.css')) {
            throw new Error('You may only register css files as themes.');
        }

        if (Api._availableThemes.hasOwnProperty(id)) {
            console.warn(`PDFoundry theme with id of "${id}" is already registered!`);
        }

        this._availableThemes[id] = {
            id,
            name,
            filePath,
        };
    }

    // </editor-fold>

    /**
     * A reference to the unclassified utility functions.
     * @category Utility
     */
    public static get Utilities() {
        return {
            getRoutePrefix,
            getAbsoluteURL,
            validateAbsoluteURL,
            isEntityPDF,
            getPDFData,
            setPDFData,
            deletePDFData,
            canOpenPDF,
            getUserIdsExceptMe,
        };
    }

    // <editor-fold desc="GetPDFData Methods">

    /**
     * Find a PDF containing journal entry from the journals directory using a specified comparer.
     * @param comparer The function to compare PDF data with.
     * @param allowInvisible If true, PDFs hidden from the active user will be returned.
     * @category PDFData
     */
    public static findPDFEntity(comparer: PDFValidator, allowInvisible: boolean = true): JournalEntry | null {
        return game.journal.find((journalEntry: JournalEntry) => {
            if (!isEntityPDF(journalEntry)) {
                return false;
            }

            const pdfData = getPDFData(journalEntry);
            if (pdfData === undefined) {
                return false;
            }

            return (journalEntry.visible || allowInvisible) && comparer(pdfData);
        });
    }

    /**
     * Helper method. Alias for {@link Api.findPDFData} with a comparer that searches by PDF Code.
     * @param code Which code to search for a PDF with.
     * @param allowInvisible See allowVisible on {@link findPDFEntity}
     * @category PDFData
     */
    public static findPDFDataByCode(code: string, allowInvisible: boolean = true): PDFData | undefined {
        return Api.findPDFData((data: PDFData) => {
            return data.code === code;
        }, allowInvisible);
    }

    /**
     * Helper method. Alias for {@link Api.findPDFData} with a comparer that searches by PDF Name.
     * @param name Which name to search for a PDF with.
     * @param caseInsensitive If a case insensitive search should be done.
     * @param allowInvisible See allowVisible on {@link findPDFEntity}
     * @category PDFData
     */
    public static findPDFDataByName(name: string, caseInsensitive: boolean = true, allowInvisible: boolean = true): PDFData | undefined {
        if (caseInsensitive) {
            return Api.findPDFData((data) => {
                return data.name.toLowerCase() === name.toLowerCase();
            }, allowInvisible);
        } else {
            return Api.findPDFData((data) => {
                return data.name === name;
            }, allowInvisible);
        }
    }

    /**
     * Finds a PDF entity created by the user and constructs a {@link PDFData} object of the resulting PDF's data.
     * @param comparer A comparison function that will be used.
     * @param allowInvisible See allowVisible on {@link findPDFEntity}
     * @category PDFData
     */
    public static findPDFData(comparer: PDFValidator, allowInvisible: boolean = true): PDFData | undefined {
        const pdf = this.findPDFEntity(comparer, allowInvisible);
        if (pdf === null) {
            return undefined;
        }

        return getPDFData(pdf);
    }

    // </editor-fold>

    // <editor-fold desc="OpenPDF Methods">

    /**
     * Open the PDF with the provided code to the specified page.
     * Helper for {@link findPDFDataByCode} then {@link openPDF}.
     * @category Open
     */
    public static async openPDFByCode(code: string, options?: PDFOpenOptions): Promise<BaseViewer> {
        const pdf = this.findPDFDataByCode(code);

        if (pdf === undefined) {
            const error = game.i18n.localize('PDFOUNDRY.ERROR.NoPDFWithCode');

            ui.notifications.error(error);

            return Promise.reject(error);
        }

        return this.openPDF(pdf, options);
    }

    /**
     * Open the PDF with the provided code to the specified page.
     * Helper for {@link findPDFDataByCode} then {@link openPDF}.
     * @category Open
     */
    public static async openPDFByName(name: string, options?: PDFOpenOptions): Promise<BaseViewer> {
        const pdf = this.findPDFDataByName(name);

        if (pdf === undefined) {
            const message = game.i18n.localize('PDFOUNDRY.ERROR.NoPDFWithName');
            const error = new Error(message);

            ui.notifications.error(error.message);

            return Promise.reject(error);
        }

        return this.openPDF(pdf, options);
    }

    /**
     * Open the provided {@link PDFData} to the specified page.
     * @param pdf The PDF to open. See {@link Api.findPDFData}.
     * @param options The specified options for PDFs.
     * @category Open
     */
    public static async openPDF(pdf: PDFData, options?: PDFOpenOptions): Promise<BaseViewer> {
        if (options === undefined) {
            options = {};
        }

        let { url, offset, cache } = pdf;

        if (typeof offset === 'string') {
            if (offset === '') {
                offset = 0;
            } else {
                offset = parseInt(offset);
            }
        } else if (offset === null) {
            offset = 0;
        }

        if (!validateAbsoluteURL(url)) {
            url = getAbsoluteURL(url);
        }

        if (options.page !== undefined) {
            options.page = options.page + offset;
        }

        let viewer: BaseViewer;

        switch (pdf.type) {
            case PDFType.Static:
                viewer = new StaticViewer(pdf);
                viewer.render(true);

                await _handleOpen(viewer, url, options.page, cache);
                break;
            case PDFType.Fillable:
                if (!(options.entity instanceof JournalEntry)) {
                    throw new Error('Provided entity was not a journal entry.');
                }

                viewer = new FillableViewer(options.entity, pdf);
                viewer.render(true);

                await _handleOpen(viewer, url, options.page, cache);
                break;
            case PDFType.Actor:
                throw new Error('Actor sheets can only be opened through the actor.sheet accessor.');
        }
        return viewer;
    }

    /**
     * Open a URL as a static PDF. For form fillable PDFs you muse use {@link Api.openPDF}
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
        await Settings.set(Settings.SETTINGS_KEY.HELP_SEEN, true);

        const lang = game.i18n.lang;
        let manualPath = getAbsoluteURL(`${Settings.PATH_ASSETS}/manual/${lang}/manual.pdf`);
        // @ts-ignore
        const manualExists = await srcExists(manualPath);

        if (!manualExists) {
            manualPath = getAbsoluteURL(`${Settings.PATH_ASSETS}/manual/en/manual.pdf`);
        }

        const pdfData: PDFData = {
            name: game.i18n.localize('PDFOUNDRY.MANUAL.Name'),
            type: PDFType.Static,
            code: '',
            offset: 0,
            url: manualPath,
            cache: false,
        };

        return Api.openPDF(pdfData);
    }

    // </editor-fold>
}
