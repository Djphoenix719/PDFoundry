import { PDFSourceSheet } from '../app/PDFItemSheet';

/**
 * Internal settings and helper methods for PDFoundry.
 */
export class PDFSettings {
    public static DIST_FOLDER: string = 'pdfoundry-dist';
    public static EXTERNAL_SYSTEM_NAME: string = '../modules/pdfoundry';
    public static INTERNAL_MODULE_NAME: string = 'PDFoundry';
    public static PDF_ENTITY_TYPE: string = 'PDF';

    /**
     * Register the PDF sheet and unregister invalid sheet types from it.
     */
    public static registerPDFSheet() {
        //  static unregisterSheet(scope, sheetClass, {types=[]}={}) {
        Items.unregisterSheet(PDFSettings.INTERNAL_MODULE_NAME, 'SR5ItemSheet', {
            types: [PDFSettings.PDF_ENTITY_TYPE],
        });
        Items.registerSheet(PDFSettings.INTERNAL_MODULE_NAME, PDFSourceSheet, {
            types: [PDFSettings.PDF_ENTITY_TYPE],
            makeDefault: true,
        });

        // Unregister all other item sheets for the PDF entity
        const pdfoundryKey = `${PDFSettings.INTERNAL_MODULE_NAME}.${PDFSourceSheet.name}`;
        const sheets = CONFIG.Item.sheetClasses[PDFSettings.PDF_ENTITY_TYPE];
        for (const key of Object.keys(sheets)) {
            const sheet = sheets[key];
            // keep the PDFoundry sheet
            if (sheet.id === pdfoundryKey) {
                continue;
            }

            // id is MODULE.CLASS_NAME
            const [module] = sheet.id.split('.');
            Items.unregisterSheet(module, sheet.cls, {
                types: [PDFSettings.PDF_ENTITY_TYPE],
            });
        }
    }

    public static async onCreateItem(item: Item, ...args) {
        if (item.data.type !== PDFSettings.PDF_ENTITY_TYPE) {
            return;
        }

        await item.update(
            {
                img: `systems/${PDFSettings.EXTERNAL_SYSTEM_NAME}/${PDFSettings.DIST_FOLDER}/assets/pdf_icon.svg`,
            },
            { enforceTypes: true },
        );
    }
}
