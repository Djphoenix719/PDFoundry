import { PDFSettings } from '../settings/PDFSettings';
import { PDFViewerWeb } from '../viewer/PDFViewerWeb';

export class PDFoundryAPIError extends Error {
    constructor(message?: string) {
        super(message);
    }
}

/**
 * All the properties of a PDF that can be specified by a user
 */
export type PDFData = {
    code: string;
    url: string;
    offset: number;
    cache: boolean;
};

export class PDFoundryAPI {
    /**
     * Register your system with the API.
     * @param system The module YOU are calling this from.
     */
    public static async registerSystem(system: string) {
        PDFSettings.EXTERNAL_SYSTEM_NAME = system;
    }

    /**
     * Get an object containing the user specified PDF data for a specific PDF code.
     * @param code
     */
    public static getPDFData(code: string): null | PDFData {
        const entity = game.items.find((item) => {
            return item.data.type === PDFSettings.PDF_ENTITY_TYPE && item.data.data.code === code;
        });
        if (entity === undefined || entity === null) {
            return null;
        }

        const data = entity.data.data;
        if (data.offset === '') {
            data.offset = 0;
        }
        data.offset = parseInt(data.offset);
        return data;
    }

    /**
     * Open a PDF by code to the specified page.
     * @param code
     * @param page
     */
    public static open(code: string, page: number = 1) {
        const pdf = this.getPDFData(code);
        if (pdf === null) {
            throw new PDFoundryAPIError(`Unable to find a PDF with the code "${code}. Did the user declare it?`);
        }

        const { url, offset } = pdf;
        // coerce to number; safety first
        page = offset + parseInt(page.toString());

        this.openURL(`${window.origin}/${url}`, page);
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

        // coerce to number; safety first
        page = parseInt(page.toString());
        if (isNaN(page) || page <= 0) {
            throw new PDFoundryAPIError(`Page must be > 0 but ${page} was given.`);
        }

        new PDFViewerWeb(url, page).render(true);
    }
}
