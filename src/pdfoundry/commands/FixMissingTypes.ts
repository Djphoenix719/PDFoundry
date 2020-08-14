import { getPDFData, setPDFData } from '../Util';
import { PDFType } from '../common/types/PDFType';

/**
 * @internal
 */
export function fixMissingTypes() {
    return new Promise(async (resolve, reject) => {
        const nFixed = await run();
        if (nFixed > 0) {
            ui.notifications.info(`Fixed ${nFixed} PDFs missing type definitions.`);
        } else {
            ui.notifications.info(`No PDFs were found that had missing type definitions.`);
        }
        resolve();
    });
}

/**
 * @internal
 */
async function run() {
    let i = 0;
    const journals = game.journal.filter((je: JournalEntry) => getPDFData(je) !== undefined && getPDFData(je)?.type === undefined) as JournalEntry[];
    for (const journalEntry of journals) {
        await setPDFData(journalEntry, {
            type: PDFType.Static,
        });
        i += 1;
    }

    // @ts-ignore
    ui.journal.render();

    return i;
}
