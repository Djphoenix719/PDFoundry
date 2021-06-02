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

import Settings from '../Settings';
import Api from '../Api';
import { getAbsoluteURL, getPDFData } from '../Util';
import { PDFType } from '../common/types/PDFType';
import { BUTTON_GITHUB, BUTTON_HELP, BUTTON_KOFI } from '../common/helpers/header';

/**
 * Extends the base ItemSheet for linked PDF viewing.
 * @private
 */
export class PDFConfig extends FormApplication {
    // <editor-fold desc="Static Properties">

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = [...options.classes!, Settings.CSS_CLASS];
        options.template = `${Settings.PATH_TEMPLATES}/sheet/pdf-config.html`;
        options.width = 650;
        options.height = 'auto';
        return options;
    }

    // </editor-fold>
    // <editor-fold desc="Static Methods"></editor-fold>
    // <editor-fold desc="Properties">

    public readonly object: JournalEntry;
    private picker: FilePicker;

    // </editor-fold>
    // <editor-fold desc="Constructor & Initialization">

    constructor(journalEntry: JournalEntry, options?: Application.Options) {
        super(journalEntry, options);
    }

    // </editor-fold>
    // <editor-fold desc="Getters & Setters">

    public get title(): string {
        return this.object.name;
    }

    public get id(): string {
        return `pdf-${this.object.id}`;
    }

    protected _getHeaderButtons(): any[] {
        const buttons = super._getHeaderButtons();
        buttons.unshift(BUTTON_GITHUB);
        buttons.unshift(BUTTON_KOFI);
        buttons.unshift(BUTTON_HELP);
        return buttons;
    }

    get isEditable(): boolean {
        // @ts-ignore TODO: 0.8.x compat
        return this.object.testUserPermission(game.user, CONST.ENTITY_PERMISSIONS.OWNER);
    }

    // </editor-fold>
    // <editor-fold desc="Instance Methods">

    protected activateListeners(html: JQuery): void {
        super.activateListeners(html);

        const urlInput = html.find('#data-url');
        const offsetInput = html.find('#data-offset');

        // Default behavior opens the file picker in this form setup, override
        html.find('input').on('keypress', (event) => {
            if (event.key === 'Enter') {
                this._onSubmit(event, { preventClose: true });
            }
        });
        html.find('input, select').on('input', (event) => {
            this._onSubmit(event, { preventClose: true });
        });

        // Browse button
        html.find('#pdf-browse').on('click', async (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();

            this.picker =
                this.picker ??
                new FilePicker({
                    // @ts-ignore TODO
                    callback: () => {
                        this._onSubmit(new Event('input'), { preventClose: true });
                    },
                });

            // @ts-ignore TODO: Foundry Types
            this.picker.extensions = ['.pdf'];
            this.picker.field = urlInput[0];

            if (!this.filepickers.includes(this.picker)) {
                this.filepickers.push(this.picker);
            }

            let urlValue = urlInput.val();
            if (urlValue !== undefined) {
                await this.picker.browse(urlValue.toString().trim());
            }

            this.picker.render(true);
        });

        // Test pdf settings button
        html.find('#pdf-test').on('click', (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();

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

    public getData(): object {
        const data = super.getData();

        data['types'] = Object.entries(PDFType).map(([key]) => {
            return {
                value: PDFType[key],
                text: `PDFOUNDRY.MISC.PDFTYPE.${key}`,
            };
        });

        data['dataPath'] = `flags.${Settings.MODULE_NAME}.${Settings.FLAGS_KEY.PDF_DATA}`;
        data['flags'] = getPDFData(this.object);
        data['name'] = this.object.data.name;

        return data;
    }

    protected async _updateObject(event: Event | JQuery.Event, formData: any): Promise<void> {
        await this.object.update(formData);
    }

    // @ts-ignore TODO
    submit({ updateData }: { updateData?: any }): FormApplication {
        // @ts-ignore TODO
        return super.submit({ updateData });
    }

    // </editor-fold>
}
