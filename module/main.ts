import { PDFSettingsApp } from './app/PDFSettingsApp';
import { PDFoundry } from './PDFoundry';
import { PDFDatabase } from './settings/PDFDatabase';

// Register UI accessor
Hooks.once('init', function () {
    // @ts-ignore
    ui.PDFoundry = PDFoundry;
});
// Hooks.once('init', async function () {
//     await PDFoundry.register('shadowrun5e', 'modules/pdfoundry/dist/sr5_pdfs.json');
// });

Hooks.once('renderSettings', (app, html) => {
    console.log('Rendering settings.');
    const beforeTarget = $(html).find('h2').first();
    //TODO Localize header...
    const header = $('<h2>Configure PDFs</h2>');
    beforeTarget.before(header);

    for (const manifest of PDFDatabase.MANIFESTS) {
        console.log(manifest);
        //TODO: Localize names...
        const b = $('<button data-action="pdf-settings"></button>');
        b.html(`<i class="fas fa-file-pdf"></i> ${manifest.name}`);

        b.on('click', (event) => {
            const settingsApp = new PDFSettingsApp(manifest);
            settingsApp.render(true);
        });
        beforeTarget.before(b);
    }
});

Hooks.on('renderItemSheet', (app, html) => {
    console.warn('Render Item!');
    $(html).find('section.window-content ');
});
