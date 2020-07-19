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

export type PDFPlayerSelectCallback = (ids: []) => void;

/**
 * An application that allows selection of players.
 */
export default class PlayerSelect extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = ['sheet', 'item'];
        options.template = `systems/${Settings.DIST_PATH}/templates/app/pdf-player-select.html`;
        options.width = 'auto';
        options.height = 'auto';
        options.title = game.i18n.localize('PDFOUNDRY.VIEWER.SelectPlayers');
        return options;
    }

    private readonly _ids;
    private readonly _callback;

    constructor(ids: string[], cb: PDFPlayerSelectCallback, options?: ApplicationOptions) {
        super(options);

        this._ids = ids;
        this._callback = cb;
    }

    getData(options?: any): any | Promise<any> {
        const data = super.getData(options);

        const users: any[] = [];
        for (const id of this._ids) {
            users.push({
                name: game.users.get(id).name,
                id,
            });
        }

        users.sort((a, b) => a.name.localeCompare(b.name));

        data['users'] = users;
        return data;
    }

    protected activateListeners(html: JQuery<HTMLElement> | HTMLElement): void {
        super.activateListeners(html);

        const button = $(html).find('#confirm');
        button.on('click', () => {
            this._callback(this.collectIds());
            this.close();
        });
    }

    /**
     * Collect selected ids from the html
     */
    private collectIds(): string[] {
        const ids: string[] = [];
        const checkboxes = $(this.element).find('input[type=checkbox]');
        for (let i = 0; i < checkboxes.length; i++) {
            const checkbox = $(checkboxes[i]);
            if (checkbox.prop('checked')) {
                ids.push(checkbox.prop('id'));
            }
        }
        return ids;
    }
}