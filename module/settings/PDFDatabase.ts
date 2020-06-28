import { PDFDef, PDFManifest } from './PDFManifest';
import { PDFSettings } from './PDFSettings';

/**
 * An error thrown during PDF lookup or registration.
 */
export class PDFDatabaseError extends Error {
    constructor(message?: string) {
        super(message);
    }
}

export class PDFDatabase {
    public static MANIFESTS: PDFManifest[] = [];

    /**
     * Register a manifest with the database for later lookup
     * @param manifest
     */
    public static register(manifest: PDFManifest) {
        if (!manifest.isInitialized) {
            throw new PDFDatabaseError('Cannot register uninitialized manifest.');
        }

        const toValidate = manifest.pdfs;
        while (toValidate.length > 0) {
            const thisPdf = toValidate.pop();
            if (thisPdf === undefined) {
                throw new PDFDatabaseError(`Undefined PDF found in manifest "${manifest.id}".`);
            }

            for (const thatManifest of PDFDatabase.MANIFESTS) {
                const thatPdf = thatManifest.findByCode(thisPdf.code);
                if (thatPdf !== undefined) {
                    throw new PDFDatabaseError(`A PDF with code ${thisPdf.code} already exists in manifest "${thatManifest.id}".`);
                }
            }
        }

        PDFDatabase.MANIFESTS.push(manifest);
        PDFSettings.addManifestButton(manifest);
    }

    /**
     * Get a PDF definition by it's code.
     * @param code
     */
    public static getPDF(code: string): PDFDef | undefined {
        let found: PDFDef | undefined = undefined;

        for (const manifest of PDFDatabase.MANIFESTS) {
            found = manifest.findByCode(code);
            if (found !== undefined) {
                break;
            }
        }

        return found;
    }
}
