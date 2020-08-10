/* Copyright 2020 Andrew Cuccinello
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { getPDFBookData, isPDF } from '../Util';

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

        const pdfData = getPDFBookData(entity);
        if (!pdfData) {
            return;
        }

        const codeOrName = pdfData.code ? pdfData.code : pdfData.name;

        event.content = `@PDF[${codeOrName}|page=1]{${pdfData.name}}`;
    }
}
