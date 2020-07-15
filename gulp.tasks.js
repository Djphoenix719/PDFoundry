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
const { exec } = require('child_process');

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

// Config
const distName = 'pdfoundry-dist';
const destFolder = path.resolve(process.cwd(), distName);
const jsBundle = 'bundle.js';

const baseArgs = {
    entries: ['./src/module/main.ts'],
    sourceType: 'module',
    debug: true,
};

/**
 * UTILITIES
 */
function getBabelConfig() {
    return JSON.parse(fs.readFileSync('.babelrc').toString());
}

/**
 * LINK
 * Setups up a system by creating a symlink of the dist folder and running the install script
 */
async function link() {
    if (process.argv.length < 5) {
        logger.error(`${chalk.red('Link requires 2 arguments')}: gulp link --system <system name>`);
        return;
    }
    const [nodePath, gulpPath, task, linkType, linkName] = process.argv;

    if (linkType !== '--system') {
        logger.error(`${chalk.red('Error: Curently only --system is supported')}`);
        return;
    }

    const systemPath = path.resolve(process.cwd(), '../..', 'systems', linkName);
    const targetPath = path.resolve(systemPath, distName);

    logger.info(`Linking to "${chalk.green(targetPath)}"`);

    try {
        if (fs.readlinkSync(targetPath)) {
            fs.unlinkSync(targetPath);
        }
    } catch (error) {
        // Link does not exist
    }

    try {
        if (fs.existsSync(targetPath)) {
            await del(targetPath, { force: true });
        }
    } catch (error) {
        // Folder does not exist
    }

    // For some reason fs.symlink perm errors, so we'll execute mklink
    // Additional support would be needed for linux based systems here
    exec(`mklink /J ${targetPath} ${destFolder}`, function (error, stdout, stderr) {
        if (error) logger.error(chalk.red(error));
        else logger.info(chalk.green(`Symlink created.`));

        process.chdir(path.resolve(targetPath, '..'));

        // Run install script to setup that system
        require(path.resolve(process.cwd(), distName, 'scripts', 'install.js'));
    });
}

/**
 * CLEAN
 * Removes all files from the dist folder
 */
async function cleanDist() {
    const files = fs.readdirSync(destFolder);
    for (const file of files) {
        await del(path.resolve(destFolder, file));
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

    return browserify(buildArgs)
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
    gulp.src('assets/**/*').pipe(gulp.dest(path.resolve(destFolder, 'assets')));
    gulp.src('manual/**/*.pdf').pipe(gulp.dest(path.resolve(destFolder, 'assets', 'manual')));
    gulp.src('src/templates/**/*').pipe(gulp.dest(path.resolve(destFolder, 'templates')));
    gulp.src('locale/**/*').pipe(gulp.dest(path.resolve(destFolder, 'locale')));
    gulp.src('pdfjs/**/*').pipe(gulp.dest(path.resolve(destFolder, 'pdfjs')));
    gulp.src('src/scripts/**/*').pipe(gulp.dest(path.resolve(destFolder, 'scripts')));
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
        .src(['src/module/**/*'])
        .on('error', function (error) {
            logger.error(error);
            this.emit('end');
        })
        .pipe(
            typedoc({
                name: 'PDFoundry',
                target: 'es6',
                out: 'docs/',
                mode: 'file',
                excludePrivate: true,
                excludeProtected: true,
                version: true,
                plugins: ['typedoc-plugin-external-module-name'],
            }),
        );
}

exports.clean = cleanDist;
exports.assets = copyAssets;
exports.sass = buildSass;
exports.link = link;
exports.docs = docs;
exports.build = gulp.series(copyAssets, buildSass, buildJS);
exports.watch = gulp.series(exports.build, watch);
exports.rebuild = gulp.series(cleanDist, exports.build);
