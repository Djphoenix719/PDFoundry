/*
 * Copyright 2021 Andrew Cuccinello
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
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
        const journals = game!.journal!.filter((je: JournalEntry) => getPDFData(je) !== undefined && getPDFData(je)?.type === undefined) as JournalEntry[];
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
