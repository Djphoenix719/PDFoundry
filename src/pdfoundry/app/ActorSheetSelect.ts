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

import { PDFType } from '../common/types/PDFType';
import SelectApp, { SelectOption } from './SelectApp';
import { getPDFData, isEntityPDF } from '../Util';

/**
 * Selects an actor sheet in a pop up window.
 * @internal
 */
export default class ActorSheetSelect extends SelectApp {
    protected get selectTitle(): string {
        return 'PDFOUNDRY.VIEWER.SelectSheet';
    }

    protected get selectId(): string {
        return 'actor-sheet';
    }

    protected get selectLabel(): string {
        return 'PDFOUNDRY.VIEWER.SelectSheet';
    }

    protected get selectOptions(): SelectOption[] {
        const journals: JournalEntry[] = game.journal.filter((entry: JournalEntry) => {
            return isEntityPDF(entry) && getPDFData(entry)?.type === PDFType.Actor;
        });

        return journals.map((entry) => {
            return {
                text: entry.data.name,
                value: entry.id,
            };
        });
    }
}
