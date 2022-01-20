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
        get initializedPromise(): Promise<void>;
        get page(): number;
        get pagesCount(): number;
        initialBookmark: string;
        open(file: File): Promise<void>;
        readonly downloadComplete: boolean;
        readonly eventBus: EventBus;
        readonly initialized: boolean;
        readonly metadata: Map<string, string>;
        readonly pdfDocument: PDFDocumentProxy;
        readonly pdfViewer: PDFViewer;
        readonly scriptingReady: boolean;
        set page(value: number);
    }

    interface FieldObject {
        defaultValue: string | null;
        editable: boolean;
        hidden: boolean;
        id: string;
        multiline: boolean;
        name: string;
        page: number;
        password: boolean;
        rect: [number, number, number, number];
        type: string;
        value: string;
    }
    interface AnnotationLayerBuilder {
        annotationStorage: AnnotationStorage;
        div: HTMLDivElement;
        _fieldObjectsPromise: Promise<Record<string, FieldObject[]>>;
        _hasJSActionsPromise: Promise<boolean>;
    }

    interface PDFPageView {
        // TODO: Flesh out.
        annotationLayer: AnnotationLayerBuilder;
        div: HTMLDivElement;
        pageDiv: HTMLDivElement;
        scale: number;
    }

    interface TextLayerBuilder {
        pageNumber: number;
        renderingDone: boolean;
        textDivs: HTMLElement[];
        textDivLayer: HTMLDivElement;
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

    interface PDFEventArgsPageRendered {
        cssTransform: boolean;
        error: null | Error;
        pageNumber: number;
        source: PDFPageView;
        timestamp: number;
    }
    interface PDFEventArgsTextLayerRendered {
        numTextDivs: number;
        pageNumber: number;
        source: TextLayerBuilder;
    }

    interface PDFViewer {
        // TODO
        container: HTMLDivElement;
        get pagesPromise(): Promise<unknown>;
    }

    interface PDFDocumentProxy {
        get fingerprint(): string;
        get numPages(): number;
        get annotationStorage(): AnnotationStorage;
    }

    interface AnnotationStorage {
        onResetModified(): void;
        onSetModified(): void;
        _modified: boolean;
        _storage: Map<string, object>;
        lastModified: string;
    }
}
