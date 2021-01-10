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

import browserSync from 'browser-sync';
import del from 'del';
import glob from 'glob';
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import merge from 'merge-stream';
import path from 'path';
import webpack from 'webpack';
import materialColor from './local_node_modules/material-color';

const $ = gulpLoadPlugins();
const reload = browserSync.reload;


let DEV_MODE = false;
const setDevMode = cb => { DEV_MODE = true; cb(); };

let webpackInstance;

function printWebpackStats(stats) {
  console.log(stats.toString({
    modules: false,
    colors: true,
  }));
};

function errorHandler(error) {
  console.error(error.stack);
  this.emit('end'); // http://stackoverflow.com/questions/23971388
}


gulp.task('media', () =>
  merge(
    gulp.src('app/images/**/*')
      .pipe($.cache($.imagemin([
        $.imagemin.jpegtran({progressive: true}),
        $.imagemin.svgo({
          plugins: [{removeViewBox: false}],
          js2svg: {pretty: true},
        }),
      ])))
      .pipe(gulp.dest('dist/images'))
      .pipe($.size({title: 'images'})),

    gulp.src('app/media/**/*')
      .pipe(gulp.dest('dist/media'))
      .pipe($.size({title: 'media'}))));

// Copy all files at the root level (app)
gulp.task('copy', () =>
  gulp.src([
    'app/CNAME',
    'app/*.{txt,ico,png}',
  ], {dot: true}).pipe(gulp.dest('dist')));

// Concatenate and minify JavaScript
gulp.task('webpack', cb => {
  // force reload webpack config
  process.env.NODE_ENV = DEV_MODE ? 'development' : 'production';
  delete require.cache[require.resolve('./webpack.config.js')];
  let webpackConfig = require('./webpack.config.js');
  webpackConfig.mode = process.env.NODE_ENV;
  webpackInstance = webpack(webpackConfig, (err, stats) => {
    printWebpackStats(stats);
    cb();
  });
});

let nunjucks = require('nunjucks');

// Scan your HTML for assets & optimize them
gulp.task('html', () =>
  gulp.src([
    'app/**/*.html',
    '!app/**/_*.html'
  ])
    .pipe($.nucleus({
      templateRootPath: 'app',
      dataPath: 'app/data',
      nunjucks,
      setupNunjucks: (env, nunjucks) => {
        env.addFilter('material_color', input => {
          let parts = input.toLowerCase().split(/\s+/g);
          if (parts[0] == 'material' && parts.length >= 3) {
            return materialColor(parts[1], parts[2]);
          }
          return input;
        });
        env.addFilter('slug', input => (input || '').toLowerCase().replace(/[^\w]+/g, '-'));
        env.addFilter('dictValues', input => Object.values(input));
        env.addGlobal('glob', (pattern = '**/*') => glob.sync(pattern, {cwd: 'app'}));
        env.addGlobal('Object', Object); // mostly for Object.assign
      },
      markedOptions: {
      }
    }).on('error', errorHandler))
    // Move file if it contains a 'destination'
    .pipe($.tap((file, t) => {
      if (file.contextData.destination) {
        file.path = path.join('./app', file.contextData.destination);
      }
    }))
    .on('error', errorHandler)
    .pipe(gulp.dest('.tmp'))
    // Minify any HTML
    .pipe($.if('*.html', $.htmlmin({
      removeComments: true,
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      removeOptionalTags: true
    })))
    .pipe(gulp.dest('dist'))
);

// Clean output directory
gulp.task('clean', cb => {
  del.sync(['.tmp', 'dist/*', '!dist/.git'], {dot: true});
  $.cache.clearAll();
  cb();
});

gulp.task('serve', gulp.series(setDevMode, 'html', 'webpack', () => {
  browserSync({
    notify: false,
    server: {
      baseDir: ['.tmp', 'app', 'dist'],
      serveStaticOptions: {
        extensions: ['html']
      },
    },
    port: 3000
  });

  let r = cb => { reload(); cb(); };
  gulp.watch(['app/**/*.html'], gulp.series('html', r));
  gulp.watch(['app/data/**/*.{json,yaml}'], gulp.series('html', r));
  gulp.watch(['app/{images,media}/**/*'], gulp.series('media', 'html', r)); // html because SVG sometimes inlined

  if (webpackInstance) {
    webpackInstance.watch({}, (err, stats) => {
      printWebpackStats(stats);
      reload();
    });
  }
}));


gulp.task('default', gulp.series('clean', 'html', 'webpack', 'media', 'copy'));
