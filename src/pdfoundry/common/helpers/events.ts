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

import Api from '../../Api';

/**
 * @private
 */
export default class EventStore<TKeys extends string = string> {
    private readonly _map: Map<string, Function[]>;

    public constructor() {
        this._map = new Map<string, Function[]>();
    }

    /**
     * Turn on an event callback for the specified event.
     * @param eventName
     * @param callback
     */
    public on(eventName: TKeys, callback: Function) {
        if (!this._map.has(eventName)) {
            this._map.set(eventName, []);
        }

        const callbacks = this._map.get(eventName) as Function[];
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
    public once(eventName: TKeys, callback: Function) {
        const that = this;
        const wrapper = function (...args) {
            callback(args);
            that.off(eventName, wrapper);
        };
        that.on(eventName, wrapper);
    }

    /**
     * Turn off an event callback for the specified event.
     * @param eventName
     * @param callback
     */
    public off(eventName: TKeys, callback: Function) {
        if (!this._map.has(eventName)) {
            this._map.set(eventName, []);
        }

        const callbacks = this._map.get(eventName) as Function[];
        for (let i = 0; i < callbacks.length; i++) {
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
    public fire(eventName: TKeys, ...args) {
        if (Api.DEBUG.EVENTS) {
            console.debug(`PDFoundry::${eventName}`);
            console.debug(args);
        }

        if (!this._map.has(eventName)) {
            return;
        }

        const callbacks = this._map.get(eventName) as Function[];
        for (const callback of callbacks) {
            callback(...args);
        }
    }
}
