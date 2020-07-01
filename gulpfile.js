'use strict';

const watchify = require('watchify');
const browserify = require('browserify');
const tsify = require('tsify');
const babelify = require('babelify');

const gulp = require('gulp');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const log = require('gulplog');
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

gulp.task('build', bundle); // so you can run `gulp js` to build the file
b.on('update', bundle); // on any dep update, runs the bundler
b.on('log', log.info); // output build logs to terminal

function bundle() {
    return b.bundle()
        // log errors if they happen
        .on('error', log.error.bind(log, 'Browserify Error'))
        .pipe(source('bundle.js'))
        // optional, remove if you don't need to buffer file contents
        .pipe(buffer())
        // optional, remove if you dont want sourcemaps
        .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
        // Add transformation tasks to the pipeline here.
        .pipe(sourcemaps.write('./')) // writes .map file
        .pipe(gulp.dest('./pdfoundry-dist'));
}