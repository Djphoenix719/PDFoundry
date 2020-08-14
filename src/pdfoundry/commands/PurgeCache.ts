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
