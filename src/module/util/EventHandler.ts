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

type EventCallback = (...args: any[]) => void;
export class EventHandler<TEvents extends string> {
    private readonly _map: Map<TEvents, EventCallback[]>;

    public constructor() {
        this._map = new Map<TEvents, EventCallback[]>();
    }

    /**
     * Turn on an event callback for the specified event.
     * @param eventName
     * @param callback
     */
    public on<TName extends TEvents>(eventName: TName, callback: EventCallback) {
        if (!this._map.has(eventName)) {
            this._map.set(eventName, []);
        }

        let callbacks = this._map.get(eventName) ?? [];
        for (let i = 0; i < callbacks.length; i++) {
            if (callbacks[i] === callback) return;
        }
        callbacks.push(callback);
    }

    /**
     * Like {@see on} but only fires once.
     * @param eventName
     * @param callback
     */
    public once<TName extends TEvents>(eventName: TName, callback: EventCallback) {
        const that = this;
        const wrapper = function (...args) {
            callback(args);
            // TODO: These two calls can probably be typed correctly, but for now this is fine.
            that.off(eventName, wrapper as EventCallback);
        };
        that.on(eventName, wrapper as EventCallback);
    }

    /**
     * Turn off an event callback for the specified event.
     * @param eventName
     * @param callback
     */
    public off<TName extends TEvents>(eventName: TName, callback: EventCallback) {
        if (!this._map.has(eventName)) {
            this._map.set(eventName, []);
        }

        let callbacks = this._map.get(eventName) ?? [];
        for (let i = callbacks.length - 1; i >= 0; i--) {
            if (callbacks[i] === callback) {
                callbacks.splice(i, 1);
            }
        }
    }

    /**
     * Fire an event and forward the args to all handlers
     * @param eventName
     * @param args
     */
    public fire<TName extends TEvents>(eventName: TName, ...args) {
        if (!this._map.has(eventName)) {
            return;
        }

        let callbacks = this._map.get(eventName) ?? [];
        for (const callback of callbacks) {
            callback(args);
        }
    }
}
