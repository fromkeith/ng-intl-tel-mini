'use strict';


var gulp = require('gulp');
var browserify = require('browserify');
var eslint = require('gulp-eslint');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var insert = require('gulp-insert');

gulp.task('js', function () {
    // Single entry point to browserify
    return browserify({entries: 'src/index.js', debug: true})
        .transform(
            "babelify",
            {
              ignore: [
                /node_modules/,
              ],
              presets: [
                "es2015"
              ],
              sourceMaps: 'inline'
            }
        )
        .bundle()
        .pipe(source('ng-intl-tel-mini.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./build'));
});

gulp.task('release', ['copy-data'], function () {
    // Single entry point to browserify
    return browserify({entries: 'src/index.js', debug: true})
        .transform(
            "babelify",
            {
              ignore: [
                /node_modules/,
              ],
              presets: [
                "es2015"
              ],
              sourceMaps: 'inline'
            }
        )
        .bundle()
        .pipe(source('ng-intl-tel-mini.min.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(uglify({preserveComments: 'some'}))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./build'));
});


// export the allCountries variable so we can access them.
gulp.task('copy-data', function () {
    gulp.src('node_modules/intl-tel-input/src/js/data.js')
        .pipe(insert.append('\nmodule.exports = allCountries;'))
        .pipe(gulp.dest('./gen'));
});

gulp.task('watch', function () {
    gulp.watch(['./src/**/*.js'], ['js', 'lint']);
});

function jsLintTask(exitOnError) {
    var l = gulp.src([
        './src/index.js',
      ])
      .pipe(eslint({
            rulePaths: [
                '.'
            ],
            rules: {
                'no-underscore-dangle': 0,
            },
            env: {
                'es6': true
            }
        }))
      .pipe(eslint.format());
    if (exitOnError) {
        return l.pipe(eslint.failOnError());
    }
    return l;
}

gulp.task('lint', function() {
    return jsLintTask(false);
});

gulp.task('default', ['js', 'watch', 'lint']);