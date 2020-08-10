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

import { PDFItemConfig } from '../app/PDFItemConfig';
import Settings from '../settings/Settings';
import Api from '../Api';

/**
 * @private
 * Enriches TinyMCE editor content
 */
export default class HTMLEnricher {
    public static HandleEnrich(app: Application, html: JQuery, data: any) {
        if (app instanceof PDFItemConfig) return;

        HTMLEnricher.EnrichHTML(html);
        HTMLEnricher.BindClicks(html);
    }

    private static EnrichHTML(html: JQuery) {
        // Enrich HTML
        for (const element of html.find('div.editor-content > *, p')) {
            try {
                // We replace one at a time until done
                while (element.innerText.includes('@PDF')) {
                    element.innerHTML = new HTMLEnricher($(element), element.innerHTML).enrich();
                }
            } catch (error) {
                // Errors get propagated from instance for proper error modeling
                if (Settings.NOTIFICATIONS) {
                    ui.notifications.error(error.message);
                } else {
                    console.error(error);
                }
            }
        }
    }

    private static BindClicks(html: JQuery) {
        html.find('a.pdfoundry-link').on('click', (event) => {
            event.preventDefault();

            // This will always be an anchor
            const target = $(event.currentTarget as HTMLAnchorElement);
            const ref = target.data('ref');
            const page = target.data('page');

            // ref can match name or code
            let pdfData = Api.getPDFData((item) => {
                return item.name === ref || item.data.data.code === ref;
            });

            if (!pdfData) {
                ui.notifications.error(`Unable to find a PDF with a name or code matching ${ref}.`);
                return;
            }
            Api.openPDF(pdfData, page);
        });
    }

    private readonly _sPos: number;
    private readonly _ePos: number;
    private readonly _text: string;
    private readonly _element: JQuery;

    constructor(p: JQuery, text: string) {
        this._element = p;
        this._text = text;

        this._sPos = this._text.indexOf('@');
        this._ePos = this._text.indexOf('}', this._sPos + 1);
    }

    public enrich(): string {
        const enrichMe = this._text.slice(this._sPos, this._ePos + 1);

        const lBracket = enrichMe.indexOf('[');
        const rBracket = enrichMe.indexOf(']');
        const lCurly = enrichMe.indexOf('{');
        const rCurly = enrichMe.indexOf('}');

        // Required character is missing
        if (lBracket === -1 || rBracket === -1 || lCurly === -1 || rCurly === -1) {
            throw new Error(game.i18n.localize('PDFOUNDRY.ENRICH.InvalidFormat'));
        }
        // Order is not correct
        if (rCurly < lCurly || lCurly < rBracket || rBracket < lBracket) {
            throw new Error(game.i18n.localize('PDFOUNDRY.ENRICH.InvalidFormat'));
        }

        const options = enrichMe.slice(lBracket + 1, rBracket);
        // Multiple dividers are not supported
        if (options.indexOf('|') !== options.lastIndexOf('|')) {
            throw new Error(game.i18n.localize('PDFOUNDRY.ENRICH.InvalidFormat'));
        }

        let linkText = enrichMe.slice(lCurly + 1, rCurly);
        // Empty names are not supported
        if (linkText === undefined || linkText === '') {
            throw new Error(game.i18n.localize('PDFOUNDRY.ENRICH.EmptyLinkText'));
        }

        let pageNumber = 1;
        const [nameOrCode, queryString] = options.split('|');

        // Getting the PDF without invisible PDFs to check permissions
        let pdfData = Api.getPDFData((item) => {
            return item.name === nameOrCode || item.data.data.code === nameOrCode;
        }, false);

        if (pdfData) {
            // Case 1 - User has permissions to see the PDF
            if (queryString !== undefined && queryString !== '') {
                const [_, pageString] = queryString.split('=');
                try {
                    pageNumber = parseInt(pageString);
                } catch (error) {
                    // Ignore page number
                }
            }

            if (pageNumber <= 0) {
                throw new Error('PDFOUNDRY.ERROR.PageMustBePositive');
            }

            const i18nOpen = game.i18n.localize('PDFOUNDRY.ENRICH.LinkTitleOpen');
            const i18nPage = game.i18n.localize('PDFOUNDRY.ENRICH.LinkTitlePage');
            const linkTitle = `${i18nOpen} ${nameOrCode} ${i18nPage} ${pageNumber}`;
            const result = `<a class="pdfoundry-link" title="${linkTitle}" data-ref="${nameOrCode}" data-page="${pageNumber}">${linkText}</a>`;

            return this._text.slice(0, this._sPos) + result + this._text.slice(this._ePos + 1);
        } else {
            // Case 2 - User does not have permissions to see the PDF
            return this._text.slice(0, this._sPos) + linkText + this._text.slice(this._ePos + 1);
        }
    }
}
