/*
 * Copyright 2022 Andrew Cuccinello
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
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

import { MODULE_NAME } from '../Constants';
import { PDFProxyConstructorArgs, PDFProxyStatic } from '../viewer/PDFProxyStatic';
import { PDFProxyInteractive } from '../viewer/PDFProxyInteractive';
import { NullDataStore } from '../store/NullDataStore';

/**
 * A no-fuss PDF viewer application which can open an arbitrary PDF to a specified page.
 */
export class PDFViewerApplication extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = ['app', 'window-app', 'pdfoundry-viewer'];
        options.template = `modules/${MODULE_NAME}/templates/viewer/default.html`;
        options.title = game.i18n.localize('PDFOUNDRY.VIEWER.ViewPDF');
        options.width = 8.5 * 100 + 64;
        options.height = 11 * 100 + 64;
        options.resizable = true;
        return options;
    }

    protected _file: PDFJS.File | undefined;
    protected _pdfOptions: Partial<PDFProxyConstructorArgs> | undefined;
    protected _viewer: PDFProxyStatic | undefined;

    constructor(file: PDFJS.File, pdfOptions: Partial<PDFProxyConstructorArgs> = {}, applicationOptions: Partial<Application.Options> = {}) {
        super(applicationOptions);

        this._file = file;
        this._pdfOptions = pdfOptions;
    }

    public async activateListeners(html: JQuery) {
        super.activateListeners(html);

        if (this._pdfOptions && this._pdfOptions.renderInteractiveForms) {
            if (this._pdfOptions.dataStore === undefined) {
                this._pdfOptions.dataStore = new NullDataStore();
            }
            this._viewer = new PDFProxyInteractive(this._pdfOptions.dataStore, this._pdfOptions);
        } else {
            this._viewer = new PDFProxyStatic(this._pdfOptions);
        }

        const success = await this._viewer.bind(html);

        if (success && this._file) {
            await this._viewer.open(this._file, this._pdfOptions);
            // Clear potentially large memory if byte data was passed
            if (this._file.hasOwnProperty('byteLength')) {
                delete this._file;
            }
        }
    }

    public async close(options?: Application.CloseOptions): Promise<void> {
        await this._viewer?.close();
        return super.close();
    }
}
