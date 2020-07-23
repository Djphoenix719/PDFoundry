import { getPDFDataFromItem, isPDF } from '../Util';

/**
 * @private
 * A plugin for TinyMCE that handles Drag + Drop
 */
export default class TinyMCEPlugin {
    private static pluginName = 'PDFoundry_HTMLEnrich_Drop';

    /**
     * Register plugin with Foundry + TinyMCE
     */
    public static Register() {
        // @ts-ignore
        tinyMCE.PluginManager.add(TinyMCEPlugin.pluginName, function (editor) {
            editor.on('BeforeSetContent', (event) => TinyMCEPlugin.Handle(event));
        });
        CONFIG.TinyMCE.plugins = `${TinyMCEPlugin.pluginName} ${CONFIG.TinyMCE.plugins}`;
    }

    private static Handle(event: any) {
        console.warn(event);
        if (event.initial) return;
        if (!event.selection || event.set !== undefined) {
            return;
        }

        const initialContent = event.content;

        const lBracket = initialContent.indexOf('[');
        const rBracket = initialContent.indexOf(']');
        const entityId = initialContent.slice(lBracket + 1, rBracket);

        const entity = game.items.get(entityId);
        if (entity === null || !isPDF(entity)) {
            return;
        }

        const pdfData = getPDFDataFromItem(entity);
        if (!pdfData) {
            return;
        }

        const codeOrName = pdfData.code ? pdfData.code : pdfData.name;

        event.content = `@PDF[${codeOrName}|page=1]{${pdfData.name}}`;
    }
}
