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

import { PDFViewer, PDFViewerOpenArgs } from '../viewer/PDFViewer';

export class PDFViewerApplication extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = ['app', 'window-app', 'pdfoundry-viewer'];
        options.template = `modules/pdfoundry/templates/viewer/default.html`;
        options.title = game.i18n.localize('PDFOUNDRY.VIEWER.ViewPDF');
        // TODO: Personal setting for default application size.
        options.width = 8.5 * 100 + 64;
        options.height = 11 * 100 + 64;
        options.resizable = true;
        return options;
    }

    protected _file: PDFJS.File | undefined;
    protected _options: Partial<PDFViewerOpenArgs> | undefined;

    constructor(file: PDFJS.File, pdfOptions?: Partial<PDFViewerOpenArgs>, applicationOptions?: Partial<Application.Options>) {
        super(applicationOptions);

        this._file = file;
        this._options = pdfOptions;
    }

    public async activateListeners(html: JQuery) {
        super.activateListeners(html);

        const viewer = new PDFViewer();
        await viewer.bind(html);

        if (this._file) {
            await viewer.open(this._file, this._options);
            // clear potentially large memory if byte data was passed
            if (this._file.hasOwnProperty('byteLength')) {
                delete this._file;
            }
        }
    }
}
