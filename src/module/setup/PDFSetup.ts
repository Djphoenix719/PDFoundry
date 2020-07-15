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
import { PDFItemSheet } from '../app/PDFItemSheet';
import { PDFoundryAPI } from '../api/PDFoundryAPI';
import { PDFUtil } from '../api/PDFUtil';
import { PDFPreloadEvent } from '../socket/events/PDFPreloadEvent';
import { PDFCache } from '../cache/PDFCache';

// TODO: Utilities for get/set user flags
/**
 * A collection of methods used for setting up the API & system state.
 * @private
 */
export class PDFSetup {
    /**
     * Register the PDFoundry APi on the UI
     */
    public static registerAPI() {
        ui['PDFoundry'] = PDFoundryAPI;
    }

    /**
     * Inject the CSS file into the header, so it doesn't have to be referenced in the system.json
     */
    public static registerCSS() {
        $('head').append(
            $(`<link href="systems/${PDFSettings.EXTERNAL_SYSTEM_NAME}/${PDFSettings.DIST_FOLDER}/bundle.css" rel="stylesheet" type="text/css" media="all">`),
        );
    }

    /**
     * Pulls the system name from the script tags.
     */
    public static registerSystem() {
        const scripts = $('script');
        for (let i = 0; i < scripts.length; i++) {
            const script = scripts.get(i) as HTMLScriptElement;
            const folders = script.src.split('/');
            const distIdx = folders.indexOf(PDFSettings.DIST_FOLDER);
            if (distIdx === -1) continue;

            if (folders[distIdx - 1] === 'pdfoundry') break;

            PDFSettings.EXTERNAL_SYSTEM_NAME = folders[distIdx - 1];
            break;
        }
    }

    /**
     * Register the PDF sheet and unregister invalid sheet types from it.
     */
    public static registerPDFSheet() {
        Items.registerSheet(PDFSettings.INTERNAL_MODULE_NAME, PDFItemSheet, {
            types: [PDFSettings.PDF_ENTITY_TYPE],
            makeDefault: true,
        });

        // Unregister all other item sheets for the PDF entity
        const pdfoundryKey = `${PDFSettings.INTERNAL_MODULE_NAME}.${PDFItemSheet.name}`;
        const sheets = CONFIG.Item.sheetClasses[PDFSettings.PDF_ENTITY_TYPE];
        for (const key of Object.keys(sheets)) {
            const sheet = sheets[key];
            // keep the PDFoundry sheet
            if (sheet.id === pdfoundryKey) {
                continue;
            }

            // id is MODULE.CLASS_NAME
            const [module] = sheet.id.split('.');
            Items.unregisterSheet(module, sheet.cls, {
                types: [PDFSettings.PDF_ENTITY_TYPE],
            });
        }
    }

    /**
     * Get additional context menu icons for PDF items
     * @param html
     * @param options
     */
    public static getItemContextOptions(html, options: any[]) {
        const getItemFromContext = (html: JQuery<HTMLElement>): Item => {
            const id = html.data('entity-id');
            return game.items.get(id);
        };

        if (game.user.isGM) {
            options.unshift({
                name: game.i18n.localize('PDFOUNDRY.CONTEXT.PreloadPDF'),
                icon: '<i class="fas fa-download fa-fw"></i>',
                condition: (entityHtml: JQuery<HTMLElement>) => {
                    const item = getItemFromContext(entityHtml);
                    if (item.type !== PDFSettings.PDF_ENTITY_TYPE) {
                        return false;
                    }

                    const { url } = item.data.data;
                    return url !== '';
                },
                callback: (entityHtml: JQuery<HTMLElement>) => {
                    const item = getItemFromContext(entityHtml);
                    const pdf = PDFUtil.getPDFDataFromItem(item);

                    if (pdf === null) {
                        //TODO: Error handling
                        return;
                    }

                    const { url } = pdf;
                    const event = new PDFPreloadEvent(null, PDFUtil.getAbsoluteURL(url));
                    event.emit();

                    PDFCache.preload(url);
                },
            });
        }

        options.unshift({
            name: game.i18n.localize('PDFOUNDRY.CONTEXT.OpenPDF'),
            icon: '<i class="far fa-file-pdf"></i>',
            condition: (entityHtml: JQuery<HTMLElement>) => {
                const item = getItemFromContext(entityHtml);
                if (item.type !== PDFSettings.PDF_ENTITY_TYPE) {
                    return false;
                }

                const { url } = item.data.data;
                return url !== '';
            },
            callback: (entityHtml: JQuery<HTMLElement>) => {
                const item = getItemFromContext(entityHtml);
                const pdf = PDFUtil.getPDFDataFromItem(item);

                if (pdf === null) {
                    //TODO: Error handling
                    return;
                }

                PDFoundryAPI.openPDF(pdf, 1);
            },
        });
    }

    public static userLogin() {
        let viewed;
        try {
            viewed = game.user.getFlag(PDFSettings.EXTERNAL_SYSTEM_NAME, PDFSettings.HELP_SEEN_KEY);
        } catch (error) {
            viewed = false;
        } finally {
            if (!viewed) {
                PDFoundryAPI.showHelp();
            }
        }
    }
}
