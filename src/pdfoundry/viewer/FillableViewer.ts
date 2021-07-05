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

import BaseViewer from './BaseViewer';
import Settings from '../Settings';
import { PDFData } from '../common/types/PDFData';

// TODO: Move to wrapped input model to standardize inputs.
//  Current code is insane and has too much branching.
//  Factory should be used to create the wrapped inputs.
// /**
//  * Wraps an input to standardize operations over various HTML elements.
//  * @internal
//  */
// abstract class FormInput<TElement extends HTMLElement, TValue> {
//     protected _element: TElement;
//     protected _name: string;
//     protected _value: TValue;
//
//     public static IsOfType(element: HTMLElement) {
//         return false;
//     }
//
//     /**
//      * Return the HTML element for this input.
//      */
//     public get element() {
//         return this._element;
//     }
//
//     /**
//      * Return the name of this input.
//      */
//     public get name() {
//         return this._name;
//     }
//
//     protected constructor(name: string, element: TElement, value: TValue) {
//         this._name = name;
//         this._element = element;
//         this._value = value;
//
//         $(this._element).attr('name', this._name);
//     }
//
//     /**
//      * Get the value of this input.
//      */
//     public abstract get value();
//
//     /**
//      * Set the value of this input.
//      * @param newValue The value to set to.
//      */
//     public abstract set value(newValue: TValue);
//
//     public abstract onInputChanged(event: JQuery.ChangeEvent);
// }
//
// class InputInput extends FormInput<HTMLInputElement, string> {
//     public static IsOfType(element: HTMLElement): element is HTMLInputElement {
//         return element.tagName === 'INPUT';
//     }
//
//     onInputChanged(event: JQuery.ChangeEvent) {}
//
//     public get value() {
//         return this._value;
//     }
//
//     public set value(newValue: string) {
//         this._value = newValue;
//     }
// }

/**
 * Handles base form fillable support, can be used as a stand alone form fillable viewer.
 * @module API
 */
export default class FillableViewer extends BaseViewer {
    // <editor-fold desc="Static Properties">

    static get defaultOptions() {
        const options = super.defaultOptions;
        options.template = `${Settings.PATH_TEMPLATES}/app/viewer/fillable.html`;
        return options;
    }

    // </editor-fold>
    // <editor-fold desc="Static Methods">

    /**
     * Validate the data path of the key.
     * @param path
     */
    protected static dataPathValid(path: string): boolean {
        return !path.includes('_id');
    }

    /**
     * Fix keys by removing invalid characters
     * @param key
     */
    protected static fixKey(key: string): string {
        if (key.startsWith(`data.`)) {
            return key;
        }

        key = key.trim();
        return key.replace(/\s/g, '_');
    }

    /**
     * Resolve a key path to the proper flattened key
     * @param key
     */
    protected static resolveKeyPath(key: string): string {
        if (key === 'name') return key;
        if (key.startsWith(`data.`)) {
            return this.fixKey(key);
        }

        return `flags.${Settings.MODULE_NAME}.${Settings.FLAGS_KEY.FORM_DATA}.${this.fixKey(key)}`;
    }

    // </editor-fold>
    // <editor-fold desc="Properties">

    protected document: Entity;
    protected pdfData: PDFData;
    private container: JQuery;

    // </editor-fold>
    // <editor-fold desc="Constructor & Initialization">

    public constructor(entity: JournalEntry | Actor, pdfData: PDFData, options?: Application.Options) {
        super(options);

        this.document = entity;
        this.pdfData = pdfData;

        this.bindHooks();
    }

    // </editor-fold>
    // <editor-fold desc="Getters & Setters">

    protected flattenEntity(): Record<string, string> {
        const data = flattenObject({
            name: this.document.name,
            data: this.document.data.data,
            flags: this.document.data.flags,
        }) as Record<string, string>;

        // Do not allow non-data keys to make it into the flat object
        for (const key of Object.keys(data)) {
            if (!FillableViewer.dataPathValid(key)) {
                delete data[key];
            }
        }

        return data;
    }

    // </editor-fold>
    // <editor-fold desc="Instance Methods">

    protected bindHooks(): void {
        if (this.document.uuid.startsWith('Actor')) {
            Hooks.on('updateActor', this.onUpdateEntity.bind(this));
        } else if (this.document.uuid.startsWith('Item')) {
            Hooks.on('updateItem', this.onUpdateEntity.bind(this));
        }
    }

    protected unbindHooks(): void {
        if (this.document.uuid.startsWith('Actor')) {
            Hooks.off('updateActor', this.onUpdateEntity.bind(this));
        } else if (this.document.uuid.startsWith('Item')) {
            Hooks.off('updateItem', this.onUpdateEntity.bind(this));
        }
    }

    protected elementIsCheckbox(element: HTMLElement): element is HTMLInputElement {
        return element.tagName === 'INPUT' && element.getAttribute('type') === 'checkbox';
    }

    protected elementIsInput(element: HTMLElement): element is HTMLInputElement | HTMLTextAreaElement {
        return (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') && element.getAttribute('type') !== 'radio';
    }

    protected elementIsSelect(element: HTMLElement): element is HTMLSelectElement {
        return element.tagName === 'SELECT';
    }

    protected elementIsRadio(element: HTMLElement): element is HTMLInputElement {
        return element.tagName === 'INPUT' && element.getAttribute('type') === 'radio';
    }

    protected onPageRendered(event) {
        const POLL_INTERVAL = 5;
        const MAX_POLL_TIME = 250;
        const container = $(event.source.div);

        new Promise<any>((resolve, reject) => {
            let timeout;
            let totalWait = 0;
            let elements: JQuery<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

            const returnOrWait = () => {
                elements = container.find('input, textarea, select') as JQuery<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

                if (elements.length > 0) {
                    clearTimeout(timeout);
                    resolve(elements);
                    return;
                } else if (totalWait < MAX_POLL_TIME) {
                    totalWait += POLL_INTERVAL;
                    timeout = setTimeout(returnOrWait, POLL_INTERVAL);
                } else {
                    reject({
                        message: 'Page did not render in the allowed time.',
                        event,
                    });
                }
            };
            returnOrWait();
        })
            .then((elements: JQuery<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
                if (this.container === undefined || this.container.length === 0) {
                    this.container = $(container.parents().find('#viewerContainer'));
                }

                this.initializeInputs(elements);

                elements.on('change', this.onInputChanged.bind(this));

                super.onPageRendered(event);
            })
            .catch((reason) => console.error(reason));
    }

    protected onInputChanged(event) {
        const element = event.currentTarget;
        let value = '';

        let key = $(element).attr('name');
        if (key === undefined) {
            return;
        }

        key = FillableViewer.resolveKeyPath(key);

        if (!FillableViewer.dataPathValid(key)) {
            return;
        }

        if (this.elementIsCheckbox(element)) {
            value = this.getCheckInputValue($(element));
        } else if (this.elementIsInput(element)) {
            value = this.getTextInputValue($(element as HTMLInputElement | HTMLTextAreaElement));
        } else if (this.elementIsSelect(element)) {
            value = this.getTextInputValue($(element as HTMLSelectElement));
        } else if (this.elementIsRadio(element)) {
            value = this.getRadioInputValue($(element));
        }

        this.update(
            this.resolveDelta(this.flattenEntity(), {
                [key]: value,
            }),
        ).then((result) => {
            const elementsToUpdate = this.container.find('input, textarea, select');
            this.initializeInputs(elementsToUpdate);
        });
    }

    protected initializeInputs(elements: JQuery) {
        const oldData = this.flattenEntity();
        const newData = duplicate(oldData);

        // Load data from sheet as initialization data
        // Fill in existing data where it exists on the actor
        let write = false;
        for (const element of elements) {
            let key = element.getAttribute('name');
            if (key === null || !FillableViewer.dataPathValid(key)) {
                continue;
            }

            key = FillableViewer.resolveKeyPath(key);

            if (this.elementIsCheckbox(element)) {
                write = this.initializeCheckInput($(element), key, newData) || write;
            } else if (this.elementIsInput(element)) {
                write = this.initializeTextInput($(element), key, newData) || write;
            } else if (this.elementIsSelect(element)) {
                write = this.initializeTextInput($(element), key, newData) || write;
            } else if (this.elementIsRadio(element)) {
                write = this.initializeRadioInput($(element), key, newData) || write;
            } else {
                console.error('Unsupported input type in PDF.');
            }
        }

        if (write) {
            this.update(this.resolveDelta(oldData, newData));
        }
    }

    protected resolveDelta(oldData: Record<string, any>, newData: Record<string, any>) {
        // Flags must be fully resolved
        const delta = { ...flattenObject({ flags: this.document.data.flags }) };
        for (const [key, newValue] of Object.entries(newData)) {
            const oldValue = oldData[key];

            // Arrays dont make sense on PDFs which are not dynamic
            if (Array.isArray(newValue) || Array.isArray(oldValue)) {
                delete delta[key];
                continue;
            }

            // Skip matching values
            if (oldValue !== undefined && newValue === oldValue) {
                continue;
            }

            delta[key] = newValue;
        }

        return delta;
    }

    public refreshTitle(): void {
        $(this.element).find('.window-title').text(this.title);
    }

    protected onUpdateEntity(actor: Actor, data: Partial<Actor.Data> & { _id: string }, options: { diff: boolean }, id: string) {
        if (data._id !== this.document.id) {
            return;
        }

        const args = duplicate(data);
        // @ts-ignore
        delete args['_id'];

        const elementsToUpdate = this.container.find('input, textarea, select');
        this.initializeInputs(elementsToUpdate);
        this.refreshTitle();
    }

    protected async update(delta: object) {
        // data must be expanded to set properly
        // TODO: Flags seem to be always set - delta needs checking
        return this.document.update(expandObject(delta));
    }

    protected initializeTextInput(
        input: JQuery<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
        key: string,
        data: Record<string, string>,
    ): boolean {
        let value = data[key];
        if (value === undefined) {
            // If value does not exist on actor yet, load from sheet
            const inputValue = input.val();

            if (inputValue) {
                // Actor changes were made
                data[key] = inputValue.toString();
                return true;
            }
        } else {
            // Otherwise initialize input value to actor value
            this.setTextInput(input, value);
        }
        return false;
    }

    protected initializeCheckInput(input: JQuery<HTMLInputElement>, key: string, data: Record<string, string>): boolean {
        let value = data[key];
        if (value === undefined) {
            const inputValue = input.attr('checked') !== undefined;

            // Actor changes were made
            data[key] = inputValue.toString();
            return true;
        } else {
            this.setCheckInput(input, value);
        }
        return false;
    }

    protected initializeRadioInput(input: JQuery<HTMLInputElement>, key: string, data: Record<string, string>): boolean {
        let value = data[key];
        if (value === undefined || value === '') {
            data[key] = this.getRadioInputValue(input);
            return true;
        } else {
            // if we're looking at the right radio for the group enable it
            if (data[key] === input.attr('id')) {
                this.setCheckInput(input, 'true');
            } else {
                this.setCheckInput(input, 'false');
            }
        }
        return false;
    }

    protected setTextInput(input: JQuery<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, value: string) {
        input.val(value);
    }

    protected setCheckInput(input: JQuery<HTMLInputElement>, value: string) {
        if (value === 'true') {
            input.attr('checked', 'true');
        } else {
            input.removeAttr('checked');
        }
    }

    protected getTextInputValue(input: JQuery<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): string {
        const value = input.val();
        if (!value) {
            return '';
        }

        return value.toString().trim();
    }

    protected getCheckInputValue(input: JQuery<HTMLInputElement>): string {
        return (window.getComputedStyle(input.get(0), ':before').content !== 'none').toString();
    }

    protected getRadioInputValue(input: JQuery<HTMLInputElement>): string {
        const name = input.attr('name');
        const elements = $(this.container).find(`input[name="${name}"]`) as JQuery<HTMLElement>;
        for (let i = 0; i < elements.length; i++) {
            const element = elements.get(i);
            if (window.getComputedStyle(element, ':before').content !== 'none') {
                return element.id;
            }
        }
        return '';
    }

    async close(): Promise<any> {
        // await this.setActorData(this.actorData);
        if (this._viewer) {
            await this._viewer.close();
        }

        this.unbindHooks();

        return super.close();
    }

    // </editor-fold>
}
