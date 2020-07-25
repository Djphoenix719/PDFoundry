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

import { PDFBookData } from '../common/types/PDFBookData';
import BaseViewer from './BaseViewer';
import PlayerSelect from '../app/PlayerSelect';
import { getUserIdsExceptMe } from '../Util';
import SetViewEvent from '../socket/events/SetViewEvent';
import { PDFDataType } from '../common/types/PDFBaseData';

/**
 * The PDFoundry Viewer class provides the core logic opening PDFs and binding their events.
 * You cannot create a new instance of this class, you must do so with the API.
 *
 * See {@link Api.openPDF}, {@link Api.openPDFByCode}, {@link Api.openPDFByName}, {@link Api.openURL} which all return a
 * promise which resolve with an instance of this class.
 */
export default class StaticViewer extends BaseViewer {
    // <editor-fold desc="Properties">

    protected _pdfData: PDFBookData;

    // </editor-fold>

    // <editor-fold desc="Constructor & Initialization">

    constructor(pdfData?: PDFBookData, options?: ApplicationOptions) {
        super(options);

        if (pdfData === undefined) {
            pdfData = {
                name: game.i18n.localize('PDFOUNDRY.VIEWER.ViewPDF'),
                code: '',
                offset: 0,
                url: '',
                type: PDFDataType.Book,
                cache: false,
            };
        }

        this._pdfData = pdfData;
    }

    // </editor-fold>

    // <editor-fold desc="Getters & Setters">

    /**
     * Returns a copy of the PDFData this viewer is using.
     * Changes to this data will not reflect in the viewer.
     */
    public get pdfData() {
        return duplicate(this._pdfData);
    }

    public get title(): string {
        let title = this._pdfData.name;
        if (this._pdfData.code !== '') {
            title = `${title} (${this._pdfData.code})`;
        }
        return title;
    }

    // </editor-fold>

    // <editor-fold desc="Foundry Overrides">

    protected _getHeaderButtons(): any[] {
        const buttons = super._getHeaderButtons();

        buttons.unshift({
            class: 'pdf-sheet-show-players',
            icon: 'fas fa-eye',
            label: game.i18n.localize('PDFOUNDRY.VIEWER.ShowToPlayersText'),
            onclick: (event) => this.showTo(event),
        });

        return buttons;
    }

    // </editor-fold>

    // <editor-fold desc="Instance Methods">

    /**
     * Show the current page to GMs.
     */
    protected showTo(event: MouseEvent) {
        const pdfData = this.pdfData;
        pdfData.offset = 0;

        const ids = getUserIdsExceptMe();
        if (event.shiftKey) {
            new SetViewEvent(ids, pdfData, this.page).emit();
        } else {
            new PlayerSelect(ids, (filteredIds) => {
                new SetViewEvent(filteredIds, pdfData, this.page).emit();
            }).render(true);
        }
    }
    // </editor-fold>
}
