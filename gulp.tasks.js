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

'use strict';
const fs = require('fs');
const path = require('path');
const del = require('del');
const assign = require('lodash.assign');
const chalk = require('chalk');
const spawn = require('child_process').spawn;

// Browserify
const browserify = require('browserify');
const watchify = require('watchify');
const tsify = require('tsify');
const babelify = require('babelify');

// Sass
const gulpsass = require('gulp-sass');
gulpsass.compiler = require('node-sass');

// Gulp
const gulp = require('gulp');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const logger = require('gulplog');
const sourcemaps = require('gulp-sourcemaps');
const typedoc = require('gulp-typedoc');

let foundryConfig;
if (fs.existsSync('./foundryconfig.json')) {
    foundryConfig = JSON.parse(fs.readFileSync('./foundryconfig.json'));
} else {
    foundryConfig = {
        dataPath: '',
    };
}

// Config
const distName = 'pdfoundry';
const destFolder = path.resolve(foundryConfig['dataPath'], distName);
const docsFolder = path.resolve(process.cwd(), 'docs');
const jsBundle = 'bundle.js';

logger.info(`Writing to ${destFolder}`);

const baseArgs = {
    entries: ['./src/pdfoundry/Main.ts'],
    sourceType: 'module',
    debug: true,
    standalone: 'PDFoundry',
};

/**
 * UTILITIES
 */
function getBabelConfig() {
    return JSON.parse(fs.readFileSync('.babelrc').toString());
}

function gettsConfig() {
    return JSON.parse(fs.readFileSync('tsconfig.json').toString());
}

function resolveRequires() {
    const tsconfig = gettsConfig();
    const root = tsconfig['compilerOptions']['baseUrl'];
    const paths = tsconfig['compilerOptions']['paths'];

    const requires = [];
    for (const [key, relatives] of Object.entries(paths)) {
        for (const relative of relatives) {
            requires.push([key, path.resolve(root, relative)]);
        }
    }
    return requires;
}

/**
 * CLEAN
 * Removes all files from the dist folder
 */
async function cleanDist() {
    const files = fs.readdirSync(destFolder);
    for (const file of files) {
        await del(path.resolve(destFolder, file), { force: true });
    }
}

async function cleanDocs() {
    const files = fs.readdirSync(docsFolder);
    for (const file of files) {
        await del(path.resolve(destFolder, file), { force: true });
    }
}

/**
 * BUILD
 */
async function buildJS() {
    const babel = babelify.configure(getBabelConfig());

    const buildArgs = assign({}, baseArgs, {
        transform: babel,
        plugin: tsify,
    });

    const b = browserify(buildArgs);

    for (const [expose, path] of resolveRequires()) {
        b.require(path, { expose });
    }

    return b
        .bundle()
        .on('log', logger.info)
        .on('error', logger.error)
        .pipe(source(jsBundle))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(destFolder));
}

/**
 * COPY ASSETS
 */
async function copyAssets() {
    gulp.src('module.json').pipe(gulp.dest(destFolder));
    gulp.src('assets/**/*').pipe(gulp.dest(path.resolve(destFolder, 'assets')));
    gulp.src('manual/**/*.pdf').pipe(gulp.dest(path.resolve(destFolder, 'assets', 'manual')));
    gulp.src('src/templates/**/*').pipe(gulp.dest(path.resolve(destFolder, 'templates')));
    gulp.src('locale/**/*').pipe(gulp.dest(path.resolve(destFolder, 'locale')));
    gulp.src('pdfjs/**/*').pipe(gulp.dest(path.resolve(destFolder, 'pdfjs')));
    gulp.src('LICENSE').pipe(gulp.dest(destFolder));
}

/**
 * WATCH
 */
async function watch() {
    // Helper - watch the pattern, copy the output on change
    function watch(pattern, out) {
        gulp.watch(pattern).on('change', () => gulp.src(pattern).pipe(gulp.dest(path.resolve(destFolder, out))));
    }

    watch('module.json', '');
    watch('assets/**/*', 'assets');
    watch('manual/**/*.pdf', ['assets', 'manual']);
    watch('src/templates/**/*', 'templates');
    watch('locale/**/*', 'locale');
    watch('pdfjs/**/*', 'pdfjs');
    watch('src/scripts/**/*', 'scripts');
    watch('LICENSE', '');

    gulp.watch('src/css/**/*.scss').on('change', async () => await buildSass());

    // Watchify setup
    const watchArgs = assign({}, watchify.args, baseArgs);
    const watcher = watchify(browserify(watchArgs));
    watcher.plugin(tsify);
    watcher.transform(babelify);
    watcher.on('log', logger.info);

    for (const [expose, path] of resolveRequires()) {
        watcher.require(path, { expose });
    }

    function bundle() {
        return (
            watcher
                .bundle()
                // log errors if they happen
                .on('error', logger.error.bind(logger, chalk.red('Browserify Error')))
                .pipe(source(jsBundle))
                .pipe(buffer())
                .pipe(sourcemaps.init({ loadMaps: true }))
                .pipe(sourcemaps.write('./'))
                .pipe(gulp.dest(destFolder))
        );
    }

    watcher.on('update', bundle);
    if (process.argv.includes('--docs')) {
        watcher.on('update', docs);
        await docs();
    }

    bundle();
}

/**
 * SASS
 */
async function buildSass() {
    return gulp
        .src('src/css/bundle.scss')
        .pipe(gulpsass().on('error', gulpsass.logError))
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(destFolder));
}

/**
 * DOCS
 */
async function docs() {
    return gulp
        .src(['src/pdfoundry/**/*.ts'])
        .on('error', function (error) {
            logger.error(error);
            this.emit('end');
        })
        .pipe(
            typedoc({
                name: 'PDFoundry',
                target: 'es6',
                out: 'docs/',
                mode: 'modules',
                plugins: ['@convergencelabs/typedoc-plugin-custom-modules'],
                exclude: ['./src/pdfoundry/util.ts'],
                readme: './EXAMPLES.md',
                excludePrivate: true,
                excludeProtected: true,
                stripInternal: true,
                version: true,
            }),
        );
}

exports.clean = cleanDist;
exports.assets = copyAssets;
exports.sass = buildSass;
exports.docs = gulp.series(cleanDocs, docs);
exports.build = gulp.series(copyAssets, buildSass, buildJS);
exports.rebuild = gulp.series(cleanDist, exports.build);

exports.watch = gulp.series(exports.build, watch);
exports.rewatch = gulp.series(cleanDist, exports.watch);
