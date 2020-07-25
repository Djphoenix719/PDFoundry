import Settings from '../settings/Settings';
import { PDFPlayerSelectCallback } from './PlayerSelect';
import { PDFDataType } from '../common/types/PDFBaseData';

export default class ActorSheetSelect extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = ['sheet'];
        options.template = `systems/${Settings.DIST_PATH}/templates/app/pdf-sheet-select.html`;
        options.width = 'auto';
        options.height = 'auto';
        options.title = game.i18n.localize('PDFOUNDRY.VIEWER.SelectSheet');
        return options;
    }

    private readonly _callback;

    constructor(cb: PDFPlayerSelectCallback, options?: ApplicationOptions) {
        super(options);

        this._callback = cb;
    }

    getData(options?: any): any | Promise<any> {
        const data = super.getData(options);

        const sheets: Item[] = game.items.filter((item: Item) => {
            return item.type === PDFDataType.Actor && item.data.data.url !== '';
        });
        data['sheets'] = sheets.map((sheet) => {
            return {
                name: sheet.name,
                url: sheet.data.data.url,
            };
        });
        return data;
    }

    protected activateListeners(html: JQuery<HTMLElement> | HTMLElement): void {
        super.activateListeners(html);

        const button = $(html).find('#confirm');
        button.on('click', () => {
            console.warn('closing');
            this.close();
        });
    }
}
