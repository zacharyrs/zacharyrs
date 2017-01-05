'use strict';

const del = require('del');
const gulp = require('gulp');
const runSequence = require('run-sequence');
const merge = require('merge-stream')

const browsersync = require('browser-sync');

const shell = require('gulp-shell')
const gulpif = require('gulp-if');
const newer = require('gulp-newer');
const replace = require('gulp-replace');
const rename = require('gulp-rename');

const sourcemaps = require('gulp-sourcemaps');
const pug = require('gulp-pug');
const crisper = require('gulp-crisper');
const babel = require('gulp-babel');
const postcss = require('gulp-postcss');

const cssnext = require('postcss-cssnext');
const cssnano = require('cssnano');
const sugarss = require('sugarss');

const minify = require('gulp-minify');
const htmlmin = require('gulp-htmlmin');
const vulcanize = require('gulp-vulcanize');

const surge = require('gulp-surge');

var unvulc = ['src/bower/webcomponentsjs/webcomponents-lite.min.js'];

gulp.task('default', () => {
  return runSequence(
    'clean',
    [
      'copy:assets',
      'compile:pug',
      'compile:postcss'
    ],
    // [
    //   'compile:babel'
    // ],
    [
      'watch',
      'serve:firebase'
    ]
  );
});

gulp.task('copy:assets', () => {
  var bower = gulp.src(['src/bower/**/*'], {base: 'src/bower/'})
    .pipe(newer('dist/bower/'))
    .pipe(gulp.dest('dist/bower/'));

  var misc = gulp.src(['src/misc/**/*', '!src/misc/assets/img/unoptimised/**/*'], {base: 'src/misc/'})
    .pipe(newer('dist/'))
    .pipe(gulp.dest('dist/'));

  return merge(bower, misc);
});

gulp.task('compile:pug', () => {
  return gulp.src(['src/pug/**/*.pug'], {base: 'src/pug/'})
    .pipe(pug())
    .pipe(crisper({
      scriptInHead: false,
      onlySplit: false
    }))
    .pipe(gulp.dest('dist/'))
    .pipe(gulpif('*.js', gulp.dest('.tmp/babel/')));
});

gulp.task('compile:babel', () => {
  var js = gulp.src(['src/babel/**/*.js'], {base: 'src/babel/'})
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(gulp.dest('dist/'));

  var html = gulp.src(['.tmp/babel/**/*.js'], {base: '.tmp/babel/'})
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(gulp.dest('dist/'));

  return merge(js, html);
});

gulp.task('compile:postcss', () => {
  return gulp.src(['src/css/**/*.sss'], {base: 'src/css/'})
    .pipe(postcss([cssnext(), cssnano({ autoprefixer: false })], {parser: sugarss}))
    .pipe(rename({ extname: '.css' }))
    .pipe(gulp.dest('dist/'));
});

gulp.task('clean', () => {
  return del(['dist/**/*', '.publish/**/*', '.tmp/**/*']);
});

gulp.task('vulcanize', () => {
  return runSequence(
    'clean',
    [
      'copy:assets',
      'compile:pug',
      'compile:postcss'
    ],
    'compile:babel',
    () => {
      var assets = gulp.src(['dist/assets/**/*'])
        .pipe(gulp.dest('.publish/assets/'))

      var bower = gulp.src(unvulc, {base: 'src/bower/'})
        .pipe(gulp.dest('.publish/assets/bower/'))

      var index = gulp.src([
        'dist/index.html',
        'dist/index.js'
      ])
        .pipe(gulp.dest('.publish/'))

      var elements = gulp.src(['dist/elements.html'])
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
        .pipe(gulpif('*.html', replace('<script src="elements.js"></script>', '')))
        .pipe(gulp.dest('.publish/'));

      return merge(assets, bower, index, elements);
    }
  )
});

gulp.task('deploy:final', () => {
  gulp.src(['.publish/index.html'])
    .pipe(replace(
      '<script src="index.js"></script>',
      '<script src="/index.js"></script>'
    ))
    .pipe(rename('200.html'))
    .pipe(gulp.dest('.publish/'));
  surge({
    project: '.publish/',
    domain: 'beta.zacharyrs.me'
  })
});

gulp.task('deploy:beta', () => {
  runSequence(
    'clean',
    [
      'copy:assets',
      'compile:pug',
      'compile:postcss'
    ],
    'compile:babel',
    () => {
      gulp.src(['dist/index.html'])
        .pipe(replace(
          '<script src="index.js"></script>',
          '<script src="/index.js"></script>'
        ))
        .pipe(rename('200.html'))
        .pipe(gulp.dest('dist/'));

      surge({
        project: 'dist/',
        domain: 'beta.zacharyrs.me'
      })
    }
  )
});

gulp.task('serve:firebase', ['serve:bs'], shell.task([
  'firebase serve'
]));

gulp.task('serve:bs', () => {
  browsersync({
    port: 8080,
    notify: true,
    logPrefix: 'bs:',
    proxy: 'localhost:5000',
    files: ['dist/**/*'],
    reloadOnRestart: true
  });
});

gulp.task('watch', () => {
  gulp.watch(['src/bower/**/*', 'src/misc/**/*'], ['copy:assets']);
  gulp.watch(['src/pug/**/*.pug'], ['compile:pug']);
  gulp.watch(['src/babel/**/*.js', '.tmp/babel/**/*.js'], ['compile:babel']);
  gulp.watch(['src/css/**/*.sss'], ['compile:postcss']);
});