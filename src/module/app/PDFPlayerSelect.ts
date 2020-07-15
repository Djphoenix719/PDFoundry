import { PDFUtil } from '../api/PDFUtil';
import { PDFSettings } from '../settings/PDFSettings';
import { PDFData } from '../api/types/PDFData';

export type PDFPlayerSelectCallback = (ids: []) => void;
export class PDFPlayerSelect extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = ['sheet', 'item'];
        options.template = `systems/${PDFSettings.EXTERNAL_SYSTEM_NAME}/${PDFSettings.DIST_FOLDER}/templates/app/pdf-player-select.html`;
        options.width = 'auto';
        options.height = 'auto';
        options.title = game.i18n.localize('PDFOUNDRY.VIEWER.SelectPlayers');
        return options;
    }

    private readonly ids;
    private readonly cb;

    constructor(ids: string[], cb: PDFPlayerSelectCallback, options?: ApplicationOptions) {
        super(options);

        this.ids = ids;
        this.cb = cb;
    }

    getData(options?: any): any | Promise<any> {
        const data = super.getData(options);

        const users: any[] = [];
        for (const id of this.ids) {
            users.push({
                name: game.users.get(id).name,
                id,
            });
        }

        users.sort((a, b) => a.name.localeCompare(b.name));

        data['users'] = users;
        return data;
    }

    protected activateListeners(html: JQuery<HTMLElement> | HTMLElement): void {
        super.activateListeners(html);

        const button = $(html).find('#confirm');
        button.on('click', () => {
            this.cb(this.collectIds(html));
            this.close();
        });
    }

    private collectIds(html: JQuery<HTMLElement> | HTMLElement): string[] {
        const ids: string[] = [];
        const checkboxes = $(html).find('input[type=checkbox]');
        for (let i = 0; i < checkboxes.length; i++) {
            const checkbox = $(checkboxes[i]);
            if (checkbox.prop('checked')) {
                ids.push(checkbox.prop('id'));
            }
        }
        return ids;
    }
}
