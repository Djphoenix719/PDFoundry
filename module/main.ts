// Register UI accessor
import { PDFoundry } from './api/PDFoundry';
import { PDFSettings } from './settings/PDFSettings';

Hooks.on('init', function () {
    // @ts-ignore
    ui.PDFoundry = PDFoundry;
});

Hooks.on('renderSettings', PDFSettings.initializeContainer);
