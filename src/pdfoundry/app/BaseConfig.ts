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

import { BUTTON_GITHUB, BUTTON_HELP } from '../common/helpers/header';

export default abstract class BaseConfig extends ItemSheet {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = ['sheet', 'item', 'pdf-item-app'];
        options.width = 650;
        options.height = 'auto';
        return options;
    }

    protected _getHeaderButtons(): any[] {
        const buttons = super._getHeaderButtons();
        buttons.unshift(BUTTON_HELP);
        buttons.unshift(BUTTON_GITHUB);
        return buttons;
    }

    protected activateListeners(html: JQuery<HTMLElement>): void {
        super.activateListeners(html);

        const urlInput = html.find('#data-url');

        // Block enter from displaying the PDF
        html.find('input').on('keypress', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
            }
        });

        // Browse button
        html.find('#pdf-browse').on('click', async function (event) {
            event.preventDefault();

            const picker = new FilePicker({});
            // @ts-ignore TODO: foundry-pc-types
            picker.extensions = ['.pdf'];
            picker.field = urlInput[0];

            let urlValue = urlInput.val();
            if (urlValue !== undefined) {
                await picker.browse(urlValue.toString().trim());
            }

            picker.render(true);
        });
    }
}
