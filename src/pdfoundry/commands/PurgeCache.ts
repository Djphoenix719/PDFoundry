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

import ChatCommand from './ChatCommand';
import PDFCache from '../cache/PDFCache';

export default class PurgeCache extends ChatCommand {
    // <editor-fold desc="Getters & Setters">

    public get CommandName(): string {
        return 'purge-cache';
    }

    // </editor-fold>

    // <editor-fold desc="Instance Methods">

    protected async run(args: string[]): Promise<void> {
        await PDFCache.clear();

        ui.notifications.info(game.i18n.localize('PDFOUNDRY.COMMANDS.PurgeCacheSuccess'));
    }

    // </editor-fold>
}
