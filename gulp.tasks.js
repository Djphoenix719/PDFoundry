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

// Config
const distName = 'pdfoundry-dist';
const destFolder = path.resolve(process.cwd(), distName);
const jsBundle = 'bundle.js';

const baseArgs = {
    entries: ['./src/pdfoundry/main.ts'],
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

    return gulp.src(destFolder).pipe(gulp.symlink(systemPath, { overwrite: true, useJunctions: true }));
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
                mode: 'file',
                exclude: './src/pdfoundry/util.ts',
                excludePrivate: true,
                excludeProtected: true,
                stripInternal: true,
                disableSources: true,
                version: true,
            }),
        );
}

/**
 * RELEASE
 */
function release() {
    const fetch = require('node-fetch');
    const JSSoup = require('jssoup').default;

    const archiver = require('archiver');
    const extractZip = require('extract-zip');

    const installersRoot = `installers`;
    let messagePrefix = '-----';
    const excluded = new Map([]);
    return new Promise(async (coreResolve, coreReject) => {
        const cTitle = chalk.green;
        const cName = chalk.magenta;
        const cLink = chalk.blue;
        const cError = chalk.red;
        if (!fs.existsSync(installersRoot)) {
            fs.mkdirSync(installersRoot);
        }

        const findFile = (root, file) => {
            const queue = [];
            queue.push(root);

            while (queue.length > 0) {
                const next = queue.pop();

                if (next[next.length - 1] === file) {
                    return path.resolve(...next);
                }

                const nAbs = path.resolve(...next);
                if (fs.statSync(nAbs).isDirectory()) {
                    for (const child of fs.readdirSync(nAbs)) {
                        queue.unshift([...next, child]);
                    }
                }
            }
            return undefined;
        };

        const distPath = path.resolve('./', distName);

        // Write object properties
        const installIntoSystem = (system, template) => {
            // <editor-fold desc="System">
            const systemData = JSON.parse(fs.readFileSync(system).toString());
            if (!systemData.hasOwnProperty('esmodules')) {
                systemData['esmodules'] = [];
            }

            if (!systemData.esmodules.includes('pdfoundry-dist/bundle.js')) {
                systemData.esmodules.push('pdfoundry-dist/bundle.js');
            }
            // </editor-fold>

            // <editor-fold desc="Template">
            const templateData = JSON.parse(fs.readFileSync(template).toString());
            if (!templateData.hasOwnProperty('Item')) {
                templateData['Item'] = {};
            }

            if (!templateData.Item.hasOwnProperty('types')) {
                templateData.Item['types'] = [];
            }
            if (!templateData.Item.types.includes('PDFoundry_PDF')) {
                templateData.Item.types.push('PDFoundry_PDF');
            }

            if (!templateData.Item.hasOwnProperty('PDFoundry_PDF')) {
                templateData.Item['PDFoundry_PDF'] = {};
            }

            const properties = [
                ['url', ''],
                ['code', ''],
                ['offset', 0],
                ['cache', false],
            ];

            for (const [key, value] of properties) {
                if (!templateData.Item.PDFoundry_PDF.hasOwnProperty(key)) {
                    templateData.Item.PDFoundry_PDF[key] = value;
                    continue;
                }

                if (!templateData.Item.PDFoundry_PDF[key] !== value) {
                    templateData.Item.PDFoundry_PDF[key] = value;
                }
            }
            // </editor-fold>

            fs.writeFileSync(system, JSON.stringify(systemData, null, 2));
            fs.writeFileSync(template, JSON.stringify(templateData, null, 2));

            return { systemData, templateData };
        };

        const processed = new Set();
        const processManifest = (href) => {
            return new Promise((resolve, reject) => {
                fetch(href)
                    .then((res) => res.text())
                    .then(async (body) => {
                        const system = JSON.parse(body);
                        const { download, name, title, version } = system;

                        if (processed.has(name)) {
                            logger.info(`${cError('Skipping duplicate')}: ${cTitle(title)}`);
                            resolve();
                            return;
                        }
                        if (excluded.has(name)) {
                            logger.info(`${cError('Skipping excluded')}: ${cTitle(title)}`);
                            resolve();
                            return;
                        }

                        if (download && name && title && version) {
                            logger.info(`${cLink(processed.size + 1)} - Found a system: ${cTitle(title)} (${cName(name)})`);

                            const sourceZipPath = path.resolve(installersRoot, `${name}.zip`);
                            const sourceZipStream = fs.createWriteStream(sourceZipPath);
                            const sourceFolderPath = path.resolve(installersRoot, name);
                            const destZipPath = path.resolve(installersRoot, `${name}_v${version}.zip`);
                            fetch(download).then((res) => {
                                res.body.pipe(sourceZipStream).on('finish', async () => {
                                    await extractZip(sourceZipPath, { dir: sourceFolderPath });
                                    await del(sourceZipPath);

                                    if (findFile([installersRoot, sourceFolderPath], distName) !== undefined) {
                                        await del(sourceFolderPath);

                                        logger.info(`${cError('Skipping')} ${cTitle(title)}: PDFoundry is already installed.`);
                                        excluded.set(name, `${title} [${name}] already includes PDFoundry as part of the system.`);
                                        resolve();
                                        return;
                                    }

                                    const system = findFile([installersRoot, sourceFolderPath], 'system.json');
                                    const template = findFile([installersRoot, sourceFolderPath], 'template.json');
                                    logger.info(`${cTitle(title)}'s ${cName('system.json')} is located at ${cLink(system)}`);
                                    logger.info(`${cTitle(title)}'s ${cName('template.json')} is located at ${cLink(template)}`);

                                    installIntoSystem(system, template);
                                    logger.info(`Installed into ${cName('system.json')} and ${cName('template.json')}.`);

                                    const destBundleStream = fs.createWriteStream(destZipPath);
                                    const archive = archiver('zip', {
                                        zlib: { level: 9 },
                                    });

                                    await archive.append(fs.createReadStream(system), {
                                        name: 'system.json',
                                    });
                                    logger.info(`Wrote ${cName('system.json')} into archive.`);
                                    await archive.append(fs.createReadStream(template), {
                                        name: 'template.json',
                                    });
                                    logger.info(`Wrote ${cName('template.json')} into archive.`);
                                    await archive.directory(distPath, distName);
                                    logger.info(`Wrote ${cName(distName)} into archive.`);

                                    await archive.pipe(destBundleStream);
                                    await archive.finalize();
                                    await del(sourceFolderPath);

                                    logger.info(`Build complete for ${cTitle(title)} (${cName(name)})!`);
                                    processed.add(name);
                                    resolve();
                                });
                            });
                        } else {
                            logger.info(cError(`Invalid system at ${href}`));
                            resolve();
                        }
                    });
            });
        };

        fetch('https://foundryvtt.com/packages/systems')
            .then((res) => res.text())
            .then(async (body) => {
                const soup = new JSSoup(body);
                const anchors = new Set(soup.findAll('a'));

                for (const anchor of anchors) {
                    const ref = anchor.attrs.href.toLowerCase();
                    if (ref.indexOf('.json') === -1) {
                        continue;
                    }

                    if (ref.indexOf('github') >= 1) {
                        logger.info(`Processing ${cTitle('GitHub')} repository ${cLink(ref)}`);
                        logger.info('----------------------------------------');
                        await processManifest(ref);
                        logger.info('----------------------------------------');
                    } else if (ref.includes('gitlab') >= 1) {
                        logger.info(`Processing ${cTitle('GitLab')} repository ${cLink(ref)}`);
                        logger.info('----------------------------------------');
                        await processManifest(ref);
                        logger.info('----------------------------------------');
                    }
                }

                fs.writeFileSync('body', `${messagePrefix}\n${Array.from(excluded.values()).join('\n')}`);

                coreResolve();
            });
    });
}

exports.clean = cleanDist;
exports.assets = copyAssets;
exports.sass = buildSass;
exports.link = link;
exports.docs = docs;
exports.build = gulp.series(copyAssets, buildSass, buildJS);
exports.rebuild = gulp.series(cleanDist, exports.build);
exports.release = gulp.series(exports.build, release);

exports.watch = gulp.series(exports.build, watch);
exports.rewatch = gulp.series(cleanDist, exports.watch);
