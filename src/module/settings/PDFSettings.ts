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

import { PDFSourceSheet } from '../app/PDFItemSheet';
import { PDFoundryAPI } from '../api/PDFoundryAPI';
import { PDFLog } from '../log/PDFLog';

/**
 * Internal settings and helper methods for PDFoundry.
 */
export class PDFSettings {
    public static DIST_FOLDER: string = 'pdfoundry-dist';
    public static EXTERNAL_SYSTEM_NAME: string = '../modules/pdfoundry';
    public static INTERNAL_MODULE_NAME: string = 'PDFoundry';
    public static PDF_ENTITY_TYPE: string = 'PDFoundry_PDF';

    /**
     * Register the PDF sheet and unregister invalid sheet types from it.
     */
    public static registerPDFSheet() {
        Items.registerSheet(PDFSettings.INTERNAL_MODULE_NAME, PDFSourceSheet, {
            types: [PDFSettings.PDF_ENTITY_TYPE],
            makeDefault: true,
        });

        // Unregister all other item sheets for the PDF entity
        const pdfoundryKey = `${PDFSettings.INTERNAL_MODULE_NAME}.${PDFSourceSheet.name}`;
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
     * Setup default values for pdf entities
     * @param entity
     * @param args ignored args
     */
    public static async preCreateItem(entity, ...args) {
        PDFLog.verbose('Pre-create item.');
        if (entity.type !== PDFSettings.PDF_ENTITY_TYPE) {
            return;
        }
        entity.img = `systems/${PDFSettings.EXTERNAL_SYSTEM_NAME}/${PDFSettings.DIST_FOLDER}/assets/pdf_icon.svg`;
    }

    /**
     * Helper method to grab the id from the html object and return an item
     * @param html
     */
    private static getItemFromContext(html: JQuery<HTMLElement>): Item {
        const id = html.data('entity-id');
        return game.items.get(id);
    }

    /**
     * Get additional context menu icons for PDF items
     * @param html
     * @param options
     */
    public static getItemContextOptions(html, options: any[]) {
        PDFLog.verbose('Getting context options.');
        options.splice(0, 0, {
            name: game.i18n.localize('PDFOUNDRY.CONTEXT.OpenPDF'),
            icon: '<i class="far fa-file-pdf"></i>',
            condition: (entityHtml: JQuery<HTMLElement>) => {
                const item = PDFSettings.getItemFromContext(entityHtml);
                if (item.type !== PDFSettings.PDF_ENTITY_TYPE) {
                    return false;
                }

                const { url } = item.data.data;
                return url !== '';
            },
            callback: (entityHtml: JQuery<HTMLElement>) => {
                const item = PDFSettings.getItemFromContext(entityHtml);
                const { url, cache } = item.data.data;
                PDFoundryAPI.openURL(PDFoundryAPI.getAbsoluteURL(url), 1, cache);
            },
        });
    }

    public static injectCSS() {
        $('head').append(
            $(`<link href="systems/${PDFSettings.EXTERNAL_SYSTEM_NAME}/${PDFSettings.DIST_FOLDER}/bundle.css" rel="stylesheet" type="text/css" media="all">`),
        );
    }

    public static registerSettings() {
        // Has an individual user viewed the manual yet?
        game.settings.register(PDFSettings.INTERNAL_MODULE_NAME, 'help', {
            viewed: false,
            scope: 'user',
        });
    }

    public static onRenderSettings(settings: any, html: JQuery<HTMLElement>, data: any) {
        PDFLog.verbose('Rendering settings.');
        const icon = '<i class="far fa-file-pdf"></i>';
        const button = $(`<button>${icon} ${game.i18n.localize('PDFOUNDRY.SETTINGS.OpenHelp')}</button>`);
        button.on('click', PDFSettings.showHelp);

        html.find('h2').last().before(button);
    }

    public static async showHelp() {
        await game.settings.set(PDFSettings.INTERNAL_MODULE_NAME, 'help', {
            viewed: true,
        });

        return PDFoundryAPI.openURL(`${window.origin}/systems/${PDFSettings.EXTERNAL_SYSTEM_NAME}/${PDFSettings.DIST_FOLDER}/assets/PDFoundry Manual.pdf`);
    }
}
