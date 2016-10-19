var del = require('del');
var gulp = require('gulp');
var nib = require('nib');

var gulpif = require('gulp-if');
var gutil = require('gulp-util');
var newer = require('gulp-newer');
var plumber = require('gulp-plumber');

var cleancss = require('gulp-clean-css');
var jslint = require('gulp-jslint');
var minify = require('gulp-minify');
var pug = require('gulp-pug');
var stylus = require('gulp-stylus');
var ts = require('gulp-typescript');

var ghpages = require('gulp-gh-pages');
var gls = require('gulp-live-server');
var opn = require('opn');
var surge = require('gulp-surge');

var compress = true;

gulp.task('default', [
  'all',
  'watch',
  'serve'
])

gulp.task('all', [
  'copy:bower',
  'copy:misc',
  'compile:pug',
  'compile:stylus',
  'compile:typescript'
])

gulp.task('copy:bower', function () {
  gulp.src(['bower_components/**/*'], {base: 'bower_components/'})
    .pipe(newer('dist/html/bower/'))
    .pipe(gulp.dest('dist/html/bower/'));
});

gulp.task('copy:misc', function () {
  gulp.src(['src/misc/**/*'], {base: 'src/misc/'})
    .pipe(newer('dist/'))
    .pipe(gulp.dest('dist/'));
});

gulp.task('compile:pug', function () {
  gulp.src(['src/pug/**/*.pug'], {base: 'src/pug/'})
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
  gulp.src(['src/stylus/**/*.styl'], {base: 'src/stylus/'})
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
  gulp.src(['src/typescript/**/*.ts'], {base: 'src/typescript/'})
    .pipe(plumber({
      errorHandler: function() {
        this.emit('end');
      }
    }))
    .pipe(ts())
    .pipe(plumber.stop())
    .pipe(jslint())
    .pipe(jslint.reporter('stylish'))
    .pipe(gulpif(compress, minify()))
    .pipe(gulp.dest('dist/assets/js/'));
});

gulp.task('clean', function () {
  del(['dist/**/*']);
});

gulp.task('deploy:publish', function () {
  surge({
    project: 'dist',
    domain: 'zacharyrs.me'
  })
});

gulp.task('deploy:live', function () {
  return gulp.src('dist/**/*')
    .pipe(ghpages());
});

gulp.task('serve', function () {
  var server = gls.static('dist', 5000);
  server.start();

  gulp.watch(['dist/**/*'], function (file) {
    server.notify.apply(server, [file]);
  });

  opn('http://localhost:5000');
});

gulp.task('watch', function () {
  gulp.watch(['bower_components/**/*.coffee'], ['copy:bower']);
  gulp.watch(['src/misc/**/*'], ['copy:misc']);
  gulp.watch(['src/pug/**/*.pug'], ['compile:pug']);
  gulp.watch(['src/stylus/**/*.styl'], ['compile:stylus']);
  gulp.watch(['src/typescript/**/*.ts'], ['compile:typescript']);
});