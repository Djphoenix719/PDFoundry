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
const colors = require('colors');
const fs = require('fs');

const watchify = require('watchify');
const browserify = require('browserify');
const tsify = require('tsify');
const babelify = require('babelify');

const sass = require('gulp-sass');
sass.compiler = require('node-sass');

const gulp = require('gulp');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const del = require('del');
const logger = require('gulplog');
const sourcemaps = require('gulp-sourcemaps');
const assign = require('lodash.assign');
const typedoc = require('gulp-typedoc');

// add custom browserify options here
const customOpts = {
    entries: ['./src/module/main.ts'],
    sourceType: 'module',
    debug: true,
};
const opts = assign({}, watchify.args, customOpts);
const b = watchify(browserify(opts));

function size(path) {
    const sizes = [
        ['B' , false, 1    ],
        ['KB', true,  2**10],
        ['MB', true,  2**20],
        ['GB', true,  2**30],
    ].reverse();

    function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function format(n, decimals) {
        if (decimals) {
            return numberWithCommas(n.toFixed(2));
        } else {
            return numberWithCommas(n);
        }
    }

    let bytes = _sizeRecursive(path);
    if (bytes === 0) bytes = 1;
    for (const [code, f, amount] of sizes) {
        if (bytes > amount) {
           return `${format(bytes/amount, f).magenta} ${code}`;
        }
    }
    return `${format(bytes, false).magenta} ${'B'}`;
}
function _sizeRecursive(path) {
    let s = 0;
    const stats = fs.statSync(path);
    if (stats.isDirectory()) {
        const children = fs.readdirSync(path);
        for (const child of children) {
            s = s + _sizeRecursive(`${path}/${child}`)
        }
    } else {
        s = stats.size;
    }
    return s;
}

const dest = './pdfoundry-dist/';

// add transformations here
// i.e. b.transform(coffeeify);
b.plugin(tsify);
b.transform(babelify);

b.on('log', logger.info); // output build logs to terminal
b.on('update', bundle);

gulp.task('build', async () => {
    gulp.watch("src/templates/**/*.html").on('change', () => copy_dir('templates', true));
    gulp.watch("locale/**/*.json").on('change', () => copy_dir('locale'));
    gulp.watch("assets/**/*").on('change', () => copy_dir('assets'));
    gulp.watch("src/css/**/*.scss").on('change', () => build_sass());
    gulp.watch("scripts/**/*.js").on('change', () => copy_dir('scripts'));

    await copy_dir('templates', true);
    await copy_dir('locale');
    await copy_dir('assets');
    await copy_dir('pdfjs');
    await copy_dir('scripts');
    await copy_file('LICENSE');

    gulp.src("manual/**/*.pdf").pipe(gulp.dest(`${dest}assets/manual/`));

    await build_sass();
    await bundle();
});

gulp.task('sass', async() => {
    await build_sass();
});

gulp.task('docs', function() {
    return gulp
        .src([
            'src/module/api/**/*',
            'src/module/app/**/*',
            'src/module/cache/**/*',
            'src/module/events/**/*',
            'src/module/types/**/*',
            'src/module/viewer/**/*',
        ])
        .pipe(typedoc({
            name: "PDFoundry",
            target: "es6",
            out: "docs/",
            mode: 'file',
            excludePrivate: true,
            excludeProtected: true,
            version: true,
            plugins: [
                'typedoc-plugin-external-module-name'
            ]
        }));
});


async function build_sass() {
    gulp.src('./src/css/bundle.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(dest));
}

async function bundle() {
    return b.bundle()
        // log errors if they happen
        .on('error', logger.error.bind(logger, 'Browserify Error'.red))
        .on('end', () => log(`Bundle complete (${size(dest).magenta})`))
        .pipe(source('bundle.js'))
        // optional, remove if you don't need to buffer file contents
        .pipe(buffer())
        // optional, remove if you dont want sourcemaps
        .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
        // Add transformation tasks to the pipeline here.
        .pipe(sourcemaps.write('./')) // writes .map file
        .pipe(gulp.dest(dest));
}

// https://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript
function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function log(message) {
    const time = new Date();

    const hh = pad(time.getHours(), 2);
    const mm = pad(time.getMinutes(), 2);
    const ss = pad(time.getSeconds(), 2);

    const timestamp = `${hh}:${mm}:${ss}`.gray;
    console.log(`[${timestamp}] ${message}`);
}

async function copy_dir(name, src = false) {
    let path = name;
    if (src) {
        path = `./src/${name}`
    }

    log(`Copying ${name.blue} (${size(path)})`);
    await del(`${dest}/${name}`, {force: true});
    await gulp.src([`${path}/**/*`]).pipe(gulp.dest(`./${dest}/${name}`));
}

async function copy_file(name, src = false) {
    let path = name;
    if (src) {
        path = `./src/${name}`
    }

    log(`Copying ${name.blue} (${size(path)})`);
    await del(`${dest}/${name}`, {force: true});
    await gulp.src([`${path}`]).pipe(gulp.dest(`./${dest}`));
}