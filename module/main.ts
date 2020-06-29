// Register UI accessor
import { PDFoundryAPI } from './api/PDFoundryAPI';
import { PDFSettings } from './settings/PDFSettings';

Hooks.on('init', function () {
    // @ts-ignore
    ui.PDFoundry = PDFoundryAPI;
});

Hooks.on('renderSettings', PDFSettings.initializeContainer);
