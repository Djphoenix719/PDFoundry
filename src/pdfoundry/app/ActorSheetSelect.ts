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
import { PDFType } from '../common/types/PDFType';

/**
 * Callback type for sheet selection
 * @private
 */
export type PDFActorSheetSelectCallback = (sheet: string) => void;

export default class ActorSheetSelect extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = ['sheet'];
        options.template = `${Settings.PATH_TEMPLATES}/app/pdf-sheet-select.html`;
        options.width = 200;
        options.height = 'auto';
        options.title = game.i18n.localize('PDFOUNDRY.VIEWER.SelectSheet');
        return options;
    }

    private readonly _current?: string;
    private readonly _callback;

    constructor(currentValue: string | undefined, cb: PDFActorSheetSelectCallback, options?: ApplicationOptions) {
        super(options);

        this._current = currentValue;
        this._callback = cb;
    }

    getData(options?: any): any | Promise<any> {
        const data = super.getData(options);

        const sheets: Item[] = game.items.filter((item: Item) => {
            return item.data.data['type'] === PDFType.Actor && item.data.data.url !== '';
        });
        data['sheets'] = sheets.map((sheet) => {
            return {
                name: sheet.name,
                url: sheet.data.data.url,
                selected: sheet.data.data.url === this._current ? 'selected' : '',
            };
        });

        data.default = this._current;
        return data;
    }

    protected activateListeners(html: JQuery | HTMLElement): void {
        super.activateListeners(html);

        const button = $(html).find('#confirm');
        button.on('click', () => {
            const select = $(html).find('#sheet');
            const value = select.val();
            if (value !== this._current) {
                this._callback(value);
            }
            this.close();
        });
    }
}
