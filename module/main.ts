import { PDFoundryAPI } from './api/PDFoundryAPI';
import { PDFSettings } from './settings/PDFSettings';
CONFIG.debug.hooks = true;

// Register UI accessor
Hooks.on('init', function () {
    // @ts-ignore
    ui.PDFoundry = PDFoundryAPI;
});
Hooks.once('ready', PDFSettings.registerPDFSheet);
Hooks.on('createItem', PDFSettings.onCreateItem);
Hooks.on('getItemDirectoryEntryContext', PDFSettings.getItemContextOptions);
