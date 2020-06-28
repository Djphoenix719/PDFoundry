import { PDFViewerWeb } from './viewer/PDFViewerWeb';
import { PDFManifest } from './settings/PDFManifest';
import { PDFDatabase, PDFDatabaseError } from './settings/PDFDatabase';

/**
 * An error that is thrown by the PDFoundry API
 */
export class PDFoundryAPIError extends Error {
    constructor(message?: string) {
        super(message);
    }
}

/**
 * An error thrown when a PDF has not been linked by the user.
 */
export class UnlinkedPDFError extends PDFoundryAPIError {
    constructor(message?: string) {
        super(message);
    }
}

export class PDFoundry {
    /**
     * Register a manifest from the specified URL
     * @param module The module YOU are calling this from.
     * @param url The URL (local or absolute) to fetch from.
     */
    public static async register(module: string, url: string) {
        const data = await $.getJSON(url);
        const { id, name, pdfs } = data;

        const manifest = new PDFManifest(module, id, name, pdfs);
        await manifest.register();
        manifest.pull();

        PDFDatabase.register(manifest);

        return manifest;
    }

    /**
     * Open a PDF by code to the specified page.
     * @param code
     * @param page
     */
    public static open(code: string, page: number = 1) {
        const pdf = PDFDatabase.getPDF(code);
        if (pdf === undefined) {
            throw new PDFDatabaseError(`Unable to find a PDF with code "${code}".`);
        }
        if (pdf.url === undefined) {
            throw new UnlinkedPDFError(`PDF with code "${code}" has no specified URL.`);
        }

        this.openURL(pdf.url, page);
    }

    /**
     * Open a PDF by URL to the specified page.
     * @param url
     * @param page
     */
    public static openURL(url: string, page: number = 1) {
        if (url === undefined) {
            throw new PDFoundryAPIError('Unable to open PDF; "url" must be defined');
        }

        if (page <= 0) {
            throw new PDFoundryAPIError(`Invalid page: "${page}"`);
        }

        new PDFViewerWeb(url, page).render(true);
    }
}
