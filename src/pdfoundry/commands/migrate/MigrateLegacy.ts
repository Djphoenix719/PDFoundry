import { PDFData } from '../../common/types/PDFData';
import { PDFType } from '../../common/types/PDFType';
import { setPDFData } from '../../Util';

/**
 * Open the migration window for migration
 * @internal
 */
export function migrateLegacy(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        let d = new Dialog({
            title: 'Convert Legacy PDFoundry Items',
            content:
                '<p>This will convert legacy PDFoundry items to the new journals format <b>and delete the existing items</b>. ' +
                'Note folder structure will not be preserved.<br><br><b>Backup your world now if you have not done so already.</b></p>',
            buttons: {
                proceed: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Proceed',
                    callback: () => {
                        convert()
                            .then(() => resolve())
                            .catch(() => reject());
                    },
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: 'Cancel',
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
        const journalEntry = (await JournalEntry.create({
            name: pdfData.name,
        })) as JournalEntry;
        delete pdfData.name;

        await setPDFData(journalEntry, pdfData);
        await item.delete();
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
    let type = typeMap[item.data.data.pdf_type] ?? PDFType.Static;
    return {
        name: item.data.name,
        url: item.data.data.url,
        code: item.data.data.code,
        offset: item.data.data.offset,
        cache: item.data.data.cache,
        type,
    };
}
