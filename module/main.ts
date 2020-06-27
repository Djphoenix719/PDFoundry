import { PDFSettings } from './settings';
import { PdfSettingsApp } from './app/pdf-settings-app';
import { PDFoundry } from './api';

// Register UI accessor
Hooks.on('init', function () {
    // @ts-ignore
    ui.PDFoundry = PDFoundry;
});

Hooks.once('ready', async function () {
    // const view = new WebViewerApp('..\\..\\..\\books\\Shadowrun - Hard Targets.pdf', 45).render(true);
    // PDFOptions.init();

    try {
        console.log(game.settings.get('shadowrun5e', 'shadowrun-5th-edition'));
    } catch (e) {
        console.warn('Unable to get settings.');
    }

    await PDFSettings.RegisterFromURL('shadowrun5e', 'modules/pdfoundry/dist/sr5_pdfs.json');

    // new PdfSettingsApp(null).render(true);
});
