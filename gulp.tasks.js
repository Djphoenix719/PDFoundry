/*
 * Copyright 2021 Andrew Cuccinello
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
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

const BASE_BUILD_ARGUMENTS = {
    sourceType: 'module',
    debug: true,
};

const loadFoundryConfig = async (fs) => {
    let configPath = './foundryconfig.json';
    if (!fs.existsSync(configPath)) {
        configPath = './foundryconfig.default.json';
    }

    const config = JSON.parse(fs.readFileSync(configPath));
    if (!fs.existsSync(config.path.modules)) {
        throw new Error(`Path ${config.path.modules} does not exist. Did you set your config?`);
    }

    config.path.output = `${config.path.modules}/${config.dist.name}`;

    return config;
};

const loadBabelConfig = async (fs) => {
    return JSON.parse(fs.readFileSync('./.babelrc'));
};

const clean = () => {
    return new Promise(async (resolve, reject) => {
        const fs = await import('fs');
        const path = await import('path');
        const del = await import('del');
        const foundryConfig = await loadFoundryConfig(fs);
        const outputPath = foundryConfig['path']['output'];

        const files = fs.readdirSync(outputPath);
        for (const file of files) {
            del.sync(path.resolve(outputPath, file), { force: true });
        }
        resolve();
    });
};

/**
 * @param watch {boolean}
 * @return {Promise<void>}
 */
const executeBuild = (watch) => {
    return new Promise(async (resolve, reject) => {
        const fs = await import('fs');
        const path = await import('path');
        const foundryConfig = await loadFoundryConfig(fs);
        const babelConfig = await loadBabelConfig(fs);

        const browserify = (await import('browserify')).default;
        const babelify = await import('babelify');
        const tsify = (await import('tsify')).default;
        const logger = await import('gulplog');
        const sass = require('gulp-sass')(require('sass'));

        const gulp = await import('gulp');
        const buffer = (await import('vinyl-buffer')).default;
        const source = (await import('vinyl-source-stream')).default;
        const sourcemaps = await import('gulp-sourcemaps');

        const entry = foundryConfig.path.entry;

        const babel = babelify.configure(babelConfig);
        const buildArguments = {
            ...BASE_BUILD_ARGUMENTS,
            entries: [entry.script],
            transform: babel,
            plugin: [tsify],
        };

        if (watch) {
            const watchify = (await import('watchify')).default;
            buildArguments['plugin'].push(watchify);
            buildArguments['cache'] = {};
            buildArguments['packageCache'] = {};
        }

        let compiler = browserify(buildArguments);
        compiler.on('log', logger.info);
        compiler.on('error', (message) => {
            logger.error(message);
            reject(message);
        });

        const outputPath = foundryConfig['path']['output'];

        const bundle = () => {
            for (let [src, dst] of foundryConfig.path.assets) {
                dst = path.resolve(outputPath, dst);
                gulp.src(src).pipe(gulp.dest(dst));
            }

            gulp.src('src/css/bundle.scss')
                .pipe(sass.sync().on('error', sass.logError))
                .pipe(sourcemaps.init({ loadMaps: true }))
                .pipe(sourcemaps.write('./', {}))
                .pipe(gulp.dest(outputPath));

            compiler
                .bundle()
                .pipe(source(foundryConfig['dist']['bundle']))
                .pipe(buffer())
                .pipe(sourcemaps.init({ loadMaps: true }))
                .pipe(sourcemaps.write('./', {}))
                .pipe(gulp.dest(outputPath));
        };

        if (watch) {
            compiler.on('update', bundle);
            for (let [src, dst] of foundryConfig.path.assets) {
                dst = path.resolve(outputPath, dst);
                gulp.watch(src).on('change', bundle);
            }
        } else {
            compiler.on('bundle', resolve);
        }

        bundle();
    });
};

const watch = () => executeBuild(true);
const build = () => executeBuild(false);

module.exports = {
    build,
    watch,
    clean,
};
