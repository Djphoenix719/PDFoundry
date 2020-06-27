import { PdfSettingsApp } from './app/pdf-settings-app';
import { PdfManifest } from './settings/PdfManifest';

export class PDFSettingsError extends Error {
    constructor(message: string) {
        super(message);
    }
}
export class PDFSettings {
    public static readonly ROOT_MODULE_NAME = 'PDFoundry';

    /**
     * Helper function to load a manifest from a URL and immediately register it.
     * @see PDFSettings.Register
     */
    public static async RegisterFromURL(module: string, url: string) {
        const manifest = new PdfManifest(module, url);
        await manifest.fetch();
        PDFSettings.Register(module, manifest);
    }

    /**
     * Register a module with the game settings menu.
     * @param module The module you are calling from.
     * @param manifest A manifest that should be loaded.
     */
    public static Register(module: string, manifest: PdfManifest) {
        if (!manifest.isInitialized) {
            throw new PDFSettingsError('Tried to register a manifest an uninitialized manifest. Did you forget to call load?');
        }

        // TODO: Look into if this can be passed again.
        PdfSettingsApp.manifest = manifest;
        PdfSettingsApp.module = module;
        manifest.registerMenu();
    }
}
