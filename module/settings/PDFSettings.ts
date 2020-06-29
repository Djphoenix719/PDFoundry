import { PDFSettingsApp } from '../app/PDFSettingsApp';
import { PDFManifest } from './PDFManifest';
import { PDFDatabase } from './PDFDatabase';

/**
 * Internal settings and helper methods for PDFoundry.
 */
export class PDFSettings {
    private static CONTAINERS: JQuery[] = [];
    private static readonly CONTAINER_ID = 'pdfoundry-config';
    public static SYSTEM_NAME: string = 'shadowrun5e';

    /**
     * Create the container for the settings buttons
     * @param app
     * @param html
     */
    public static initializeContainer(app, html) {
        if (html.find(`#${PDFSettings.CONTAINER_ID}`).length > 0) {
            return;
        }

        const container = $(`<div id="${PDFSettings.CONTAINER_ID}"></div>`);
        container.append('<h4>PDFoundry</h4>');

        const help = $(html.find('h2').get(2));
        help.before(container);

        PDFSettings.cleanDestroyedContainers();
        PDFSettings.CONTAINERS.push(container);
        for (const manifest of PDFDatabase.MANIFESTS) {
            PDFSettings.addManifestButton(manifest);
        }
    }

    /**
     * Unreference containers whose windows have been destroyed
     */
    public static cleanDestroyedContainers() {
        const containers = PDFSettings.CONTAINERS;
        for (let i = containers.length - 1; i >= 0; i--) {
            const container = containers[i][0];
            if (document.body.contains(container)) {
                continue;
            }
            containers.splice(i);
        }
    }

    /**
     * Add a button to edit the manifest to all containers
     * @param manifest
     */
    public static addManifestButton(manifest: PDFManifest) {
        //TODO: Localize names...
        for (const container of PDFSettings.CONTAINERS) {
            if (container.find(`#pdf-setting-${manifest.id}`).length > 0) {
                continue;
            }

            const button = $(`<button id="pdf-setting-${manifest.id}"><i class="fas fa-file-pdf"></i> ${manifest.name}</button>`);

            button.on('click', (event) => {
                const settingsApp = new PDFSettingsApp(manifest);
                settingsApp.render(true);
            });
            container.append(button);
        }
    }
}
