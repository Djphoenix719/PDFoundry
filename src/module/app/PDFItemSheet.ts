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
import { PDFoundryAPI } from '../api/PDFoundryAPI';
import { PDFLog } from '../log/PDFLog';

/**
 * Extends the base ItemSheet for linked PDF viewing.
 * @private
 */
export class PDFItemSheet extends ItemSheet {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = ['sheet', 'item'];
        options.width = 650;
        options.height = 'auto';
        return options;
    }

    get template() {
        return `systems/${PDFSettings.EXTERNAL_SYSTEM_NAME}/${PDFSettings.DIST_FOLDER}/templates/sheet/pdf-sheet.html`;
    }

    /**
     * Helper method to get a id in the html form
     * html ids are prepended with the id of the item to preserve uniqueness
     *  which is mandatory to allow multiple forms to be open
     * @param html
     * @param id
     */
    private _getByID(html: JQuery<HTMLElement>, id: string): JQuery<HTMLElement> {
        return html.parent().parent().find(`#${this.item._id}-${id}`);
    }

    protected _getHeaderButtons(): any[] {
        const buttons = super._getHeaderButtons();
        buttons.unshift({
            class: 'pdf-sheet-manual',
            icon: 'fas fa-question-circle',
            label: 'Help',
            onclick: () => PDFSettings.showHelp(),
        });
        //TODO: Standardize this to function w/ the Viewer one
        buttons.unshift({
            class: 'pdf-sheet-github',
            icon: 'fas fa-external-link-alt',
            label: 'PDFoundry',
            onclick: () => window.open('https://github.com/Djphoenix719/PDFoundry', '_blank'),
        });
        return buttons;
    }

    protected activateListeners(html: JQuery<HTMLElement>): void {
        super.activateListeners(html);

        const urlInput = this._getByID(html, 'data\\.url');
        const offsetInput = this._getByID(html, 'data\\.offset');

        // Block enter from displaying the PDF
        html.find('input').on('keypress', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
            }
        });

        // Test button
        this._getByID(html, 'pdf-test').on('click', function (event) {
            event.preventDefault();

            let urlValue = urlInput.val();
            let offsetValue = offsetInput.val();

            if (urlValue === null || urlValue === undefined) return;
            if (offsetValue === null || offsetValue === undefined) return;

            urlValue = `${window.location.origin}/${urlValue}`;

            if (offsetValue.toString().trim() === '') {
                offsetValue = 0;
            }
            offsetValue = parseInt(offsetValue as string);

            PDFoundryAPI.openURL(urlValue, 5 + offsetValue, false);
        });

        // Browse button
        this._getByID(html, 'pdf-browse').on('click', async function (event) {
            event.preventDefault();

            const fp = new FilePicker({});
            // @ts-ignore TODO: foundry-pc-types
            fp.extensions = ['.pdf'];
            fp.field = urlInput[0];

            let urlValue = urlInput.val();
            if (urlValue !== undefined) {
                await fp.browse(urlValue.toString().trim());
            }

            fp.render(true);
        });
    }
}
