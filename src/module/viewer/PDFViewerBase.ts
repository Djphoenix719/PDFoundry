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

import { PDFCache } from '../cache/PDFCache';

export class PDFViewerBase extends Application {
    protected _frame: HTMLIFrameElement;

    public get app() {
        // @ts-ignore
        return this._frame.contentWindow.PDFViewerApplication;
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = 'pdf-viewer';
        options.classes = ['app', 'window-app'];
        options.title = 'View PDF';
        options.width = 8.5 * 100 + 64;
        options.height = 11 * 100 + 64;
        options.resizable = true;
        return options;
    }

    protected async activateListeners(html: JQuery<HTMLElement>): Promise<void> {
        super.activateListeners(html);

        this._frame = html.parents().find('iframe.pdfViewer').first().get(0) as HTMLIFrameElement;

        // @ts-ignore
        window.viewer = this;
    }

    /**
     * Attempt to safely cleanup PDFjs to avoid memory leaks.
     */
    protected cleanup(): void {
        if (this._frame && this._frame.contentWindow) {
            const window = this._frame.contentWindow;
            // @ts-ignore
            window.PDFViewerApplication.cleanup();
        }
    }

    close(): Promise<any> {
        this.cleanup();
        return super.close();
    }
}
