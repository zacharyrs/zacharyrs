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

const cssnext = require('gulp-postcss');
const cssnano = require('cssnano');

const minify = require('gulp-minify');
const htmlmin = require('gulp-htmlmin');
const vulcanize = require('gulp-vulcanize');

const surge = require('gulp-surge');

var unvalc = ['src/bower/webcomponentsjs/webcomponents-lite.min.js'];

gulp.task('default', [
  'all',
  'watch',
  'serve:firebase'
])

gulp.task('all', [
  'copy:assets',
  'compile:pug',
  'compile:babel',
  'compile:postcss'
]);

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
    .pipe(gulp.dest('dist/'));
});

gulp.task('compile:babel', () => {
  return gulp.src(['src/babel/**/*.js'], {base: 'src/babel/'})
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(gulp.dest('dist/'));
});

gulp.task('compile:postcss', () => {
  var processors = [
    cssnext(),
    cssnano()
  ];
  return gulp.src(['src/css/**/*.css'], {base: 'src/css/'})
    .pipe(postcss(processors))
    .pipe(gulp.dest('dist/'));
});

gulp.task('clean', () => {
  return del(['dist/**/*', '.publish/**/*']);
});

// gulp.task('vulcanize', ['all'], () => {
//   gulp.src([
//     'dist/assets/**/*',
//     '!dist/assets/css/**/*',
//     '!dist/assets/js/**/*'
//   ])
//     .pipe(gulp.dest('dist/vulcanized/assets/'))
//   gulp.src(unvalc, {base: 'src/bower/'})
//     .pipe(gulp.dest('dist/vulcanized/assets/bower/'))
//   gulp.src([
//     'dist/index.html',
//     'dist/index.js'
//   ])
//     .pipe(gulpif('*.html', replace(
//       '<script src="index.js"></script>',
//       '<script src="/index.js"></script>'
//     )))
//     .pipe(gulp.dest('dist/vulcanized/'))
//   return gulp.src(['dist/elements.html'])
//     .pipe(vulcanize({
//       abspath: '',
//       excludes: [],
//       stripExcludes: false,
//       inlineCss: true,
//       inlineScripts: true
//     }))
//     .pipe(crisper({
//       scriptInHead: false,
//       onlySplit: false
//     }))
//     .pipe(gulpif('*.html', htmlmin({
//       collapseWhitespace: true,
//       conservativeCollapse: true,
//       minifyCSS: true,
//       removeComments: true
//     })))
//     .pipe(gulpif('*.js', minify({
//         ext:{
//             min:'.js'
//         },
//         noSource: true
//     })))
//     .pipe(gulpif('*.html', replace('<script src="elements.js"></script>', '')))
//     .pipe(gulp.dest('dist/vulcanized/'));
// });

// gulp.task('deploy:final', ['vulcanize', 'deploy:data'], () => {
//   gulp.src(['dist/vulcanized/index.html'])
//     .pipe(rename('200.html'))
//     .pipe(gulp.dest('dist/vulcanized/'));
//   surge({
//     project: 'dist/vulcanized/',
//     domain: 'zacharyrs.me'
//   })
// });

// gulp.task('deploy:beta', ['all'], () => {
//   gulp.src(['dist/index.html'])
//     .pipe(rename('200.html'))
//     .pipe(gulp.dest('dist/'));
//   surge({
//     project: 'dist/',
//     domain: 'beta.zacharyrs.me'
//   })
// });

gulp.task('serve:firebase', ['serve:bs'], shell.task([
  'firebase serve'
]));

gulp.task('serve:bs', ['all'], () => {
  browsersync({
    port: 5001,
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
  gulp.watch(['src/babel/**/*.js'], ['compile:babel']);
  gulp.watch(['src/stylus/**/*.styl'], ['compile:stylus']);
});