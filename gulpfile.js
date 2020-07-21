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

const gulp = require('gulp');
const tasks = require('./gulp.tasks');
const logger = require('gulplog');
const chalk = require('chalk');

gulp.task('build', tasks.build);
gulp.task('rebuild', tasks.rebuild);
gulp.task('rewatch', tasks.rewatch);
gulp.task('watch', tasks.watch);
gulp.task('assets', tasks.assets);
gulp.task('clean', tasks.clean);
gulp.task('sass', tasks.sass);
gulp.task('link', tasks.link);
gulp.task('install', (resolve) => {
    if (process.argv.length < 5) {
        logger.error(chalk.red(`Error: Expected 2 arguments.`));
        logger.error(`\tUse "gulp install --[system|folder] [system_name|folder_path]"`);
        resolve();
        return;
    }
    return tasks.install({ type: process.argv[3], filepath: process.argv[4], copyDist: true });
});
gulp.task('docs', tasks.docs);
gulp.task('release', tasks.release);
exports.default = tasks.build;
