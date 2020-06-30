// Register UI accessor
import { PDFoundryAPI } from './api/PDFoundryAPI';
import { PDFSettings } from './settings/PDFSettings';
import { PDFSourceSheet } from './app/PDFItemSheet';
CONFIG.debug.hooks = true;

Hooks.on('init', function () {
    // @ts-ignore
    ui.PDFoundry = PDFoundryAPI;
});
Hooks.once('ready', PDFSettings.registerPDFSheet);
Hooks.on('createItem', PDFSettings.onCreateItem);
