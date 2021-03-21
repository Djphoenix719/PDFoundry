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
gulp.task('docs', tasks.docs);
exports.default = tasks.build;
