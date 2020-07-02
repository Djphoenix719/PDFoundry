'use strict';

const watchify = require('watchify');
const browserify = require('browserify');
const tsify = require('tsify');
const babelify = require('babelify');
const colors = require('colors');

const gulp = require('gulp');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const del = require('del');
const logger = require('gulplog');
const sourcemaps = require('gulp-sourcemaps');
const assign = require('lodash.assign');

// add custom browserify options here
const customOpts = {
    entries: ['./module/main.ts'],
    sourceType: 'module',
    debug: true,
};
const opts = assign({}, watchify.args, customOpts);
const b = watchify(browserify(opts));

// add transformations here
// i.e. b.transform(coffeeify);
b.plugin(tsify);
b.transform(babelify);

b.on('log', logger.info); // output build logs to terminal
b.on('update', bundle);

gulp.task('build', async () => {
    gulp.watch("templates/**/*.html").on('change', copy_html);
    gulp.watch("locale/**/*.json").on('change', copy_locale);

    await copy_html();
    await copy_locale();
    await bundle();
});

async function bundle() {
    return b.bundle()
        // log errors if they happen
        .on('error', logger.error.bind(logger, 'Browserify Error'))
        .pipe(source('bundle.js'))
        // optional, remove if you don't need to buffer file contents
        .pipe(buffer())
        // optional, remove if you dont want sourcemaps
        .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
        // Add transformation tasks to the pipeline here.
        .pipe(sourcemaps.write('./')) // writes .map file
        .pipe(gulp.dest('./pdfoundry-dist'));
}

function log(message) {
    const time = new Date();
    const timestamp = `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`.gray;
    console.log(`[${timestamp}] ${message}`);
}

async function copy_html() {
    log('Copying HTML')
    await del('./pdfoundry-dist/templates', {force: true});
    await gulp.src(['./templates/**/*']).pipe(gulp.dest('./pdfoundry-dist/templates'));
}

async function copy_locale() {
    log('Copying Locales')
    await del('./pdfoundry-dist/locale', {force: true});
    await gulp.src(['./locale/**/*']).pipe(gulp.dest('./pdfoundry-dist/locale'));
}