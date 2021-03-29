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

import { PDFData } from '../common/types/PDFData';
import { PDFType } from '../common/types/PDFType';
import { setPDFData } from '../Util';
import Settings from '../Settings';

/**
 * Should this migration run
 * @internal
 */
export function legacyMigrationRequired(): boolean {
    if (Settings.get(Settings.SETTINGS_KEY.DATA_VERSION) === 'undefined') {
        if (game.items.find((i: Item) => i.data.type === 'PDFoundry_PDF') !== null) {
            return true;
        } else {
            Settings.set(Settings.SETTINGS_KEY.DATA_VERSION, 'v0.6.0');
            return false;
        }
    } else {
        return false;
    }
}

/**
 * Open the migration window for migration
 * @internal
 */
export function migrateLegacy(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        let d = new Dialog({
            title: 'PDFoundry: Migration Required',
            content: [
                '<h1>Migration Required</h1>',
                '<p>PDFoundry must convert legacy items to the new Journal format; You will not be able to use PDFoundry until you do.</p>',
                '<p>If you wish to backup your world - just in case - you may do so now.</p>',
                '<p>Please note folder structure will not be preserved.</p>',
            ].join(''),
            buttons: {
                proceed: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Migrate Now',
                    callback: () => {
                        convert()
                            .then(() => resolve())
                            .catch(() => reject());
                    },
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Remind Me Later',
                    callback: () => resolve(),
                },
            },
            default: 'cancel',
        });
        d.render(true);
    });
}

/**
 * Run the conversion
 * @internal
 */
async function convert() {
    const items = game.items.filter((i: Item) => i.data.type === 'PDFoundry_PDF') as Item[];
    for (const item of items) {
        let pdfData = getLegacyData(item);
        // @ts-ignore
        const permission = item.data.permission;
        const journalEntry = (await JournalEntry.create({
            name: pdfData.name,
            permission,
        })) as JournalEntry;
        // @ts-ignore
        delete pdfData.name;

        await setPDFData(journalEntry, pdfData);
        await item.delete({});
    }

    // @ts-ignore
    ui.journal.render();
}

/**
 * Get legacy PDF data & type
 * @param item
 * @internal
 */
function getLegacyData(item: Item): PDFData {
    const typeMap = {
        PDFoundry_PDF: PDFType.Static,
        PDFoundry_FillablePDF: PDFType.Fillable,
        PDFoundry_FillableActor: PDFType.Actor,
    };
    // @ts-ignore
    let type = typeMap[item.data.data.pdf_type] ?? PDFType.Static;
    return {
        name: item.data.name,
        // @ts-ignore
        url: item.data.data.url,
        // @ts-ignore
        code: item.data.data.code,
        // @ts-ignore
        offset: item.data.data.offset,
        // @ts-ignore
        cache: item.data.data.cache,
        type,
    };
}
