import { PDFSettings } from '../settings/PDFSettings';
import { PDFSourceSheet } from '../app/PDFItemSheet';
import { PDFoundryAPI } from '../api/PDFoundryAPI';

/**
 * A collection of methods used for setting up the API & system state.
 */
export class PDFSetup {
    /**
     * Register the PDFoundry APi on the UI
     */
    public static registerAPI() {
        ui['PDFoundry'] = PDFoundryAPI;
    }

    /**
     * Inject the CSS file into the header, so it doesn't have to be referenced in the system.json
     */
    public static injectCSS() {
        $('head').append(
            $(`<link href="systems/${PDFSettings.EXTERNAL_SYSTEM_NAME}/${PDFSettings.DIST_FOLDER}/bundle.css" rel="stylesheet" type="text/css" media="all">`),
        );
    }

    /**
     * Register the PDF sheet and unregister invalid sheet types from it.
     */
    public static registerPDFSheet() {
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
}
