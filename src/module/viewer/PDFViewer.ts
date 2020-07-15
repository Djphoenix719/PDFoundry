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
import { PDFEvents } from '../api/PDFEvents';
import { PDFData } from '../api/types/PDFData';
import { PDFjsViewer } from '../types/PDFjsViewer';
import { PDFSetViewEvent } from '../socket/events/PDFSetViewEvent';
import { PDFUtil } from '../api/PDFUtil';
import { PDFjsEventBus } from '../types/PDFjsEventBus';
import { PDFPlayerSelect } from '../app/PDFPlayerSelect';

export class PDFViewer extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = ['app', 'window-app', 'pdfoundry-viewer'];
        options.template = `systems/${PDFSettings.EXTERNAL_SYSTEM_NAME}/pdfoundry-dist/templates/app/pdf-viewer.html`;
        options.title = game.i18n.localize('PDFOUNDRY.VIEWER.ViewPDF');
        options.width = 8.5 * 100 + 64;
        options.height = 11 * 100 + 64;
        options.resizable = true;
        return options;
    }

    protected _frame: HTMLIFrameElement;
    protected _viewer: PDFjsViewer;
    protected _eventBus: PDFjsEventBus;
    protected _pdfData: PDFData;

    constructor(pdfData?: PDFData, options?: ApplicationOptions) {
        super(options);

        if (pdfData === undefined) {
            pdfData = {
                name: game.i18n.localize('PDFOUNDRY.VIEWER.Title'),
                code: '',
                offset: 0,
                url: '',
                cache: false,
            };
        }

        this._pdfData = pdfData;
    }

    // <editor-fold desc="Getters & Setters">

    /**
     * Returns a copy of the PDFData this viewer is using.
     * Changes to this data will not reflect in the viewer.
     */
    public get pdfData() {
        return duplicate(this._pdfData);
    }

    public get page() {
        return this._viewer.page;
    }

    public set page(value: number) {
        this._viewer.page = value;
    }

    // </editor-fold>

    // <editor-fold desc="Foundry Overrides">

    get title(): string {
        let title = this._pdfData.name;
        if (this._pdfData.code !== '') {
            title = `${title} (${this._pdfData.code})`;
        }
        return title;
    }

    protected _getHeaderButtons(): any[] {
        const buttons = super._getHeaderButtons();
        //TODO: Standardize this to function w/ the Item sheet one
        buttons.unshift({
            class: 'pdf-sheet-github',
            icon: 'fas fa-external-link-alt',
            label: 'PDFoundry',
            onclick: () => window.open('https://github.com/Djphoenix719/PDFoundry', '_blank'),
        });

        buttons.unshift({
            class: 'pdf-sheet-show-players',
            icon: 'fas fa-eye',
            label: game.i18n.localize('PDFOUNDRY.VIEWER.ShowToPlayersText'),
            onclick: (event) => this.showTo(event),
        });

        return buttons;
    }

    getData(options?: any): any | Promise<any> {
        const data = super.getData(options);
        data.systemName = PDFSettings.EXTERNAL_SYSTEM_NAME;
        return data;
    }

    protected async activateListeners(html: JQuery<HTMLElement>): Promise<void> {
        super.activateListeners(html);

        this._frame = html.parent().find('iframe.pdfViewer').get(0) as HTMLIFrameElement;
        this.getViewer().then(async (viewer) => {
            this._viewer = viewer;

            this.getEventBus().then((eventBus) => {
                this._eventBus = eventBus;

                // const listeners = eventBus._listeners;
                // for (const eventName of Object.keys(listeners)) {
                //     eventBus.on(eventName, (...args) => {
                //         this.logEvent(eventName, args);
                //     });
                // }

                // Fire the viewerReady event so the viewer may be used externally
                PDFEvents.fire('viewerReady', this);
            });
        });

        // _getHeaderButtons does not permit titles...
        $(html).parents().parents().find('.pdf-sheet-show-players').prop('title', game.i18n.localize('PDFOUNDRY.VIEWER.ShowToPlayersTitle'));
    }

    // private logEvent(key: string, ...args) {
    //     console.debug(key);
    //     console.debug(args);
    // }

    async close(): Promise<any> {
        PDFEvents.fire('viewerClose', this);
        return super.close();
    }

    // </editor-fold>

    /**
     * Show the current page to GMs.
     */
    private showTo(event: MouseEvent) {
        const pdfData = this.pdfData;
        pdfData.offset = 0;

        // @ts-ignore
        const ids = PDFUtil.getUserIdsExceptMe();
        if (event.shiftKey) {
            new PDFSetViewEvent(ids, pdfData, this.page).emit();
        } else {
            new PDFPlayerSelect(ids, (filteredIds) => {
                new PDFSetViewEvent(filteredIds, pdfData, this.page).emit();
            }).render(true);
        }
    }

    /**
     * Wait for the internal PDFjs viewer to be ready and usable.
     */
    private getViewer(): Promise<PDFjsViewer> {
        if (this._viewer) {
            return Promise.resolve(this._viewer);
        }

        return new Promise<any>((resolve, reject) => {
            let timeout;
            const returnOrWait = () => {
                // If our window has finished initializing...
                if (this._frame) {
                    // If PDFjs has finished initializing...
                    if (this._frame.contentWindow && this._frame.contentWindow['PDFViewerApplication']) {
                        const viewer = this._frame.contentWindow['PDFViewerApplication'];
                        resolve(viewer);
                        return;
                    }
                }

                // If any ifs fall through, try again in a few ms
                timeout = setTimeout(returnOrWait, 5);
            };
            returnOrWait();
        });
    }

    /**
     * Wait for the internal PDFjs eventBus to be ready and usable.
     */
    private getEventBus(): Promise<PDFjsEventBus> {
        if (this._eventBus) {
            return Promise.resolve(this._eventBus);
        }

        return new Promise<any>((resolve, reject) => {
            this.getViewer().then((viewer) => {
                let timeout;
                const returnOrWait = () => {
                    if (viewer.eventBus) {
                        resolve(viewer.eventBus);
                        return;
                    }
                    timeout = setTimeout(returnOrWait, 5);
                };
                returnOrWait();
            });
        });
    }

    /**
     * Finish the download and return the byte array for the file.
     */
    public download(): Promise<Uint8Array> {
        return new Promise<Uint8Array>(async (resolve, reject) => {
            const viewer = await this.getViewer();
            let timeout;
            const returnOrWait = () => {
                if (viewer.downloadComplete) {
                    resolve(viewer.pdfDocument.getData());
                    return;
                }

                timeout = setTimeout(returnOrWait, 50);
            };
            returnOrWait();
        });
    }

    public async open(pdfSource: string | Uint8Array, page?: number) {
        const pdfjsViewer = await this.getViewer();

        if (page) {
            pdfjsViewer.initialBookmark = `page=${page}`;
        }

        await pdfjsViewer.open(pdfSource);
    }
}
