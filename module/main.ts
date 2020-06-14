import { PdfViewerApp } from "./viewer/pdf-viewer-app";


Hooks.on("init", function () {
    game.pdf = {}
});

Hooks.on("ready", function () {
    new PdfViewerApp("SR5", 192).render(true);
});