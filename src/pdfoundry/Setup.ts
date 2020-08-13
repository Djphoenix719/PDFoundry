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

import { getAbsoluteURL, getPDFData, isEntityPDF, purgeCache } from './Util';
import PreloadEvent from './socket/events/PreloadEvent';
import { Socket } from './socket/Socket';
import Settings from './Settings';
import PDFCache from './cache/PDFCache';
import Api from './Api';
import HTMLEnricher from './enricher/HTMLEnricher';
import TinyMCEPlugin from './enricher/TinyMCEPlugin';
import PDFActorSheetAdapter from './app/PDFActorSheetAdapter';
import { PDFType } from './common/types/PDFType';
import { PDFConfig } from './app/PDFConfig';
import { migrateLegacy } from './migrate/MigrateLegacy';

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

        // Setup tasks requiring that FVTT is loaded
        Hooks.once('ready', Setup.lateRun);

        Hooks.on('renderJournalDirectory', Setup.createJournalButton);
        Hooks.on('renderJournalDirectory', Setup.hookListItems);

        // getItemDirectoryEntryContext - Setup context menu for 'Open PDF' links
        Hooks.on('getJournalDirectoryEntryContext', Setup.getJournalContextOptions);

        // Cogwheel settings menu
        Hooks.on('renderSettings', Setup.onRenderSettings);
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
        Hooks.on('renderItemSheet', HTMLEnricher.HandleEnrich);
        Hooks.on('renderJournalSheet', HTMLEnricher.HandleEnrich);
        Hooks.on('renderActorSheet', HTMLEnricher.HandleEnrich);

        Hooks.on('chatMessage', Setup.onChatMessage);

        // Register TinyMCE drag + drop events
        TinyMCEPlugin.Register();

        return new Promise(async () => {
            // Initialize the settings
            Settings.initialize();
            await PDFCache.initialize();

            // PDFoundry is ready
            Setup.userLogin();
        });
    }

    /**
     * Register the PDF sheet and unregister invalid sheet types from it.
     */
    public static setupSheets() {
        // Register actor "sheet"
        Actors.registerSheet(Settings.MODULE_NAME, PDFActorSheetAdapter, { makeDefault: false });
    }

    /**
     * Get additional context menu icons for PDF items
     * @param html
     * @param options
     */
    public static getJournalContextOptions(html, options: any[]) {
        const getJournalEntryFromLi = (html: JQuery): JournalEntry => {
            const id = html.data('entity-id');
            return game.journal.get(id);
        };

        const shouldAdd = (entityHtml: JQuery) => {
            const journalEntry = getJournalEntryFromLi(entityHtml);
            return isEntityPDF(journalEntry) && getPDFData(journalEntry)?.type !== PDFType.Actor;
        };

        if (game.user.isGM) {
            options.unshift({
                name: game.i18n.localize('PDFOUNDRY.CONTEXT.PreloadPDF'),
                icon: '<i class="fas fa-download fa-fw"></i>',
                condition: shouldAdd,
                callback: (entityHtml: JQuery) => {
                    const journalEntry = getJournalEntryFromLi(entityHtml);
                    const pdf = getPDFData(journalEntry);

                    if (pdf === undefined) {
                        return;
                    }

                    const { url } = pdf;
                    const event = new PreloadEvent(null, getAbsoluteURL(url));
                    event.emit();

                    PDFCache.preload(url);
                },
            });
        }

        // options.unshift({
        //     name: game.i18n.localize('PDFOUNDRY.CONTEXT.OpenPDF'),
        //     icon: '<i class="far fa-file-pdf"></i>',
        //     condition: shouldAdd,
        //     callback: (entityHtml: JQuery) => {
        //         const journalEntry = getJournalEntryFromLi(entityHtml);
        //         const pdf = getPDFData(journalEntry);
        //
        //         if (pdf === undefined) {
        //             return;
        //         }
        //
        //         if (pdf.type === PDFType.Static) {
        //             Api.openPDF(pdf, 1);
        //         } else if (pdf.type === PDFType.Fillable) {
        //             Api.openFillablePDF(pdf, journalEntry);
        //         } else {
        //             throw new Error(`Unhandled PDF context type ${pdf.type}`);
        //         }
        //     },
        // });
    }

    private static userLogin() {
        let viewed;
        try {
            viewed = Settings.get(Settings.SETTINGS_KEY.HELP_SEEN);
        } catch (error) {
            viewed = false;
        } finally {
            if (!viewed) {
                Api.showHelp();
            }
        }
    }

    private static onChatMessage(app, content: string, options) {
        if (content === '/pdfoundry convert-items') {
            migrateLegacy();
            return false;
        }

        if (content === '/pdfoundry purge-cache') {
            purgeCache();
            return false;
        }
    }

    /**
     * Hook handler for rendering the settings tab
     */
    public static onRenderSettings(settings: any, html: JQuery, data: any) {
        const icon = '<i class="far fa-file-pdf"></i>';
        const button = $(`<button>${icon} ${game.i18n.localize('PDFOUNDRY.SETTINGS.OpenHelp')}</button>`);
        button.on('click', Api.showHelp);

        html.find('h2').last().before(button);
    }

    private static async createPDF() {
        const journalEntry = (await JournalEntry.create({
            name: game.i18n.localize('PDFOUNDRY.MISC.NewPDF'),
            [`flags.${Settings.MODULE_NAME}.${Settings.FLAGS_KEY.PDF_DATA}.type`]: PDFType.Static,
        })) as JournalEntry;

        new PDFConfig(journalEntry).render(true);
    }

    private static createJournalButton(app: Application, html: JQuery) {
        const button = $(`<button class="create-pdf"><i class="fas fa-file-pdf"></i> ${game.i18n.localize('PDFOUNDRY.MISC.CreatePDF')}</button>`);
        button.on('click', () => {
            Setup.createPDF();
        });

        let footer = html.find('.directory-footer');
        if (footer.length === 0) {
            footer = $(`<footer class="directory-footer"></footer>`);
            html.append(footer);
        }
        footer.append(button);
    }

    private static hookListItems(app: Application, html: JQuery) {
        const lis = html.find('li.journal');

        for (const li of lis) {
            const target = $(li);
            const id = target.data('entity-id');
            const journalEntry = game.journal.get(id);

            if (isEntityPDF(journalEntry)) {
                target.find('h4').on('click', (event) => {
                    event.stopImmediatePropagation();
                    Setup.onClickPDFName(journalEntry);
                });

                const pdfData = getPDFData(journalEntry);
                if (pdfData) {
                    const thumbnail = $(`<img class="pdf-thumbnail" src="${Settings.PATH_ASSETS}/pdf_icon.svg" alt="PDF Icon">`);
                    target.append(thumbnail);

                    switch (pdfData.type) {
                        case PDFType.Static:
                        case PDFType.Fillable:
                            target.find('img').on('click', (event) => {
                                event.stopImmediatePropagation();
                                Setup.onClickPDFThumbnail(journalEntry);
                            });
                            break;
                        case PDFType.Actor:
                            thumbnail.css('filter', 'grayscale(100%)');
                            break;
                    }
                }
            }
        }
    }

    private static onClickPDFName(journalEntry: JournalEntry) {
        new PDFConfig(journalEntry).render(true);
    }

    private static onClickPDFThumbnail(journalEntry: JournalEntry) {
        const pdfData = getPDFData(journalEntry);
        if (pdfData) {
            switch (pdfData.type) {
                case PDFType.Static:
                    Api.openPDF(pdfData);
                    break;
                case PDFType.Fillable:
                    Api.openPDF(pdfData, {
                        page: 1,
                        entity: journalEntry,
                    });
                    break;
                case PDFType.Actor:
                    // Pass - no functionality
                    break;
            }
        }
    }
}
