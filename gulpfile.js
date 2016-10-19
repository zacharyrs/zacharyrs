var gulp = require('gulp');
var shell = require('gulp-shell');
var pug = require('gulp-pug');
var stylus = require('gulp-stylus');
var nib = require('nib');
var ts = require('gulp-typescript');
var minify = require('gulp-minify');
var cleancss = require('gulp-clean-css');
var del = require('del');
var newer = require('gulp-newer');
var gulpif = require('gulp-if');
var plumber = require('gulp-plumber');
var jslint = require('gulp-jslint');
var gutil = require('gulp-util');
var surge = require('gulp-surge');
var ghpages = require('gulp-gh-pages');

var compress = true;

gulp.task('default', [
  'all',
  'watch'
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
    .pipe(gulp.dest('dist/assets/'));
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

gulp.task('deploy:main', function () {
  surge({
    project: 'dist',
    domain: 'zacharyrs.me'
  })
});

gulp.task('deploy:live', function () {
  gulp.src('dist/**/*')
    .pipe(ghpages());
});

gulp.task('watch', function () {
  gulp.watch(['bower_components/**/*.coffee'], ['copy:bower']);
  gulp.watch(['src/misc/**/*'], ['copy:misc']);
  gulp.watch(['src/pug/**/*.pug'], ['compile:pug']);
  gulp.watch(['src/stylus/**/*.styl'], ['compile:stylus']);
  gulp.watch(['src/typescript/**/*.ts'], ['compile:typescript']);
});