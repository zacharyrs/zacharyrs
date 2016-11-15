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
var rename = require('gulp-rename');
var inject = require('gulp-inject');
var merge = require('merge-stream')

var sourcemaps = require('gulp-sourcemaps');
var cleancss = require('gulp-clean-css');
var jslint = require('gulp-byo-jslint');
var minify = require('gulp-minify');
var htmlmin = require('gulp-htmlmin');
var imagemin = require('gulp-imagemin');
var pug = require('gulp-pug');
var stylus = require('gulp-stylus');
var crisper = require('gulp-crisper');
var babel = require('gulp-babel');
var vulcanize = require('gulp-vulcanize');

var surge = require('gulp-surge');

var compress = true;
var unvalc = ['src/bower/webcomponentsjs/webcomponents-lite.min.js'];

gulp.task('default', [
  'all',
  'watch',
  'serve:firebase'
])

gulp.task('all', [
  'copy:bower',
  'copy:misc',
  'compile:pug',
  'compile:stylus',
  'compile:babel'
]);

gulp.task('copy:bower', function () {
  return gulp.src(['src/bower/**/*'], {base: 'src/bower/'})
    .pipe(newer('dist/bower/'))
    .pipe(gulp.dest('dist/bower/'));
});

gulp.task('copy:misc', function () {
  return gulp.src(['src/misc/**/*'], {base: 'src/misc/'})
    .pipe(newer('dist/'))
    .pipe(gulpif(['*.png'], imagemin({
        optimizationLevel: 5,
        progressive: true,
        interlaced: true
    })))
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
    .pipe(crisper({
      scriptInHead: false,
      onlySplit: false
    }))
    .pipe(gulpif('*.js', babel({
      presets: ['es2015']
    })))
    .pipe(gulpif('*.html', htmlmin({
      collapseWhitespace: true,
      conservativeCollapse: true
    })))
    .pipe(plumber.stop())
    // .pipe(gulpif('*.js', jslint({
    //   jslint: './submodules/JSLint/jslint.js'
    // })))
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

gulp.task('compile:babel', function () {
  return gulp.src(['src/babel/**/*.js'], {base: 'src/babel/'})
    .pipe(plumber({
      errorHandler: function() {
        this.emit('end');
      }
    }))
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(plumber.stop())
    // .pipe(jslint({
    //   jslint: './submodules/JSLint/jslint.js'
    // }))
    .pipe(gulpif(compress, minify()))
    .pipe(gulp.dest('dist/'));
});

gulp.task('clean', function () {
  return del(['dist/**/*', '.publish/**/*']);
});

gulp.task('vulcanize', ['all'], function () {
  gulp.src([
    'dist/assets/**/*',
    '!dist/assets/css/**/*',
    '!dist/assets/js/**/*'
  ])
    .pipe(gulp.dest('dist/vulcanized/assets/'))
  gulp.src(unvalc, {base: 'src/bower/'})
    .pipe(gulp.dest('dist/vulcanized/assets/bower/'))
  return gulp.src(['dist/index.html'])
    .pipe(plumber({
      errorHandler: function(error) {
        gutil.log(
          gutil.colors.cyan('Plumber') + gutil.colors.red(' found unhandled error:\n'),
          error.toString()
        );
        this.emit('end');
      }
    }))
    .pipe(vulcanize({
      abspath: '',
      excludes: [],
      stripExcludes: false,
      inlineCss: true,
      inlineScripts: true
    }))
    .pipe(crisper({
      scriptInHead: false,
      onlySplit: false
    }))
    .pipe(inject(gulp.src('src/webcomponents.html'), {name: 'webcomponents', transform: function (filePath, file) {
      return file.contents.toString('utf8')
    }}))
    .pipe(gulpif('*.html', htmlmin({
      collapseWhitespace: true,
      conservativeCollapse: true,
      minifyCSS: true,
      removeComments: true
    })))
    .pipe(gulpif('*.js', minify({
        ext:{
            min:'.js'
        },
        noSource: true
    })))
    .pipe(gulpif('*.html', replace('<script src="index.js"></script>', '')))
    .pipe(plumber.stop())
    .pipe(gulp.dest('dist/vulcanized/'));
});

gulp.task('deploy:final', ['vulcanize'], function () {
  gulp.src(['dist/vulcanized/index.html'])
    .pipe(rename('200.html'))
    .pipe(gulp.dest('dist/vulcanized/'));
  surge({
    project: 'dist/vulcanized/',
    domain: 'zacharyrs.me'
  })
});

gulp.task('deploy:beta', ['all'], function () {
  gulp.src(['dist/index.html'])
    .pipe(rename('200.html'))
    .pipe(gulp.dest('dist/'));
  surge({
    project: 'dist/',
    domain: 'beta.zacharyrs.me'
  })
});

gulp.task('serve:firebase', ['serve:bs'], shell.task([
  'firebase serve'
]));

gulp.task('serve:bs', ['all'], function () {
  gulp.src(['dist/index.html'])
    .pipe(inject(gulp.src('src/webcomponents.html'), {name: 'webcomponents', transform: function (filePath, file) {
        return file.contents.toString('utf8')
    }}))
    .pipe(rename('fb.html'))
    .pipe(gulp.dest('dist/'));
  browsersync({
    port: 8080,
    notify: true,
    logPrefix: 'bs:',
    proxy: 'localhost:5000',
    files: ['dist/**/*', '!/dist/vulcanized'],
    reloadOnRestart: true
  });
});

gulp.task('watch', function () {
  gulp.watch(['src/bower/**/*'], ['copy:bower']);
  gulp.watch(['src/misc/**/*'], ['copy:misc']);
  gulp.watch(['src/pug/**/*.pug'], ['compile:pug']);
  gulp.watch(['src/stylus/**/*.styl'], ['compile:stylus']);
  gulp.watch(['src/babel/**/*.js'], ['compile:babel']);
});