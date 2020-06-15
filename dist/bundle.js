(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pdf_viewer_app_1 = require("./viewer/pdf-viewer-app");
Hooks.on("init", function () {
    game.pdf = {};
});
Hooks.on("ready", function () {
    new pdf_viewer_app_1.PdfViewerApp("SR5", 192).render(true);
});

},{"./viewer/pdf-viewer-app":2}],2:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfViewerApp = void 0;
// const pdfjsLib = require("../../node_modules/pdfjs-dist/build/pdf.js");
class PdfViewerApp extends Application {
    static get defaultOptions() {
        const options = super.defaultOptions;
        options.id = 'pdf-viewer';
        options.classes = ["app", "window-app", "sr5"];
        options.title = 'View PDF';
        options.template = 'modules/pdfoundry/templates/pdf-viewer-app.html';
        options.width = 8.5 * 100 + 64;
        options.height = 11 * 100 + 64;
        options.resizable = true;
        return options;
    }
    constructor(book, page) {
        super();
    }
    render(force, options) {
        return super.render(force, options);
    }
    activateListeners(html) {
        return __awaiter(this, void 0, void 0, function* () {
            const iframe = html.parents().find("iframe.pdfViewer").first().get(0);
            console.warn("HELLO");
            console.log(iframe.contentWindow);
        });
    }
    close() {
        return super.close();
    }
}
exports.PdfViewerApp = PdfViewerApp;

},{}]},{},[1]);
