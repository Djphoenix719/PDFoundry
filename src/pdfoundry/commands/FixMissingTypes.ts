import { getPDFData, setPDFData } from '../Util';
import { PDFType } from '../common/types/PDFType';
import ChatCommand from './ChatCommand';

/**
 * Fixes missing types
 * @internal
 */
export default class FixMissingTypes extends ChatCommand {
    // <editor-fold desc="Getters & Setters">

    get CommandName(): string {
        return 'fix-missing-types';
    }

    // </editor-fold>

    // <editor-fold desc="Instance Methods">

    protected async run(args: string[]): Promise<void> {
        let fixedPDFs = 0;
        const journals = game.journal.filter((je: JournalEntry) => getPDFData(je) !== undefined && getPDFData(je)?.type === undefined) as JournalEntry[];
        for (const journalEntry of journals) {
            await setPDFData(journalEntry, {
                type: PDFType.Static,
            });
            fixedPDFs += 1;
        }

        // @ts-ignore
        ui.journal.render();

        if (fixedPDFs > 0) {
            ui.notifications.info(game.i18n.localize('PDFOUNDRY.COMMANDS.FixMissingTypesSuccess'));
        } else {
            ui.notifications.info(game.i18n.localize('PDFOUNDRY.COMMANDS.FixMissingTypesFailure'));
        }
    }

    // </editor-fold>
}
