import { PDFSettings } from '../settings/PDFSettings';
import { PDFoundryAPI } from '../api/PDFoundryAPI';
/**
 * Extends the base ItemSheet for linked PDF viewing.
 */
export class PDFSourceSheet extends ItemSheet {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = ['sheet', 'item'];
        options.width = 650;
        options.height = 'auto';
        return options;
    }

    get template() {
        return `systems/${PDFSettings.EXTERNAL_SYSTEM_NAME}/${PDFSettings.DIST_FOLDER}/templates/pdf-sheet.html`;
    }

    protected activateListeners(html: JQuery<HTMLElement>): void {
        super.activateListeners(html);

        this.addGithubLink(html);

        // Block enter from displaying the PDF
        html.find('input').on('keypress', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
            }
        });

        html.find('#pdf-test').on('click', function (event) {
            event.preventDefault();

            const urlInput = html.find('input#data\\.url');
            const offsetInput = html.find('input#data\\.offset');

            let urlValue = urlInput.val();
            let offsetValue = offsetInput.val();

            if (urlValue === null || urlValue === undefined) return;
            if (offsetValue === null || offsetValue === undefined) return;

            urlValue = `${window.location.origin}/${urlValue}`;

            if (offsetValue.toString().trim() === '') {
                offsetValue = 0;
            }
            offsetValue = parseInt(offsetValue as string);

            PDFoundryAPI.openURL(urlValue, 5 + offsetValue);
        });
    }

    protected addGithubLink(html: JQuery<HTMLElement>) {
        const h4 = html.parents().find('header.window-header h4');
        const next = h4.next()[0].childNodes[1].textContent;
        if (next && next.trim() === 'PDFoundry') {
            return;
        }

        const url = 'https://github.com/Djphoenix719/PDFoundry';
        const style = 'text-decoration: none';
        const icon = '<i class="fas fa-external-link-alt"></i>';
        const link = $(`<a style="${style}" href="${url}">${icon} PDFoundry</a>`);

        h4.after(link);
    }
}
