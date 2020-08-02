import Settings from '../settings/Settings';

export default class PDFActorDataBrowser extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;

        options.template = `systems/${Settings.DIST_PATH}/templates/app/pdf-actor-data-browser.html`;
        options.width = 600;
        options.height = 400;

        return options;
    }

    private actor: Actor;
    private timeout: any;

    constructor(actor: Actor, options?: ApplicationOptions) {
        super(options);
        this.actor = actor;
    }

    get title(): string {
        return `Data Paths for ${this.actor.name}`;
    }

    getData(options?: any): any {
        const data = super.getData(options);

        data['paths'] = [];
        const flattened = flattenObject({ data: this.actor.data.data });
        for (const [k, v] of Object.entries(flattened)) {
            if (Array.isArray(v)) {
                data['paths'].push({
                    key: k,
                    value: `$$UNSUPPORTED TYPE: Array$$`,
                });
            } else if (typeof v === 'object') {
                data['paths'].push({
                    key: k,
                    value: `$$EMPTY OBJECT$$`,
                });
            } else {
                data['paths'].push({
                    key: k,
                    value: v,
                });
            }
        }
        data['paths'].sort();

        return data;
    }

    render(force?: boolean, options?: RenderOptions): Application {
        this.timeout = setTimeout(this.render.bind(this), 1000);
        return super.render(force, options);
    }

    close(): Promise<any> {
        clearTimeout(this.timeout);
        return super.close();
    }
}
