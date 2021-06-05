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

import Api from '../Api';

/**
 * @private
 * Enriches TinyMCE editor content
 */
export default class HTMLEnricher {
    public static patchEnrich() {
        const oldEnrich = TextEditor.enrichHTML;

        // @ts-ignore
        TextEditor.enrichHTML = function (html: string, options: any) {
            html = oldEnrich.apply(this, [html, options]);
            html = HTMLEnricher.enrichAll(html);
            return html;
        };
    }

    public static bindRichTextLinks(html: JQuery) {
        html.find('a.pdfoundry-link').on('click', (event) => {
            event.preventDefault();

            // This will always be an anchor
            const target = $(event.currentTarget as HTMLAnchorElement);
            const ref = target.data('ref') as string;
            const page = target.data('page') as number;

            // ref can match name or code
            let pdfData = Api.findPDFData((data) => {
                return data.name === ref || data.code === ref;
            });

            if (!pdfData) {
                ui.notifications.error(`Unable to find a PDF with a name or code matching ${ref}.`);
                return;
            }

            if (page === 0) {
                Api.openPDF(pdfData);
            } else {
                Api.openPDF(pdfData, {
                    page,
                });
            }
        });
    }

    /**
     * Replace the first @PDF link in the text with a rich link.
     * @param text
     */
    public static enrich(text: string): string {
        const sPos = text.indexOf('@');
        const ePos = text.indexOf('}', sPos);

        const enrichMe = text.slice(sPos, ePos + 1);

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

        let pageNumber = 0;
        const [nameOrCode, queryString] = options.split('|');

        // Getting the PDF without invisible PDFs to check permissions
        let pdfData = Api.findPDFData((data) => {
            return data.name === nameOrCode || data.code === nameOrCode;
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

            if (pageNumber < 0) {
                throw new Error('PDFOUNDRY.ERROR.PageMustBePositive');
            }

            const i18nOpen = game.i18n.localize('PDFOUNDRY.ENRICH.LinkTitleOpen');
            const i18nPage = game.i18n.localize('PDFOUNDRY.ENRICH.LinkTitlePage');
            const linkTitle = `${i18nOpen} ${nameOrCode} ${i18nPage} ${pageNumber}`;
            const result = `<a class="pdfoundry-link" title="${linkTitle}" data-ref="${nameOrCode}" data-page="${pageNumber}">${linkText}</a>`;

            return text.slice(0, sPos) + result + text.slice(ePos + 1);
        } else {
            // Case 2 - User does not have permissions to see the PDF
            return text.slice(0, sPos) + linkText + text.slice(ePos + 1);
        }
    }

    /**
     * Replace all rich text markup with appropriate rich text HTML in the specified text.
     * @param text
     */
    public static enrichAll(text: string): string {
        while (text.includes('@PDF')) {
            text = HTMLEnricher.enrich(text);
        }

        return text;
    }
}
