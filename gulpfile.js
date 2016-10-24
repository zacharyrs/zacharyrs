var del = require('del');
var gulp = require('gulp');
var nib = require('nib');
var browsersync = require('browser-sync');
var opn = require('opn');

var shell = require('gulp-shell')
var gulpif = require('gulp-if');
var gutil = require('gulp-util');
var newer = require('gulp-newer');
var plumber = require('gulp-plumber');
var replace = require('gulp-replace');
var rename = require("gulp-rename");

var cleancss = require('gulp-clean-css');
var jslint = require('gulp-byo-jslint');
var minify = require('gulp-minify');
var pug = require('gulp-pug');
var stylus = require('gulp-stylus');
var ts = require('gulp-typescript');
var vulcanize = require('gulp-vulcanize');

var ghpages = require('gulp-gh-pages');
var surge = require('gulp-surge');

var compress = true;

gulp.task('default', [
  'all',
  'watch',
  'serve:polymer'
])

gulp.task('all', [
  'copy:bower',
  'copy:misc',
  'compile:pug',
  'compile:stylus',
  'compile:typescript'
]);

gulp.task('copy:bower', function () {
  return gulp.src(['bower_components/**/*'], {base: 'bower_components/'})
    .pipe(newer('dist/html/bower/'))
    .pipe(gulp.dest('dist/html/bower/'));
});

gulp.task('copy:misc', function () {
  return gulp.src(['src/misc/**/*'], {base: 'src/misc/'})
    .pipe(newer('dist/'))
    .pipe(gulp.dest('dist/'));
});

gulp.task('compile:pug', function () {
  return gulp.src(['src/pug/**/*.pug'], {base: 'src/pug/'})
    .pipe(plumber({
      errorHandler: function(error) {
        gutil.log(
          gutil.colors.cyan('Plumber') + gutil.colors.red(' found unhandled error:\n'),
          error.toString()
        );
        this.emit('end');
      }
    }))
    .pipe(pug({pretty: true}))
    .pipe(plumber.stop())
    .pipe(gulp.dest('dist/'));
});

gulp.task('compile:stylus', function () {
  return gulp.src(['src/stylus/**/*.styl'], {base: 'src/stylus/'})
    .pipe(plumber({
      errorHandler: function(error) {
        gutil.log(
          gutil.colors.cyan('Plumber') + gutil.colors.red(' found unhandled error:\n'),
          error.toString()
        );
        this.emit('end');
      }
    }))
    .pipe(stylus({ use: [nib()], import: ['nib']}))
    .pipe(gulpif(compress, cleancss()))
    .pipe(plumber.stop())
    .pipe(gulp.dest('dist/assets/css/'));
});

gulp.task('compile:typescript', function () {
  return gulp.src(['src/typescript/**/*.ts'], {base: 'src/typescript/'})
    .pipe(plumber({
      errorHandler: function() {
        this.emit('end');
      }
    }))
    .pipe(ts())
    .pipe(plumber.stop())
    .pipe(jslint({
      jslint: './submodules/JSLint/jslint.js'
    }))
    .pipe(gulpif(compress, minify()))
    .pipe(gulp.dest('dist/assets/js/'));
});

gulp.task('clean', function () {
  return del(['dist/**/*']);
});

gulp.task('vulcanize', ['all'], function () {
  gulp.src([
    'dist/assets/**/*',
    '!dist/assets/css/**/*',
    '!dist/assets/js/**/*'
  ])
    .pipe(gulp.dest('dist/vulcanized/assets/'))
  return gulp.src(['dist/index.html'])
    .pipe(vulcanize({
      abspath: '',
      excludes: [],
      stripExcludes: false,
      inlineCss: true,
      inlineScripts: true
    }))
    .pipe(gulp.dest('dist/vulcanized/'));
});

gulp.task('deploy:publish', ['vulcanize'], function () {
  gulp.src(['dist/vulcanized/index.html'])
    .pipe(rename('200.html'))
    .pipe(gulp.dest('dist/vulcanized/'));
  surge({
    project: 'dist/vulcanized/',
    domain: 'zacharyrs.me'
  })
});

gulp.task('deploy:live', ['all'], function () {
  return gulp.src(['dist/**/*', '!dist/vulcanized/**/*'])
    .pipe(replace(
      '"></app-location>',
      '" use-hash-as-path></app-location>'
    ))
    .pipe(ghpages());
});

gulp.task('serve:polymer', ['serve:bs'], shell.task([
  'polymer serve dist/'
]));

gulp.task('serve:bs', ['all'], function () {
  browsersync({
    port: 5000,
    notify: true,
    logPrefix: 'bs:',
    proxy: 'localhost:8080',
    files: ['dist/**/*', '!/dist/vulcanized'],
    reloadOnRestart: true
  });
});

gulp.task('watch', function () {
  gulp.watch(['bower_components/**/*'], ['copy:bower']);
  gulp.watch(['src/misc/**/*'], ['copy:misc']);
  gulp.watch(['src/pug/**/*.pug'], ['compile:pug']);
  gulp.watch(['src/stylus/**/*.styl'], ['compile:stylus']);
  gulp.watch(['src/typescript/**/*.ts'], ['compile:typescript']);
});