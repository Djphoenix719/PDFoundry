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

import { getAbsoluteURL, getPDFData, isEntityPDF } from './Util';
import PreloadEvent from './socket/events/PreloadEvent';
import { Socket } from './socket/Socket';
import Settings from './Settings';
import PDFCache from './cache/PDFCache';
import Api, { ViewerTheme } from './Api';
import HTMLEnricher from './enricher/HTMLEnricher';
import TinyMCEPlugin from './enricher/TinyMCEPlugin';
import PDFActorSheetAdapter from './app/PDFActorSheetAdapter';
import { PDFType } from './common/types/PDFType';
import { PDFConfig } from './app/PDFConfig';
import FixMissingTypes from './commands/FixMissingTypes';
import PurgeCache from './commands/PurgeCache';
import { legacyMigrationRequired, migrateLegacy } from './migrate/MigrateLegacy';

/**
 * A collection of methods used for setting up the API & system state.
 * @internal
 */
export default class Setup {
    /**
     * Run setup tasks.
     */
    public static run() {
        if (hasProperty(ui, 'PDFoundry')) {
            Hooks.once('init', async () => {
                let d = new Dialog({
                    title: 'PDFoundry: Error',
                    content: [
                        '<div style="text-align: justify; margin: 0; padding: 0;">',
                        '<h1 style="color: red">PDFoundry Is Already Installed</h1>',
                        '<p style="font-weight: bold">You have enabled the module version of PDFoundry, but the system you ' +
                            'are using already has PDFoundry installed.</p>',
                        '<p>1. If you installed PDFoundry using a nightly build, uninstall and reinstall your system with the ' +
                            '"Game Systems" menu in Foundry VTT setup, or simply update the system if an update is available. ' +
                            'Your world data is safe either way.</p>',
                        '<p>2. If the system you are using comes with PDFoundry already installed - you must use that version of ' +
                            'PDFoundry by disabling the module version.</p>',
                        '<p style="font-weight: bold">The module version of PDFoundry will not function.</p>',
                        '</div>',
                    ].join(''),
                    buttons: {},
                });
                d.render(true);
            });
            return;
        }

        // Register the PDFoundry APi on the UI
        ui['PDFoundry'] = Api;

        // Register the PDF sheet with the class picker
        Setup.setupSheets();

        // Setup tasks requiring that FVTT is loaded
        Hooks.once('ready', Setup.lateRun);

        Hooks.on('renderJournalDirectory', Setup.createJournalButton);
        Hooks.on('renderJournalDirectory', Setup.hookListItems);

        // getItemDirectoryEntryContext - Setup context menu for 'Open PDF' links
        Hooks.on('getJournalDirectoryEntryContext', Setup.getJournalContextOptions);

        // Cogwheel settings menu
        Hooks.on('renderSettings', Setup.onRenderSettings);

        // Load base themes
        Setup.registerThemes();

        // Patch the TextEnricher with a proxy
        HTMLEnricher.patchEnrich();
        // Bind click handlers to renderers
        Hooks.on('renderApplication', (app: Application, html: JQuery) => HTMLEnricher.bindRichTextLinks(html));
        Hooks.on('renderItemSheet', (app: Application, html: JQuery) => HTMLEnricher.bindRichTextLinks(html));
        Hooks.on('renderActorSheet', (app: Application, html: JQuery) => HTMLEnricher.bindRichTextLinks(html));
        Hooks.on('renderChatMessage', (app: Application, html: JQuery) => HTMLEnricher.bindRichTextLinks(html));
    }

    private static readonly COMMANDS = [new FixMissingTypes(), new PurgeCache()];

    /**
     * Late setup tasks happen when the system is loaded
     */
    public static lateRun() {
        // Register socket event handlers
        Socket.initialize();

        // Chat command processing
        Hooks.on('chatMessage', Setup.onChatMessage);

        // Canvas notes processing
        Hooks.on('renderNoteConfig', Setup.onNoteConfig);
        Hooks.on('hoverNote', Setup.onNoteHover);

        // Register TinyMCE drag + drop events
        TinyMCEPlugin.Register();

        return new Promise(async () => {
            // Initialize the settings
            Settings.initialize();
            await PDFCache.initialize();

            if (legacyMigrationRequired()) {
                migrateLegacy().then(() => {
                    Settings.set(Settings.SETTINGS_KEY.DATA_VERSION, 'v0.6.0');
                });
            }

            // PDFoundry is ready
            Setup.userLogin();
        });
    }

    /**
     * Register the PDF sheet and unregister invalid sheet types from it.
     */
    public static setupSheets() {
        // Register actor "sheet"
        Actors.registerSheet(Settings.MODULE_NAME, PDFActorSheetAdapter);
    }

    /**
     * Get additional context menu icons for PDF items
     * @param html
     * @param options
     */
    public static getJournalContextOptions(html: JQuery, options: any[]) {
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

        options.unshift({
            name: game.i18n.localize('PDFOUNDRY.CONTEXT.OpenPDF'),
            icon: '<i class="far fa-file-pdf"></i>',
            condition: shouldAdd,
            callback: (entityHtml: JQuery) => {
                const journalEntry = getJournalEntryFromLi(entityHtml);
                const pdf = getPDFData(journalEntry);

                if (pdf === undefined) {
                    return;
                }

                if (pdf.type === PDFType.Actor) {
                    throw new Error(`Unhandled PDF context type ${pdf.type}`);
                } else {
                    Api.openPDF(pdf, {
                        entity: journalEntry,
                    });
                }
            },
        });
    }

    private static userLogin() {
        if (!game.user.isGM) {
            return;
        }

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
        content = content.toLocaleLowerCase();

        for (let command of Setup.COMMANDS) {
            if (command.execute(content)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Hook handler for rendering the settings tab
     */
    public static onRenderSettings(settings: any, html: JQuery, data: any) {
        const icon = '<i class="far fa-file-pdf"></i>';
        const button = $(`<button>${icon} ${game.i18n.localize('PDFOUNDRY.SETTINGS.OpenHelp')}</button>`);
        button.on('click', Api.showHelp);

        html.find('#settings-documentation').append(button);
    }

    private static async createPDF() {
        const journalEntry = (await JournalEntry.create({
            name: game.i18n.localize('PDFOUNDRY.MISC.NewPDF'),
            [`flags.${Settings.MODULE_NAME}.${Settings.FLAGS_KEY.PDF_DATA}.type`]: PDFType.Static,
        })) as JournalEntry;

        new PDFConfig(journalEntry).render(true);
    }

    private static createJournalButton(app: Application, html: JQuery) {
        if (!game.user.isGM) {
            return;
        }

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
                    // @ts-ignore
                    if (journalEntry.isOwner) {
                        Setup.onClickPDFName(journalEntry);
                    } else {
                        Setup.onClickPDFThumbnail(journalEntry);
                    }
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
                            // Actors can't be opened by link
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
                        entity: journalEntry,
                    });
                    break;
                case PDFType.Actor:
                    // Pass - no functionality
                    break;
            }
        }
    }

    private static onNoteConfig(app: NoteConfig, html: JQuery, data: any) {
        const journalId = data.data.entryId;
        const journal = game.journal.get(journalId);
        if (isEntityPDF(journal)) {
            const container = $(`<div class="form-group"></div>`);
            const label = $(`<label>${game.i18n.localize('PDFOUNDRY.COMMON.PageNumber')}</label>`);

            let pageNumber = data.data['flags']?.[Settings.MODULE_NAME]?.[Settings.FLAGS_KEY.PAGE_NUMBER];
            if (pageNumber === undefined) {
                pageNumber = '';
            }

            const subContainer = $(`<div class="form-fields"></div>`);

            const input = $(
                `<input type="number" name="flags.${Settings.MODULE_NAME}.${Settings.FLAGS_KEY.PAGE_NUMBER}" value="${pageNumber}" data-dtype="String">`,
            );

            subContainer.append(input);

            container.append(label);
            container.append(subContainer);

            html.find('button[type=submit]').before(container);
        }
    }

    private static onNoteHover(note: Note, enter: boolean) {
        if (!enter) {
            return;
        }

        const journal = note.entry as JournalEntry;
        const pdf = getPDFData(journal);
        if (isEntityPDF(journal) && pdf) {
            note.mouseInteractionManager.callbacks['clickLeft2'] = () => {
                let pageText: string | number | undefined = note.data.flags?.[Settings.MODULE_NAME]?.[Settings.FLAGS_KEY.PAGE_NUMBER];
                let pageNumber = 0;

                if (typeof pageText === 'string') {
                    try {
                        pageNumber = parseInt(pageText);
                    } catch (e) {
                        pageNumber = 0;
                    }
                } else if (typeof pageText === 'number') {
                    pageNumber = pageText;
                }

                if (pageNumber === 0) {
                    Api.openPDF(pdf);
                } else {
                    Api.openPDF(pdf, {
                        page: pageNumber,
                    });
                }
            };
        }
    }

    private static registerThemes() {
        const themes: ViewerTheme[] = [
            {
                id: 'fantasy',
                name: 'Fantasy (Default)',
                filePath: `${Settings.PATH_MODULE}/themes/fantasy.css`,
            },
            {
                id: 'dark',
                name: 'Dark',
                filePath: `${Settings.PATH_MODULE}/themes/default-dark.css`,
            },
            {
                id: 'light',
                name: 'Light',
                filePath: `${Settings.PATH_MODULE}/themes/default-light.css`,
            },
            {
                id: 'net-runner-dark',
                name: 'Net Runner',
                filePath: `${Settings.PATH_MODULE}/themes/net-runner.css`,
            },

            {
                id: 'gay-pride-light',
                name: 'Gay Pride (Light)',
                filePath: `${Settings.PATH_MODULE}/themes/gay-pride-light.css`,
            },
            {
                id: 'gay-pride-dark',
                name: 'Gay Pride (Dark)',
                filePath: `${Settings.PATH_MODULE}/themes/gay-pride-dark.css`,
            },
            {
                id: 'trans-light',
                name: 'Trans Pride (Light)',
                filePath: `${Settings.PATH_MODULE}/themes/trans-pride-light.css`,
            },
            {
                id: 'trans-dark',
                name: 'Trans Pride (Dark)',
                filePath: `${Settings.PATH_MODULE}/themes/trans-pride-dark.css`,
            },
            {
                id: 'nonbinary-light',
                name: 'Non-binary Pride (Light)',
                filePath: `${Settings.PATH_MODULE}/themes/nonbinary-pride-light.css`,
            },
            {
                id: 'nonbinary-dark',
                name: 'Non-binary Pride (Dark)',
                filePath: `${Settings.PATH_MODULE}/themes/nonbinary-pride-dark.css`,
            },
        ];

        for (const theme of themes) {
            Api.registerTheme(theme.id, theme.name, theme.filePath);
        }
    }
}
