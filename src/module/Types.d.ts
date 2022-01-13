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

declare namespace PDFJS {
    type File = string | ArrayBuffer;

    interface PDFApplication {
        readonly downloadComplete: boolean;

        readonly eventBus: EventBus;

        readonly initialized: boolean;
        get initializedPromise(): Promise<void>;

        initialBookmark: string;

        readonly metadata: Map<string, string>;

        get page(): number;
        set page(value: number);

        get pagesCount(): number;

        readonly pdfDocument: PDFDocumentProxy;
        readonly pdfViewer: PDFViewer;

        readonly scriptingReady: boolean;

        open(file: File): Promise<void>;
    }

    type PDFEvent =
        | 'afterprint'
        | 'attachmentsloaded'
        | 'beforeprint'
        | 'currentoutlineitem'
        | 'cursortoolchanged'
        | 'documentproperties'
        | 'download'
        | 'fileattachmentannotation'
        | 'fileinputchange'
        | 'find'
        | 'findbarclose'
        | 'findfromurlhash'
        | 'firstpage'
        | 'hashchange'
        | 'lastpage'
        | 'layersloaded'
        | 'localized'
        | 'namedaction'
        | 'nextpage'
        | 'openfile'
        | 'optionalcontentconfig'
        | 'optionalcontentconfigchanged'
        | 'outlineloaded'
        | 'pagechanging'
        | 'pagemode'
        | 'pagenumberchanged'
        | 'pagerender'
        | 'pagerendered'
        | 'pagesloaded'
        | 'presentationmode'
        | 'presentationmodechanged'
        | 'previouspage'
        | 'print'
        | 'resetlayers'
        | 'resize'
        | 'rotateccw'
        | 'rotatecw'
        | 'rotationchanging'
        | 'save'
        | 'scalechanged'
        | 'scalechanging'
        | 'scrollmodechanged'
        | 'secondarytoolbarreset'
        | 'sidebarviewchanged'
        | 'spreadmodechanged'
        | 'switchcursortool'
        | 'switchscrollmode'
        | 'switchspreadmode'
        | 'textlayerrendered'
        | 'togglelayerstree'
        | 'toggleoutlinetree'
        | 'updatefindcontrolstate'
        | 'updatefindmatchescount'
        | 'updatetextlayermatches'
        | 'updateviewarea'
        | 'zoomin'
        | 'zoomout'
        | 'zoomreset';

    interface EventBus {
        on(eventName: PDFEvent, listener: Function, options?: EventBusRegisterArguments): void;
        off(eventName: PDFEvent, listener: Function): void;
    }

    interface EventBusRegisterArguments {
        once: boolean;
    }

    interface PDFViewer {
        // TODO
        get pagesPromise(): Promise<unknown>;
    }

    interface PDFDocumentProxy {
        get fingerprint(): string;
        get numPages(): number;
    }
}
