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

import { AbstractDataStore, DataStoreValidKey, DataStoreValidValue } from './AbstractDataStore';
import { AnyDocumentData } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/data.mjs';
import { MODULE_NAME } from '../Constants';

const FLAGS_SCOPE = MODULE_NAME;
const FLAGS_KEY = 'FormData';
const FLAGS_PREFIX = `flags.${FLAGS_SCOPE}.${FLAGS_KEY}`;

export class DocumentDataStore<TDocumentData extends AnyDocumentData = AnyDocumentData> extends AbstractDataStore {
    /**
     * Normalize a key into a canonical store-able form, depending on where the storage should occur.
     * @param key
     * @protected
     */
    protected static normalizeKey(key: string): string {
        // Overly cautious with trimming to avoid `x. data.y ` type errors
        key = key.trim();

        // Case 1: 'name' is a special case, not stored in the data object or flags
        if (key === 'name') {
            return key;
        }

        // Case 2: Data path is already formatted, data should be stored there
        if (key.startsWith('data.')) {
            return key;
        }

        // Case 3: No data path, data should be stored in the flags
        return `flags.${FLAGS_SCOPE}.${FLAGS_KEY}.${key}`;
    }

    /**
     * Returns true if the key is a valid key that is fully normalized.
     * @param key
     * @protected
     */
    protected static isValidNormalizedKey(key: string): boolean {
        return key === 'name' || key.startsWith('data.') || key.startsWith('flags.');
    }

    private readonly _document: StoredDocument<foundry.abstract.Document<any, any>>;
    public constructor(document: StoredDocument<foundry.abstract.Document<any, any>>) {
        super();
        this._document = document;
    }

    /**
     * Get flattened and pruned version of this documents' data.
     * @protected
     */
    protected getFlattenedDocumentData(): Record<string, any> {
        let data: Record<string, any> = {};
        data = mergeObject(data, { data: this._document.data.data });
        data = mergeObject(data, { [FLAGS_PREFIX]: this._document.data['flags'][FLAGS_SCOPE]?.[FLAGS_KEY] ?? {} });
        data['name'] = this._document.name;
        data = flattenObject(data);
        return data;
    }

    public getValue<TValue>(key: DataStoreValidKey): TValue | undefined {
        key = DocumentDataStore.normalizeKey(key.toString());
        const flattened = this.getFlattenedDocumentData();
        return flattened[key];
    }

    public async setValue<TValue>(key: DataStoreValidKey, value: TValue): Promise<boolean> {
        key = DocumentDataStore.normalizeKey(key.toString());
        const result = await this._document.update({ [key]: value } as any);
        return result !== undefined;
    }

    public getAll(): Record<DataStoreValidKey, DataStoreValidValue> {
        // We only want to allow users to write to keys which are valid normalized
        //  keys and we'll only return values with keys which match those as well
        const flattened = flattenObject(this._document.data);
        for (const key of Object.keys(flattened)) {
            if (!DocumentDataStore.isValidNormalizedKey(key)) {
                delete flattened[key];
            }
        }
        return flattened;
    }

    public async setAll(data: Record<DataStoreValidKey, DataStoreValidValue>): Promise<boolean> {
        let normalizedData: Record<DataStoreValidKey, DataStoreValidValue | object> = {};
        for (const [key, value] of Object.entries(data)) {
            normalizedData = mergeObject(normalizedData, {
                [DocumentDataStore.normalizeKey(key)]: value,
            });
        }

        if (isObjectEmpty(normalizedData)) {
            return true;
        }

        const result = await this._document.update({ ...normalizedData } as any);
        return result !== undefined;
    }

    public bindEvents(): void {
        Hooks.on(`update${this._document.documentName}`, this._onUpdateDocument.bind(this));
    }

    public unbindEvents(): void {
        Hooks.off(`update${this._document.documentName}`, this._onUpdateDocument.bind(this));
    }

    private async _onUpdateDocument(document: StoredDocument<foundry.abstract.Document<any, any>>, changes: Record<string, any>): Promise<void> {
        console.warn('Update Document');
        console.warn(changes);
        const flattenedChanges = flattenObject(changes);
        console.warn(flattenedChanges);
    }
}
