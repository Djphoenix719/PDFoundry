import { PDFManifest } from '../settings/PDFManifest';
import { PDFViewerWeb } from '../viewer/PDFViewerWeb';

/**
 * Acts as a controller for a PDFManifest
 */
export class PDFSettingsApp extends Application {
    private readonly _manifest: PDFManifest;

    constructor(manifest: PDFManifest, options?: ApplicationOptions) {
        super(options);

        this._manifest = manifest;
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = 'pdf-settings-app';
        options.classes = [];
        options.title = 'Edit PDF Locations';
        //TODO: Dynamic link this up.
        options.template = 'modules/pdfoundry/templates/settings/pdf-settings.html';
        options.width = 800;
        options.height = 'auto';
        options.resizable = true;
        return options;
    }

    async getData(options?: any): Promise<any> {
        const manifest = this._manifest;

        if (!manifest.isInitialized) {
            await manifest.register();
            manifest.pull();
        }

        let { pdfs, name } = manifest;

        pdfs.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });

        return { name, pdfs };
    }

    protected activateListeners(html: JQuery<HTMLElement>): void {
        super.activateListeners(html);

        const buttons = html.parents().find('button');
        buttons.on('click', function (event) {
            event.preventDefault();

            const row = $(this).parent().parent();
            const urlInput = row.find('input.pdf-url');
            const offsetInput = row.find('input.pdf-offset');

            let urlValue = urlInput.val();
            let offsetValue = offsetInput.val();

            if (urlValue === null || urlValue === undefined) return;
            if (offsetValue === null || offsetValue === undefined) return;

            urlValue = encodeURIComponent(urlValue.toString());
            urlValue = `${window.location.origin}/${urlValue}`;

            if (offsetValue.toString().trim() === '') {
                offsetValue = 0;
            }
            offsetValue = parseInt(offsetValue as string);

            new PDFViewerWeb(urlValue, 5 + offsetValue).render(true);
        });
    }

    async close(): Promise<void> {
        const rows = $(this.element).find('div.row');

        const manifest = this._manifest;

        for (let i = 0; i < rows.length; i++) {
            const row = $(rows[i]);

            const bookCode = row.find('span.pdf-code').html();
            const urlInput = row.find('input.pdf-url');
            const offsetInput = row.find('input.pdf-offset');

            const book = manifest.findByCode(bookCode);
            if (book === undefined) {
                //TODO: Standardize error handling.
                console.error(`PDFoundry Error: Unable to find book ${bookCode}`);
                continue;
            }

            let urlValue = urlInput.val();
            if (urlValue === null || urlValue === undefined) {
                urlValue = '';
            }
            urlValue = urlValue.toString().trim();

            let offsetValue = offsetInput.val();
            if (offsetValue === null || offsetValue === undefined || offsetValue === '') {
                offsetValue = '0';
            }
            offsetValue = parseInt(offsetValue as string);

            manifest.update(bookCode, {
                url: urlValue,
                offset: offsetValue,
            });
        }
        await manifest.push();

        return super.close();
    }
}
