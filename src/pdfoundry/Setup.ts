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

import { getAbsoluteURL, getPDFDataFromItem } from './Util';
import { PDFItemSheet } from './app/PDFItemSheet';
import PreloadEvent from './socket/events/PreloadEvent';
import { Socket } from './socket/Socket';
import Settings from './settings/Settings';
import PDFCache from './cache/PDFCache';
import I18n from './settings/I18n';
import Api from './Api';
import HTMLEnricher from './HTMLEnricher';

/**
 * A collection of methods used for setting up the API & system state.
 * @private
 */
export default class Setup {
    /**
     * Run setup tasks.
     */
    public static run() {
        // Register the PDFoundry APi on the UI
        ui['PDFoundry'] = Api;

        // Register system & css synchronously
        Setup.registerSystem();
        Setup.injectStyles();

        // Setup tasks requiring FVTT is loaded
        Hooks.once('ready', Setup.lateRun);
    }

    /**
     * Late setup tasks happen when the system is loaded
     */
    public static lateRun() {
        // Register the PDF sheet with the class picker
        Setup.setupSheets();
        // Register socket event handlers
        Socket.initialize();

        // Bind always-run event handlers
        // Enrich Journal & Item Sheet rich text links
        Hooks.on('renderItemSheet', HTMLEnricher.Handler);
        Hooks.on('renderJournalSheet', HTMLEnricher.Handler);

        return new Promise(async () => {
            // Initialize the settings
            await Settings.initialize();
            await PDFCache.initialize();
            await I18n.initialize();

            // PDFoundry is ready
            Setup.userLogin();
        });
    }

    /**
     * Inject the CSS file into the header, so it doesn't have to be referenced in the system.json
     */
    public static injectStyles() {
        const head = $('head');
        const link = `<link href="systems/${Settings.DIST_PATH}/bundle.css" rel="stylesheet" type="text/css" media="all">`;
        head.append($(link));
    }

    /**
     * Pulls the system name from the script tags.
     */
    public static registerSystem() {
        const scripts = $('script');
        for (let i = 0; i < scripts.length; i++) {
            const script = scripts.get(i) as HTMLScriptElement;
            const folders = script.src.split('/');
            const distIdx = folders.indexOf(Settings.DIST_NAME);
            if (distIdx === -1) continue;

            if (folders[distIdx - 1] === 'pdfoundry') break;

            Settings.EXTERNAL_SYSTEM_NAME = folders[distIdx - 1];
            break;
        }
    }

    /**
     * Register the PDF sheet and unregister invalid sheet types from it.
     */
    public static setupSheets() {
        Items.registerSheet(Settings.INTERNAL_MODULE_NAME, PDFItemSheet, {
            types: [Settings.PDF_ENTITY_TYPE],
            makeDefault: true,
        });

        // Unregister all other item sheets for the PDF entity
        const pdfoundryKey = `${Settings.INTERNAL_MODULE_NAME}.${PDFItemSheet.name}`;
        const sheets = CONFIG.Item.sheetClasses[Settings.PDF_ENTITY_TYPE];
        for (const key of Object.keys(sheets)) {
            const sheet = sheets[key];
            // keep the PDFoundry sheet
            if (sheet.id === pdfoundryKey) {
                continue;
            }

            // id is MODULE.CLASS_NAME
            const [module] = sheet.id.split('.');
            Items.unregisterSheet(module, sheet.cls, {
                types: [Settings.PDF_ENTITY_TYPE],
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
                    if (item.type !== Settings.PDF_ENTITY_TYPE) {
                        return false;
                    }

                    const { url } = item.data.data;
                    return url !== '';
                },
                callback: (entityHtml: JQuery<HTMLElement>) => {
                    const item = getItemFromContext(entityHtml);
                    const pdf = getPDFDataFromItem(item);

                    if (pdf === null) {
                        //TODO: Error handling
                        return;
                    }

                    const { url } = pdf;
                    const event = new PreloadEvent(null, getAbsoluteURL(url));
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
                if (item.type !== Settings.PDF_ENTITY_TYPE) {
                    return false;
                }

                const { url } = item.data.data;
                return url !== '';
            },
            callback: (entityHtml: JQuery<HTMLElement>) => {
                const item = getItemFromContext(entityHtml);
                const pdf = getPDFDataFromItem(item);

                if (pdf === null) {
                    //TODO: Error handling
                    return;
                }

                Api.openPDF(pdf, 1);
            },
        });
    }

    private static userLogin() {
        let viewed;
        try {
            viewed = game.user.getFlag(Settings.EXTERNAL_SYSTEM_NAME, Settings.SETTING_KEY.HELP_SEEN);
        } catch (error) {
            viewed = false;
        } finally {
            if (!viewed) {
                Api.showHelp();
            }
        }
    }

    /**
     * Hook handler for default data for a PDF
     */
    public static async preCreateItem(entity, ...args) {
        if (entity.type !== Settings.PDF_ENTITY_TYPE) {
            return;
        }
        entity.img = `systems/${Settings.DIST_PATH}/assets/pdf_icon.svg`;
    }

    /**
     * Hook handler for rendering the settings tab
     */
    public static onRenderSettings(settings: any, html: JQuery<HTMLElement>, data: any) {
        const icon = '<i class="far fa-file-pdf"></i>';
        const button = $(`<button>${icon} ${game.i18n.localize('PDFOUNDRY.SETTINGS.OpenHelp')}</button>`);
        button.on('click', Api.showHelp);

        html.find('h2').last().before(button);
    }
}

// <editor-fold desc="Persistent Hooks">

// preCreateItem - Setup default values for a new PDFoundry_PDF
Hooks.on('preCreateItem', Setup.preCreateItem);
// getItemDirectoryEntryContext - Setup context menu for 'Open PDF' links
Hooks.on('getItemDirectoryEntryContext', Setup.getItemContextOptions);
// renderSettings - Inject a 'Open Manual' button into help section
Hooks.on('renderSettings', Setup.onRenderSettings);
