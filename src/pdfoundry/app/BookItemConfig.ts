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

import Settings from '../settings/Settings';
import Api from '../Api';
import { getAbsoluteURL } from '../Util';
import BaseConfig from './BaseConfig';

/**
 * Extends the base ItemSheet for linked PDF viewing.
 * @private
 */
export class BookItemConfig extends BaseConfig {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = `systems/${Settings.DIST_PATH}/templates/sheet/pdf-book-item-sheet.html`;
        return options;
    }

    protected activateListeners(html: JQuery<HTMLElement>): void {
        super.activateListeners(html);

        const urlInput = html.find('#data-url');
        const offsetInput = html.find('#data-offset');

        // Test button
        html.find('#pdf-test').on('click', function (event) {
            event.preventDefault();

            let urlValue = urlInput.val();
            let offsetValue = offsetInput.val();

            if (urlValue === null || urlValue === undefined) return;
            if (offsetValue === null || offsetValue === undefined) return;

            urlValue = urlValue.toString();

            urlValue = getAbsoluteURL(urlValue);

            if (offsetValue.toString().trim() === '') {
                offsetValue = 0;
            }
            offsetValue = parseInt(offsetValue as string);

            Api.openURL(urlValue, 5 + offsetValue, false);
        });
    }
}
