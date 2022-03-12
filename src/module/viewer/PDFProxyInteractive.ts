/*
 * Copyright 2022 Andrew Cuccinello
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
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

import { PDFProxyConstructorArgs, PDFProxyStatic } from './PDFProxyStatic';
import { AbstractDataStore, DataStoreValidKey, DataStoreValidValue } from '../store/AbstractDataStore';
import { PollingWrapper } from '../util/PollingWrapper';
import { NullDataStore } from '../store/NullDataStore';

/**
 * A PDF viewer which also managed updates to a data store.
 */
export class PDFProxyInteractive extends PDFProxyStatic {
    protected readonly _dataStore: AbstractDataStore;
    protected _formDOMReadyPromise: Promise<JQuery<HTMLDivElement> | undefined>;

    public constructor(dataStore?: AbstractDataStore, options?: Partial<PDFProxyConstructorArgs>) {
        super(options);

        if (dataStore === undefined) {
            dataStore = new NullDataStore();
        }

        this._dataStore = dataStore;
    }

    /**
     * Runs when a page is first rendered, initializes data store with data contained within the PDF.
     * @param args
     * @protected
     */
    protected async _onPageInitialized(args: PDFJS.PDFEventArgsPageRendered) {
        let container = await this._formDOMReadyPromise;
        if (container === undefined) {
            throw new Error(`PDFoundry: Failed to initialize form fields, no fields were found or the request timed out.`);
        }

        const pdfFields = await args.source.annotationLayer._fieldObjectsPromise;
        const newFields: Record<string, string> = {};
        for (const [key, entries] of Object.entries(pdfFields)) {
            // Entries is actually an array containing all fields with the same name
            //  We don't support this right now, so we look at the first field with
            //  each name only, and ignore the other fields.
            const entry = entries[0];
            if (entries.length > 1) {
                console.warn(`PDFoundry: A field with the name "${key}" appears more than once.`);
            }

            // Case 1: We already have a value stored for this input
            const existingValue = this._dataStore.getValue(key) as DataStoreValidValue;
            if (existingValue !== undefined) {
                const element = container.find(`#${entry.id}`);
                const stringValue = existingValue.toString().toLowerCase();

                // case 1: deal with checkboxes
                if (stringValue === 'true' || stringValue === 'false') {
                    element.attr('checked', existingValue);
                    continue;
                }

                // case 2: anything else
                element.val(existingValue);
                continue;
            }

            // Case 2: This value is fresh, and needs to be inserted
            if (entry.value !== undefined) {
                newFields[key] = entry.value;
            }
        }

        return this._dataStore.setAll(newFields);
    }

    /**
     * Gets bound to the inputs on the PDF form, a standard JS change event.
     * @param event
     */
    protected async _onInputChanged(event: JQuery.ChangeEvent) {
        const input = $(event.target);
        const name = input.attr('name');
        // input has no storage location defined
        if (name === undefined) {
            return;
        }

        let value: string | string[] | number | boolean | undefined = input.val();
        // Chrome returns non-boolean values in the case of checkboxes
        if (value === 'on' || value === 'off') {
            value = input.is(':checked');
        }

        await this._dataStore.setValue(name, value);

        // safe to reload, clear "changes may not be saved" prompt
        this._application!.pdfDocument.annotationStorage.resetModified();
    }

    /**
     * Response callback to handle external data changes in the data store.
     * @param changes
     */
    protected _onStoreUpdate(changes: Record<DataStoreValidKey, DataStoreValidValue>) {
        if (this.container) {
            const container = $(this.container);

        }
    }

    public async bind(element: JQuery | HTMLElement): Promise<boolean> {
        const success = await super.bind(element);

        if (success && this._application) {
            this.on('pagerendered', this._onPageInitialized.bind(this));

            // No reliable way to await the viewer, so this is 'hacky' but works
            this._formDOMReadyPromise = PollingWrapper(
                async () => {
                    if (this._application && this._application.pdfViewer.container) {
                        const container = $(this._application.pdfViewer.container);
                        const elements = container.find('input, textarea, select');
                        if (elements.length > 0) {
                            return container;
                        } else {
                            return undefined;
                        }
                    }
                },
                20,
                1000,
            );
            // Bind change events on the form
            this._formDOMReadyPromise.then((container) => {
                if (container !== undefined) {
                    const elements = container.find('input, textarea, select');
                    elements.on('change', this._onInputChanged.bind(this));
                }
            });
        }

        this._dataStore.bindEvents();
        return success;
    }

    public async close(): Promise<void> {
        this._dataStore.unbindEvents();
        return super.close();
    }
}
