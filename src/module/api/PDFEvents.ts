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

import { PDFEvent, CallbackSetup, CallbackViewer, CallbackPageRendered, CallbackPageChanging } from './types/EventHooks';

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
            console.debug(`<${this._name}>`);
            console.debug(args);
        }

        for (const cb of this._callbacks) {
            cb(...args);
        }
    }
}

/**
 * Tracks and publishes events for PDF related occurrences. This class is callable through `ui.PDFoundry.events`.
 * All event properties of this class are accessible with the `on` method or via helper methods which contain additional
 * type hinting.
 */
export class PDFEvents {
    /**
     * If set to true, every event call will be logged. Functions much in the same manner that `CONFIG.debug.hooks` does.
     */
    public static DEBUG: boolean = false;

    private static _EVENTS = {
        init: new EventStore('init'),
        setup: new EventStore('setup'),
        ready: new EventStore('ready'),

        viewerOpen: new EventStore('viewerOpen'),
        viewerClose: new EventStore('viewerClose'),
        viewerReady: new EventStore('viewerReady'),

        viewerPageRendered: new EventStore('viewerPageRendered'),
    };

    // <editor-fold desc="Setup & Initialization Events">

    /**
     * Called when all PDFoundry init stage tasks are done.
     * @param cb
     */
    public static init(cb: CallbackSetup) {
        return PDFEvents._EVENTS['init'].on(cb);
    }

    /**
     * Called when all PDFoundry setup stage tasks are done.
     * @param cb
     */
    public static setup(cb: CallbackSetup) {
        return PDFEvents._EVENTS['setup'].on(cb);
    }

    /**
     * Called when all PDFoundry ready stage tasks are done.
     * @param cb
     */
    public static ready(cb: CallbackSetup) {
        return PDFEvents._EVENTS['ready'].on(cb);
    }

    // </editor-fold>

    // <editor-fold desc="Viewer Events">

    /**
     * Called when a PDF viewer begins opening
     * @param cb
     */
    public static viewerOpen(cb: CallbackViewer) {
        return PDFEvents._EVENTS['viewerOpen'].on(cb);
    }

    /**
     * Called when a PDF viewer begins closing
     * @param cb
     */
    public static viewerClose(cb: CallbackViewer) {
        return PDFEvents._EVENTS['viewerClose'].on(cb);
    }

    /**
     * Called when a PDF viewer is ready to use
     * @param cb
     */
    public static viewerReady(cb: CallbackViewer) {
        return PDFEvents._EVENTS['viewerReady'].on(cb);
    }

    /**
     * Called when a new page has finished rendering. The inner HTML of the div provided by this event will
     * be replaced if the user scrolls the page out of view.
     * @param cb
     */
    public static viewerPageRendered(cb: CallbackPageRendered) {
        return PDFEvents._EVENTS['viewerPageRendered'].on(cb);
    }

    /**
     * Called when the page is changed.
     * @param cb
     */
    public static viewerPageChanging(cb: CallbackPageChanging) {
        return PDFEvents._EVENTS['viewerPageChanging'].on(cb);
    }

    // </editor-fold>

    /**
     * Like {@link PDFEvents.on} but fires the event only once, then calls off. See individual events for callback
     * function parameters.
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
            console.debug(`Firing Event: ${event}`);
            console.debug(args);
        }
        PDFEvents._EVENTS[event].fire(args);
    }
}
