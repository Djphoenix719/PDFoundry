import Settings from '../settings/Settings';
import { PDFDataType } from '../common/types/PDFBaseData';

/**
 * Callback type for sheet selection
 * @private
 */
export type PDFActorSheetSelectCallback = (sheet: string) => void;

export default class ActorSheetSelect extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = ['sheet'];
        options.template = `systems/${Settings.DIST_PATH}/templates/app/pdf-sheet-select.html`;
        options.width = 200;
        options.height = 'auto';
        options.title = game.i18n.localize('PDFOUNDRY.VIEWER.SelectSheet');
        return options;
    }

    private readonly _default;
    private readonly _callback;

    constructor(defaultValue: string, cb: PDFActorSheetSelectCallback, options?: ApplicationOptions) {
        super(options);

        this._default = defaultValue;
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
                selected: sheet.data.data.url === this._default ? 'selected' : '',
            };
        });

        data.default = this._default;
        return data;
    }

    protected activateListeners(html: JQuery<HTMLElement> | HTMLElement): void {
        super.activateListeners(html);

        const button = $(html).find('#confirm');
        button.on('click', () => {
            this._callback($(html).find('#sheet').val());
            this.close();
        });
    }
}
