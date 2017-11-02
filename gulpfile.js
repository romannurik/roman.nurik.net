/*
 * Copyright 2015 Google Inc.
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

var browserify = require('browserify');
var browserSync = require('browser-sync');
var buffer = require('vinyl-buffer');
var del = require('del');
var exclude = require('gulp-ignore').exclude;
var fs = require('fs');
var gulp = require('gulp');
var merge = require('merge-stream');
var path = require('path');
var reload = browserSync.reload;
var requireDir = require('require-dir');
var runSequence = require('run-sequence');
var source = require('vinyl-source-stream');

var $ = require('gulp-load-plugins')();

// include local packages
var localPlugins = {};
try { localPlugins = requireDir('local_node_modules', {camelcase:true}); } catch (err) {}


var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];


function errorHandler(error) {
  console.error(error.stack);
  this.emit('end'); // http://stackoverflow.com/questions/23971388
}


// Lint JavaScript
gulp.task('js', function() {
  var streams = [];
  if (fs.existsSync('app/scripts')) {
    fs.readdirSync('app/scripts').forEach(file => {
      if (file.match(/^[^_].+\.js$/)) {
        streams.push(browserify('app/scripts/' + file)
            .bundle()
            .pipe(source(file))
            .pipe(buffer())
            .pipe(gulp.dest('.tmp/scripts'))
            .pipe($.uglify())
            .pipe(gulp.dest('dist/scripts')));
      }
    });
  }

  return merge(streams);
});

// Bower
gulp.task('bower', function() {
  return $.bower()
      .pipe(exclude('**/.*'))
      .pipe(exclude('**/*.md'))
      .pipe(exclude('**/*.json'))
      .pipe(exclude('**/*.coffee'))
      .pipe(exclude('**/src/**'))
      .pipe(gulp.dest('dist/lib'));
});

// Optimize Images
gulp.task('media', function () {
  var stream1 = gulp.src('app/media/**/*')
    .pipe(gulp.dest('dist/media'))
    .pipe($.size({title: 'media'}));

  var stream2 = gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin({
      progressive: true,
      interlaced: true,
      svgoPlugins: [{removeTitle: true}],
    })))
    .pipe(gulp.dest('dist/images'))
    .pipe($.size({title: 'images'}));

  return merge(stream1, stream2);
});

// Copy All Files At The Root Level (app) and lib
gulp.task('copy', function () {
  return gulp.src([
    'app/*',
    '!app/html',
    '!app/data'
  ], {dot: true})
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'copy'}));
});

// Libs
gulp.task('lib', function () {
  return gulp.src([
    'app/lib/**/*'
  ], {
    dot: true
  }).pipe(gulp.dest('dist/lib'))
    .pipe($.size({title: 'lib'}));
});


// Compile and Automatically Prefix Stylesheets
gulp.task('styles', function () {
  // For best performance, don't add Sass partials to `gulp.src`
  return gulp.src([
      'app/styles/*.scss',
      'app/styles/**/*.css',
    ])
    .pipe($.changed('styles', {extension: '.scss'}))
    .pipe($.sass({
      style: 'expanded',
      precision: 10,
      quiet: true
    }).on('error', errorHandler))
    .pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(gulp.dest('.tmp/styles'))
    // Concatenate And Minify Styles
    .pipe($.if('*.css', $.csso()))
    .pipe(gulp.dest('dist/styles'))
    .pipe($.size({title: 'styles'}));
});

// HTML
gulp.task('html', function () {
  return gulp.src([
      'app/html/**/*.html',
      '!app/html/**/_*.html'
    ])
    .pipe($.nucleus({
      dataPath: 'app/data',
      setupSwig: sw => {
        sw.setFilter('slug', input => input.toLowerCase().replace(/[^\w]+/g, '-'));
        sw.setFilter('material_color', input => {
          let parts = input.toLowerCase().split(/\s+/g);
          if (parts[0] == 'material' && parts.length >= 3) {
            return localPlugins.materialColor(parts[1], parts[2]);
          }
          return input;
        });
      }
    }))
    .pipe(gulp.dest('.tmp'))
    .pipe($.if('*.html', $.minifyHtml()))
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'html'}));
});

// Clean Output Directory
gulp.task('clean', function(cb) {
  del.sync(['.tmp', 'dist']);
  $.cache.clearAll();
  cb();
});

// Watch Files For Changes & Reload
gulp.task('serve', ['styles', 'js', 'bower', 'html'], function () {
  browserSync({
    notify: false,
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: {
      baseDir: ['.tmp', 'app']
    }
  });

  gulp.watch(['app/data/**/*'], ['html', reload]);
  gulp.watch(['app/html/**/*.html'], ['html', reload]);
  gulp.watch(['app/styles/**/*.{scss,css}'], ['styles', reload]);
  gulp.watch(['app/scripts/**/*.js'], ['js', reload]);
  gulp.watch(['app/media/**/*'], reload);
  gulp.watch(['app/images/**/*'], reload);
  gulp.watch(['app/templates/**/*'], reload);
});

// Build and serve the output from the dist build
gulp.task('serve:dist', ['default'], function () {
  browserSync({
    notify: false,
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: 'dist'
  });
});

// Build Production Files, the Default Task
gulp.task('default', ['clean'], function (cb) {
  runSequence('styles',
      ['js', 'bower', 'html', 'media', 'lib', 'copy'],
      cb);
});

// Deploy to GitHub pages
gulp.task('deploy', function() {
  return gulp.src('dist/**/*', {dot: true})
      .pipe($.ghPages());
});
