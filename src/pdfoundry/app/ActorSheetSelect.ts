import Settings from '../settings/Settings';
import { PDFDataType } from '../common/types/PDFDataType';

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

    private readonly _current?: string;
    private readonly _callback;

    constructor(currentValue: string | undefined, cb: PDFActorSheetSelectCallback, options?: ApplicationOptions) {
        super(options);

        this._current = currentValue;
        this._callback = cb;
    }

    getData(options?: any): any | Promise<any> {
        const data = super.getData(options);

        const sheets: Item[] = game.items.filter((item: Item) => {
            return item.data.data['pdf_type'] === PDFDataType.ActorLinkPDF && item.data.data.url !== '';
        });
        data['sheets'] = sheets.map((sheet) => {
            return {
                name: sheet.name,
                url: sheet.data.data.url,
                selected: sheet.data.data.url === this._current ? 'selected' : '',
            };
        });

        data.default = this._current;
        return data;
    }

    protected activateListeners(html: JQuery<HTMLElement> | HTMLElement): void {
        super.activateListeners(html);

        const button = $(html).find('#confirm');
        button.on('click', () => {
            const select = $(html).find('#sheet');
            const value = select.val();
            if (value !== this._current) {
                this._callback(value);
            }
            this.close();
        });
    }
}
