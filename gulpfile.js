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
const { exec, execFile } = require('child_process');

// Browserify
const browserify = require('browserify');
const watchify = require('watchify');
const tsify = require('tsify');
const babelify = require('babelify');

// Sass
const sass = require('gulp-sass');
sass.compiler = require('node-sass');

// Gulp
const gulp = require('gulp');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const logger = require('gulplog');
const sourcemaps = require('gulp-sourcemaps');
const typedoc = require('gulp-typedoc');
const size = require('get-folder-size');

// Config
const distName = 'pdfoundry-dist';
const destFolder = path.resolve(process.cwd(), distName);
const destBundle = path.resolve(process.cwd(), 'bundle.js');
const destCSS = path.resolve(process.cwd(), 'bundle.css');

const baseArgs = {
    entries: ['./src/module/main.ts'],
    sourceType: 'module',
    debug: true,
};

// Watchify setup
const watchArgs = assign({}, watchify.args, baseArgs);
const watcher = watchify(browserify(watchArgs));
watcher.plugin(tsify);
watcher.transform(babelify);
watcher.on('log', logger.info);
watcher.on('update', bundle);

/**
 * UTILITIES
 */
/**
 * Get size of folder
 * @param path
 * @return {Promise<Number>}
 */
async function sizeOf(path) {
    return new Promise((resolve, reject) => {
        size(path, function (err, size) {
            if (err) reject(err);
            else resolve(size);
        });
    });
}

/**
 * Sleep for ms milliseconds then return
 * @param ms
 * @return {Promise<void>}
 */
async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function getBabelConfig() {
    return JSON.parse(fs.readFileSync('.babelrc').toString());
}

/**
 * LINK
 */
gulp.task('link', async function () {
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

    // For some reason fs.symlink perm errors, so we'll execute mklink
    // Additional support would be needed for linux based systems here
    exec(`mklink /J ${targetPath} ${destFolder}`, function (error, stdout, stderr) {
        if (error) logger.error(chalk.red(error));
        else logger.info(chalk.green(`Symlink created.`));

        process.chdir(path.resolve(targetPath, '..'));

        // Run install script to setup that system
        require(path.resolve(process.cwd(), distName, 'scripts', 'install.js'));
    });
});

/**
 * CLEAN
 */
gulp.task('clean', async function () {
    const files = fs.readdirSync(destFolder);
    for (const file of files) {
        await del(path.resolve(destFolder, file));
    }
});

/**
 * REBUILD
 */
gulp.task('rebuild', async () => {
    return gulp.series(['clean', 'build']);
});

/**
 * BUILD
 */
gulp.task('build', async () => {
    await copyStatic();

    const babel = babelify.configure(getBabelConfig());

    return browserify({
        entries: ['src/module/main.ts'],
        transform: babel,
        plugin: tsify,
        debug: true,
    })
        .bundle()
        .on('log', logger.info)
        .on('error', logger.error)
        .pipe(source('bundle.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(destFolder));
});

async function copyStatic() {
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
gulp.task('watch', async () => {
    gulp.watch('src/templates/**/*.html').on('change', () => copy_dir('templates', true));
    gulp.watch('locale/**/*.json').on('change', () => copy_dir('locale'));
    gulp.watch('assets/**/*').on('change', () => copy_dir('assets'));
    gulp.watch('src/css/**/*.scss').on('change', () => build_sass());
    gulp.watch('scripts/**/*.js').on('change', () => copy_dir('scripts'));

    await copy_dir('templates', true);
    await copy_dir('locale');
    await copy_dir('assets');
    await copy_dir('pdfjs');
    await copy_dir('scripts');
    await copy_file('LICENSE');

    gulp.src('manual/**/*.pdf').pipe(gulp.dest(`${dest}assets/manual/`));

    await build_sass();
    await bundle();
});

gulp.task('sass', async () => {
    await build_sass();
});

gulp.task('docs', function () {
    return gulp
        .src([
            'src/module/api/**/*',
            'src/module/app/**/*',
            'src/module/cache/**/*',
            'src/module/events/**/*',
            'src/module/types/**/*',
            'src/module/viewer/**/*',
        ])
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
});

async function build_sass() {
    gulp.src('./src/css/bundle.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(dest));
}

async function bundle() {
    return (
        watcher
            .bundle()
            // log errors if they happen
            .on('error', logger.error.bind(logger, 'Browserify Error'.red))
            .on('end', () => log(`Bundle complete (${size(dest).magenta})`))
            .pipe(source('bundle.js'))
            // optional, remove if you don't need to buffer file contents
            .pipe(buffer())
            // optional, remove if you dont want sourcemaps
            .pipe(sourcemaps.init({ loadMaps: true })) // loads map from browserify file
            // Add transformation tasks to the pipeline here.
            .pipe(sourcemaps.write('./')) // writes .map file
            .pipe(gulp.dest(dest))
    );
}

async function copy_dir(name, src = false) {
    let path = name;
    if (src) {
        path = `./src/${name}`;
    }

    await del(`${destFolder}/${name}`, { force: true });
    await gulp
        .src([`${path}/**/*`])
        .pipe(size())
        .pipe(gulp.dest(`./${destFolder}/${name}`));
}

async function copy_file(name, src = false) {
    let path = name;
    if (src) {
        path = `./src/${name}`;
    }

    await del(`${destFolder}/${name}`, { force: true });
    await gulp
        .src([`${path}`])
        .pipe(size())
        .pipe(gulp.dest(`./${destFolder}`));
}
