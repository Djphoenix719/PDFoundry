import Settings from '../Settings';

export type SelectAppCallback = (value: string, text: string) => void;

export interface SelectOption {
    text: string;
    value: string;
}

export default abstract class SelectApp extends Application {
    // <editor-fold desc="Static Properties">

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = [...options.classes!, Settings.CSS_CLASS];
        options.template = `${Settings.PATH_TEMPLATES}/app/select-app.html`;
        options.width = 200;
        options.height = 'auto';
        return options;
    }

    // </editor-fold>
    // <editor-fold desc="Static Methods"></editor-fold>
    // <editor-fold desc="Properties">

    private readonly _current?: string;
    private readonly _callback?: SelectAppCallback;

    // </editor-fold>
    // <editor-fold desc="Constructor & Initialization">

    constructor(callback?: SelectAppCallback, currentValue?: string, options?: ApplicationOptions) {
        super(options);

        this._current = currentValue;
        this._callback = callback;
    }

    // </editor-fold>
    // <editor-fold desc="Getters & Setters">

    public get title(): string {
        return game.i18n.localize(this.selectTitle);
    }

    public get id(): string {
        return this.unique ? this.selectId : super.id;
    }

    /**
     * Should duplicate of this app be allowed
     * @protected
     */
    protected get unique(): boolean {
        return true;
    }

    /**
     * The localization string to be used in the header for the title
     * @protected
     */
    protected abstract get selectTitle(): string;

    /**
     * The localization string to be used in the body to label the select
     * @protected
     */
    protected abstract get selectLabel(): string;

    /**
     * The id of the select, to preserve uniqueness. Used for app id if not
     *  unique, and select id attribute for global finds.
     * @protected
     */
    protected abstract get selectId(): string;

    /**
     * Array of options that will be used for the select options
     * @protected
     */
    protected abstract get selectOptions(): SelectOption[];

    // </editor-fold>
    // <editor-fold desc="Instance Methods">

    getData(options?: any): any | Promise<any> {
        const data = super.getData(options);

        data.data = {
            id: this.selectId,
            label: this.selectLabel,
            selected: this._current,
            options: this.selectOptions,
        };

        return data;
    }

    protected activateListeners(html: JQuery): void {
        super.activateListeners(html);

        const button = html.find(`button#${this.selectId}-confirm`);
        button.on('click', async (event) => {
            event.preventDefault();
            const select = html.find(`#${this.selectId}`) as JQuery<HTMLSelectElement>;
            const value = select.val() as string;
            if (value !== this._current && this._callback !== undefined) {
                this._callback(value, select.find('option:selected').text());
            }
            await this.close();
        });
    }

    // </editor-fold>
}
