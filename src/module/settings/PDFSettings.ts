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

import { PDFItemSheet } from '../app/PDFItemSheet';
import { PDFoundryAPI } from '../api/PDFoundryAPI';
import { PDFLog } from '../log/PDFLog';
import { PDFCache } from '../cache/PDFCache';
import { PDFUtil } from '../api/PDFUtil';
import { PDFPreloadEvent } from '../socket/events/PDFPreloadEvent';
import { PDFData } from '../types/PDFData';

/**
 * Internal settings and helper methods for PDFoundry.
 */
export class PDFSettings {
    /**
     * Are feedback notifications enabled? Disable if you wish
     *  to handle them yourself.
     */
    public static NOTIFICATIONS: boolean = true;

    public static DIST_FOLDER: string = 'pdfoundry-dist';
    public static EXTERNAL_SYSTEM_NAME: string = '../modules/pdfoundry';
    public static INTERNAL_MODULE_NAME: string = 'pdfoundry';
    public static PDF_ENTITY_TYPE: string = 'PDFoundry_PDF';

    public static HELP_SEEN_KEY: string = 'HelpSeen';

    public static get SOCKET_NAME() {
        return `system.${PDFSettings.EXTERNAL_SYSTEM_NAME}`;
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

    //TODO: This shouldn't be in settings.
    /**
     * Get additional context menu icons for PDF items
     * @param html
     * @param options
     */
    public static getItemContextOptions(html, options: any[]) {
        PDFLog.verbose('Getting context options.');

        if (game.user.isGM) {
            options.unshift({
                name: game.i18n.localize('PDFOUNDRY.CONTEXT.PreloadPDF'),
                icon: '<i class="fas fa-download fa-fw"></i>',
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
                const item = PDFSettings.getItemFromContext(entityHtml);
                if (item.type !== PDFSettings.PDF_ENTITY_TYPE) {
                    return false;
                }

                const { url } = item.data.data;
                return url !== '';
            },
            callback: (entityHtml: JQuery<HTMLElement>) => {
                const item = PDFSettings.getItemFromContext(entityHtml);
                const pdf = PDFUtil.getPDFDataFromItem(item);

                if (pdf === null) {
                    //TODO: Error handling
                    return;
                }

                PDFoundryAPI.openPDF(pdf, 1);
            },
        });
    }

    public static registerSettings() {
        PDFCache.registerSettings();
    }

    public static onRenderSettings(settings: any, html: JQuery<HTMLElement>, data: any) {
        PDFLog.verbose('Rendering settings.');
        const icon = '<i class="far fa-file-pdf"></i>';
        const button = $(`<button>${icon} ${game.i18n.localize('PDFOUNDRY.SETTINGS.OpenHelp')}</button>`);
        button.on('click', PDFSettings.showHelp);

        html.find('h2').last().before(button);
    }

    //TODO: Move out of settings
    public static async showHelp() {
        await game.user.setFlag(PDFSettings.INTERNAL_MODULE_NAME, PDFSettings.HELP_SEEN_KEY, true);

        const lang = game.i18n.lang;
        let manualPath = `${window.origin}/systems/${PDFSettings.EXTERNAL_SYSTEM_NAME}/${PDFSettings.DIST_FOLDER}/assets/manual/${lang}/manual.pdf`;
        const manualExists = await PDFUtil.fileExists(manualPath);

        if (!manualExists) {
            manualPath = `${window.origin}/systems/${PDFSettings.EXTERNAL_SYSTEM_NAME}/${PDFSettings.DIST_FOLDER}/assets/manual/en/manual.pdf`;
        }

        const pdfData: PDFData = {
            name: game.i18n.localize('PDFOUNDRY.MANUAL.Name'),
            code: '',
            offset: 0,
            url: manualPath,
            cache: false,
        };

        return PDFoundryAPI.openPDF(pdfData);
    }
}
