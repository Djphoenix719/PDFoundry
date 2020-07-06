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
import { PDFCache } from '../cache/PDFCache';
import { PDFLog } from '../log/PDFLog';

export type PDFDownloadFinishedHandler = (bytes: Uint8Array) => void;

export class PDFViewer extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = 'pdf-viewer';
        options.classes = ['app', 'window-app'];
        options.template = `systems/${PDFSettings.EXTERNAL_SYSTEM_NAME}/pdfoundry-dist/templates/app/pdf-viewer.html`;
        options.title = 'View PDF';
        options.width = 8.5 * 100 + 64;
        options.height = 11 * 100 + 64;
        options.resizable = true;
        return options;
    }

    protected _frame: HTMLIFrameElement;
    protected _viewer: PDFjsViewer;

    public get ready() {
        return this._viewer !== undefined;
    }

    //TODO: How should this be structured? Is it easier to throw if state is not good?
    //TODO: I lean towards yes for now - having to await *every* method call will be annoying.
    public async getPage(): Promise<number> {
        const viewer = await this.getViewer();
        return viewer.page;
    }

    public async setPage(value: number): Promise<void> {
        const viewer = await this.getViewer();
        viewer.page = value;
    }

    /**
     * Get the internal PDFjs viewer. Will resolve with the viewer
     *  object once PDFjs is done loading and is usable.
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

    protected async activateListeners(html: JQuery<HTMLElement>): Promise<void> {
        super.activateListeners(html);

        this._frame = html.parent().find('iframe.pdfViewer').get(0) as HTMLIFrameElement;
        this.getViewer().then((viewer) => {
            this._viewer = viewer;
        });
    }

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

    getData(options?: any): any | Promise<any> {
        const data = super.getData(options);
        data.systemName = PDFSettings.EXTERNAL_SYSTEM_NAME;
        return data;
    }

    public async open(pdfSource: string | Uint8Array, page?: number) {
        const viewer = await this.getViewer();
        if (page) {
            viewer.initialBookmark = `page=${page}`;
        }

        if (typeof pdfSource === 'string') {
            await viewer.open(pdfSource);
        } else {
            await viewer.open(pdfSource);
        }
    }

    /**
     * Attempt to safely cleanup PDFjs to avoid memory leaks.
     */
    protected async cleanup(): Promise<void> {
        if (this._frame && this._frame.contentWindow) {
            this._viewer.cleanup();
        }
    }

    async close(): Promise<any> {
        //TODO: Wait for render before cleanup
        await this.cleanup();
        return super.close();
    }
}
