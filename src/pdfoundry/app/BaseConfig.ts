import { BUTTON_GITHUB, BUTTON_HELP } from '../common/helpers/header';

export default abstract class BaseConfig extends ItemSheet {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.classes = ['sheet', 'item'];
        options.width = 650;
        options.height = 'auto';
        return options;
    }

    protected _getHeaderButtons(): any[] {
        const buttons = super._getHeaderButtons();
        buttons.unshift(BUTTON_HELP);
        buttons.unshift(BUTTON_GITHUB);
        return buttons;
    }

    protected activateListeners(html: JQuery<HTMLElement>): void {
        super.activateListeners(html);

        const urlInput = html.find('#data-url');

        // Block enter from displaying the PDF
        html.find('input').on('keypress', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
            }
        });

        // Browse button
        html.find('#pdf-browse').on('click', async function (event) {
            event.preventDefault();

            const picker = new FilePicker({});
            // @ts-ignore TODO: foundry-pc-types
            picker.extensions = ['.pdf'];
            picker.field = urlInput[0];

            let urlValue = urlInput.val();
            if (urlValue !== undefined) {
                await picker.browse(urlValue.toString().trim());
            }

            picker.render(true);
        });
    }
}
