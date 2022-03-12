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

export type DataStoreValidKey = string | number;
export type DataStoreValidValue = string | number;

export const DataStoreUpdateEventType = 'storeUpdate';
export type DataStoreUpdateEventType = typeof DataStoreUpdateEventType;

export type DataStoreEventType = DataStoreUpdateEventType;

export class DataStoreEvent extends Event {
    type: DataStoreEventType;
    store: AbstractDataStore;

    public constructor(type: DataStoreEventType, store: AbstractDataStore) {
        super(type);

        this.store = store;
    }
}

export class DataStoreUpdateEvent extends DataStoreEvent {
    public readonly changes: Record<DataStoreValidKey, DataStoreValidValue>;
    constructor(type: DataStoreEventType, store: AbstractDataStore, changes: Record<DataStoreValidKey, DataStoreValidValue>) {
        super(DataStoreUpdateEventType);
        this.changes = changes;
    }
}

/**
 * An abstraction of a method to store/retrieve keyed data.
 */
export abstract class AbstractDataStore<TKey extends DataStoreValidKey = DataStoreValidKey, TValue = DataStoreValidValue> {
    protected _eventMap: Record<string, Function[]>;

    protected constructor() {}

    /**
     * Get a specific value by key, returning undefined if the value is not found.
     * @param key The key to fetch the value of.
     */
    public abstract getValue<TValue>(key: TKey): TValue | undefined;

    /**
     * Set a specific value by key, returning true if the set is successful.
     * @param key The key of the value to store.
     * @param value The value to store at the specified key.
     */
    public abstract setValue<TValue>(key: TKey, value: TValue): Promise<boolean>;

    /**
     * Get all stored values as a record of key/value pairs.
     */
    public abstract getAll(): Record<TKey, TValue>;

    /**
     * Set all values as a record of key/value pairs.
     * @param data The data to set to.
     */
    public abstract setAll(data: Record<TKey, TValue>): Promise<boolean>;

    /**
     * Bind necessary event handlers to receive updates from Foundry or other sources.
     */
    public abstract bindEvents(): void;

    /**
     * Unbind bound event handlers to stop receive updates from Foundry or other sources.
     */
    public abstract unbindEvents(): void;

    public on(eventType: 'update', callback: Function) {}

    public off(eventType: 'update');
}
