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

import Settings from '../Settings';
import ActorSheetSelect from '../app/ActorSheetSelect';
import { getAbsoluteURL, getPDFData } from '../Util';
import PDFActorSheetAdapter from '../app/PDFActorSheetAdapter';
import FillableViewer from './FillableViewer';
import { PDFData } from '../common/types/PDFData';
import PDFActorDataBrowser from '../app/PDFActorDataBrowser';

/**
 * The FillableViewer class provides an interface for displaying, serializing, and observing form-fillable PDFs,
 *  all while connecting their data to a specific actor. Extends the Fillable Viewer.
 * @module API
 */
export default class ActorViewer extends FillableViewer {
    // <editor-fold desc="Static Properties"></editor-fold>
    // <editor-fold desc="Static Methods"></editor-fold>

    // <editor-fold desc="Properties">
    protected document: Actor;
    protected actorSheet: PDFActorSheetAdapter;
    // </editor-fold>

    // <editor-fold desc="Constructor & Initialization">
    constructor(actor: Actor, pdfData: PDFData, sheet: PDFActorSheetAdapter, options?: Application.Options) {
        super(actor, pdfData, options);

        this.document = actor;
        this.actorSheet = sheet;
    }
    // </editor-fold>

    // <editor-fold desc="Getters & Setters">

    get title(): string {
        return this.document.name;
    }

    /**
     * Get the URL for the current sheet from the actor flags.
     */
    public getSheetId(): string | undefined {
        return this.document.getFlag(Settings.MODULE_NAME, Settings.FLAGS_KEY.SHEET_ID);
    }

    /**
     * Save the URL for the current sheet to the actor flags.
     * @param value
     */
    public async setSheetId(value: string | undefined) {
        if (typeof value === 'string') {
            return this.document.setFlag(Settings.MODULE_NAME, Settings.FLAGS_KEY.SHEET_ID, value);
        } else {
            return this.document.unsetFlag(Settings.MODULE_NAME, Settings.FLAGS_KEY.SHEET_ID);
        }
    }

    /**
     * Get pdf data for the currently set PDF sheet id
     */
    public getSheetPdf(): PDFData | undefined {
        const id = this.getSheetId();
        if (id === undefined) return undefined;

        return getPDFData(game.journal.get(id));
    }

    protected _getHeaderButtons(): any[] {
        const buttons: any[] = [];

        buttons.unshift({
            label: 'Close',
            class: 'close',
            icon: 'fas fa-times',
            // actor sheet is responsible for our clean up
            onclick: (ev) => this.actorSheet.close(),
        });

        // @ts-ignore
        const canConfigure = game.user.isGM || (this.document.owner && game.user.can('TOKEN_CONFIGURE'));
        if (this.options['editable'] && canConfigure) {
            buttons.unshift({
                // @ts-ignore TODO 0.8.x
                label: this.token ? 'Token' : 'Prototype Token',
                class: 'configure-token',
                icon: 'fas fa-user-circle',
                // @ts-ignore TODO 0.8.x
                onclick: (ev) => this.actorSheet._onConfigureToken(ev),
            });

            buttons.unshift({
                label: 'Sheet',
                class: 'configure-sheet',
                icon: 'fas fa-cog',
                // @ts-ignore TODO 0.8.x
                onclick: (ev) => this.actorSheet._onConfigureSheet(ev),
            });

            buttons.unshift({
                class: 'pdf-sheet-select',
                icon: 'fas fa-user-cog',
                label: game.i18n.localize('PDFOUNDRY.VIEWER.SelectSheet'),
                onclick: () => {
                    const current = this.getSheetId();
                    new ActorSheetSelect(async (id) => {
                        await this.setSheetId(id);
                        await this.actorSheet.close();
                        const sheet = this.getSheetPdf();

                        if (!sheet) {
                            await this.setSheetId(undefined);
                        }

                        await this.actorSheet.render(true);
                    }, current).render(true);
                },
            });

            if (game.user.isGM) {
                buttons.unshift({
                    class: 'pdf-browse-data',
                    icon: 'fas fa-search',
                    label: game.i18n.localize('PDFOUNDRY.VIEWER.InspectData'),
                    onclick: () => {
                        new PDFActorDataBrowser(this.document).render(true);
                    },
                });
            }
        }

        return buttons;
    }

    // </editor-fold>

    // <editor-fold desc="Instance Methods">

    protected async onViewerReady(): Promise<void> {
        super.onViewerReady();
        const sheet = this.getSheetPdf();
        if (sheet) {
            const url = getAbsoluteURL(sheet.url);
            await this.open(url);
        }
    }

    async open(pdfSource: string | Uint8Array, page?: number): Promise<void> {
        if (pdfSource instanceof Uint8Array) {
            throw new Error('Actor Sheets must be opened by ID');
        }

        try {
            await super.open(pdfSource, page);
        } catch (error) {
            // @ts-ignore TODO: THIS IS SUPER FUCKING HACK AND THE WHOLE FLOW NEEDS TO BE ANALYZED
            if (!(await srcExists(pdfSource))) {
                ui.notifications.error(game.i18n.localize('PDFOUNDRY.ERROR.FileNotFound'));
                await this.setSheetId(undefined);
            }

            await this.actorSheet.close();
            new PDFActorSheetAdapter(this.document, this.options).render(true);
        }
    }

    // </editor-fold>
}
