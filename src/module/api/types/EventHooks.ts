import { PDFoundryAPI } from '../PDFoundryAPI';
import { PDFViewer } from '../../viewer/PDFViewer';

type PDFSetupEvent = 'init' | 'setup' | 'ready';

type PDFViewerEvent = 'viewerOpen' | 'viewerClose' | 'viewerReady' | 'viewerPageRendered' | 'viewerPageChanging';

export type PDFEvent = PDFSetupEvent | PDFViewerEvent;

/**
 * An event the fires during Init, Setup, and Ready as PDfoundry performs it's startup tasks.
 */
export type CallbackSetup = (api: PDFoundryAPI) => void;

export type CallbackViewer = (viewer: PDFViewer) => void;

export type CallbackPageRendered = (viewer: PDFViewer, page: HTMLDivElement) => void;
export type CallbackPageChanging = (viewer: PDFViewer, pageNumber: number, pageLabel: string | null) => void;
