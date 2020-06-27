import { PdfManifest } from '../settings/PdfManifest';
import { PDFSettings, PDFSettingsError } from '../settings';
import { PdfViewerWeb } from '../viewer/pdf-viewer-web';

/**
 * Acts as a controller for a PDFManifest
 */
export class PdfSettingsApp extends FormApplication {
    private static readonly URL: string = 'url';
    private static readonly OFFSET: string = 'offset';

    private static _manifest: PdfManifest;
    private static _module: string;
    private static _open: boolean;

    public static set manifest(value: PdfManifest) {
        if (this._open) {
            throw new PDFSettingsError('Cannot set manifest while editor is open.');
        }

        PdfSettingsApp._manifest = value;
    }
    public static set module(value: string) {
        if (this._open) {
            throw new PDFSettingsError('Cannot set module while editor is open.');
        }

        PdfSettingsApp._module = value;
    }

    /**
     * Get a settings key
     * @param book
     * @param name
     */
    private static getSettingKey(book: string, name: string) {
        return `${PDFSettings.ROOT_MODULE_NAME}/${book}/${name}`;
    }

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = 'pdf-settings-app';
        options.classes = [];
        options.title = 'Edit PDF Locations';
        options.template = 'modules/pdfoundry/templates/settings/pdf-settings.html';
        options.width = 800;
        options.height = 'auto';
        return options;
    }

    async getData(options?: any): Promise<any> {
        const manifest = PdfSettingsApp._manifest;

        console.info('Trying to get data from manifest...');
        console.info(manifest);

        if (!manifest.isInitialized) {
            await manifest.fetch();
        }

        let { pdfs, name } = manifest;

        pdfs.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });

        return {
            name,
            pdfs,
        };
    }

    protected activateListeners(html: JQuery<HTMLElement>): void {
        super.activateListeners(html);

        //TODO: Settings is loading localhost urls for some reason...
        const buttons = html.parents().find('div.pdf-settings-flexrow button');
        buttons.on('click', function (event) {
            event.preventDefault();

            const row = $(this).parent().parent();
            const urlInput = row.find('span.pdf-url input');
            const offsetInput = row.find('span.pdf-offset input');

            let urlValue = urlInput.val();
            let offsetValue = offsetInput.val();

            if (urlValue === null || urlValue === undefined) return;
            if (offsetValue === null || offsetValue === undefined) return;

            urlValue = encodeURIComponent(urlValue.toString());
            urlValue = `${window.location.origin}/${urlValue}`;

            offsetValue = parseInt(offsetValue as string);

            new PdfViewerWeb(urlValue, 5 + offsetValue).render(true);
        });
    }

    async close(): Promise<void> {
        const rows = $(this.element).find('.pdf-settings-flexwrap div.pdf-settings-flexrow');

        const manifest = PdfSettingsApp._manifest;

        for (let i = 0; i < rows.length; i++) {
            const row = $(rows[i]);

            const bookCode = row.find('span.pdf-code').html();
            const urlInput = row.find('span.pdf-url input');
            const offsetInput = row.find('span.pdf-offset input');

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

            manifest.updatePDF(bookCode, {
                url: urlValue,
                offset: offsetValue,
            });
        }
        await manifest.updateSettings();

        console.log('%cClosing settings app...', 'color: red');
        console.log(manifest);

        PdfSettingsApp._open = false;
        return super.close();
    }
}
