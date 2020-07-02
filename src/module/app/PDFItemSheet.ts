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
/**
 * Extends the base ItemSheet for linked PDF viewing.
 */
export class PDFSourceSheet extends ItemSheet {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = ['sheet', 'item'];
        options.width = 650;
        options.height = 'auto';
        return options;
    }

    get template() {
        return `systems/${PDFSettings.EXTERNAL_SYSTEM_NAME}/${PDFSettings.DIST_FOLDER}/templates/pdf-sheet.html`;
    }

    /**
     * Helper method to get a id in the html form
     * html ids are prepended with the id of the item to preserve uniqueness
     *  which is mandatory to allow multiple forms to be open
     * @param html
     * @param id
     */
    private getByID(html: JQuery<HTMLElement>, id: string) {
        return html.parent().parent().find(`#${this.item._id}-${id}`);
    }

    protected activateListeners(html: JQuery<HTMLElement>): void {
        super.activateListeners(html);

        this.addGithubLink(html);

        const urlInput = this.getByID(html, 'data\\.url');
        const offsetInput = this.getByID(html, 'data\\.offset');

        // Block enter from displaying the PDF
        html.find('input').on('keypress', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
            }
        });

        console.log(this.getByID(html, 'pdf-test'));

        // Test button
        this.getByID(html, 'pdf-test').on('click', function (event) {
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

            PDFoundryAPI.openURL(urlValue, 5 + offsetValue);
        });

        // Browse button
        this.getByID(html, 'pdf-browse').on('click', async function (event) {
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

    protected addGithubLink(html: JQuery<HTMLElement>) {
        const h4 = html.parent().parent().find('header.window-header h4.window-title');
        const next = h4.next()[0].childNodes[1].textContent;
        if (next && next.trim() === 'PDFoundry') {
            return;
        }

        const url = 'https://github.com/Djphoenix719/PDFoundry';
        const style = 'text-decoration: none';
        const icon = '<i class="fas fa-external-link-alt"></i>';
        const link = $(`<a style="${style}" href="${url}">${icon} PDFoundry</a>`);

        h4.after(link);
    }
}
