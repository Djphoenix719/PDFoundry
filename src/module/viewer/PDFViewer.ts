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
import { PDFjsViewer } from '../api/PDFjsViewer';
import { PDFData } from '../api/PDFData';
import { PDFEvents } from '../events/PDFEvents';

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
    protected _pdfData: PDFData;

    constructor(pdfData?: PDFData, options?: ApplicationOptions) {
        super(options);

        if (pdfData === undefined) {
            pdfData = {
                name: game.i18n.localize('PDFOUNDRY.VIEWER.ViewPDF'),
                code: '',
                offset: 0,
                url: '',
                cache: false,
            };
        }

        this._pdfData = pdfData;
    }

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
        this.getViewer().then((viewer) => {
            this._viewer = viewer;
            // Fire the viewerReady event so the viewer may be used externally
            PDFEvents.fire('viewerReady', this);
        });
    }

    async close(): Promise<any> {
        PDFEvents.fire('viewerClose', this);
        return super.close();
    }

    // </editor-fold>

    /**
     * Wait for the internal PDFjs viewer to be ready and usable.
     */
    private getViewer(): Promise<any> {
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
