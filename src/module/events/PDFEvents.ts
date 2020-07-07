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

import { PDFLog } from '../log/PDFLog';

type PDFSetupEvent = 'init' | 'setup' | 'ready';

type PDFViewerEvent = 'viewerOpen' | 'viewerClose' | 'viewerReady';

export type PDFEvent = PDFSetupEvent | PDFViewerEvent;

/**
 * @private
 */
class EventStore {
    private readonly _name: PDFEvent;
    private readonly _callbacks: Function[];

    constructor(name: PDFEvent) {
        this._name = name;
        this._callbacks = [];
    }

    /**
     * Turn on an event callback for this event.
     * @param callback The callback to turn on
     */
    public on(callback: Function) {
        if (this._callbacks === undefined) {
            return;
        }

        for (let i = 0; i < this._callbacks.length; i++) {
            if (this._callbacks[i] === callback) return;
        }

        this._callbacks.push(callback);
    }

    /**
     * Turn off an event callback for this event.
     * @param callback The callback to turn off
     */
    public off(callback: Function) {
        if (this._callbacks === undefined) {
            return;
        }

        for (let i = this._callbacks.length; i >= 0; i--) {
            if (this._callbacks[i] === callback) {
                this._callbacks.splice(i, 1);
            }
        }
    }

    /**
     * Fire an event and forward the args to all handlers
     * @param args Any arguments that should be passed to handlers
     */
    public fire(...args) {
        if (PDFEvents.DEBUG) {
            PDFLog.log(`<${this._name}>`);
            console.log(args);
        }

        for (const cb of this._callbacks) {
            cb(...args);
        }
    }
}

/**
 * Tracks and publishes events for PDF related occurrences.
 * This class is callable through `ui.PDFoundry.events`
 */
export class PDFEvents {
    /**
     * Should every event call's event name and arguments be logged?
     */
    public static DEBUG: boolean = true;

    private static _EVENTS = {
        init: new EventStore('init'),
        setup: new EventStore('setup'),
        ready: new EventStore('ready'),

        viewerOpen: new EventStore('viewerOpen'),
        viewerClose: new EventStore('viewerClose'),
        viewerReady: new EventStore('viewerReady'),
    };

    // <editor-fold desc="Setup & Initialization Events">

    /**
     * Helper method version of {@link PDFEvents.on}
     * Called when all PDFoundry init stage events are done.
     */
    public static get init() {
        return PDFEvents._EVENTS['init'].on;
    }

    /**
     * Helper method version of {@link PDFEvents.on}
     * Called when all PDFoundry setup stage events are done.
     */
    public static get setup() {
        return PDFEvents._EVENTS['setup'].on;
    }

    /**
     * Helper method version of {@link PDFEvents.on}
     * Called when all PDFoundry ready stage events are done.
     */
    public static get ready() {
        return PDFEvents._EVENTS['ready'].on;
    }

    // </editor-fold>

    // <editor-fold desc="Viewer Events">

    /**
     * Helper method version of {@link PDFEvents.on}
     * Called when a PDF viewer begins opening
     */
    public static get viewerOpen() {
        return PDFEvents._EVENTS['viewerOpen'].on;
    }

    /**
     * Helper method version of {@link PDFEvents.on}
     * Called when a PDF viewer begins closing
     */
    public static get viewerClose() {
        return PDFEvents._EVENTS['viewerClose'].on;
    }

    /**
     * Helper method version of {@link PDFEvents.on}
     * Called when a PDF viewer is ready to use
     */
    public static get viewerReady() {
        return PDFEvents._EVENTS['viewerReady'].on;
    }

    // </editor-fold>

    /**
     * Like @see {@link PDFEvents.on} but fires the event only once, then calls off.
     * @param event
     * @param callback
     */
    public static once(event: PDFEvent, callback: Function) {
        const wrapper = function (...args) {
            callback(args);
            PDFEvents.off(event, wrapper);
        };
        PDFEvents.on(event, wrapper);
    }

    /**
     * Turn on an event callback for an event.
     * @param event The name of the event
     * @param callback The callback to turn on
     */
    public static on(event: PDFEvent, callback: Function) {
        PDFEvents._EVENTS[event].on(callback);
    }

    /**
     * Turn off an event callback for an event.
     * @param event The name of the event
     * @param callback The callback to turn off
     */
    public static off(event: PDFEvent, callback: Function) {
        PDFEvents._EVENTS[event].off(callback);
    }

    public static fire(event: PDFEvent, ...args) {
        if (PDFEvents.DEBUG) {
            PDFLog.verbose(`Firing Event: ${event}`);
            console.debug(args);
        }
        PDFEvents._EVENTS[event].fire(args);
    }
}
