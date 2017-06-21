var gulp = require('gulp');
var minifyCSS = require('gulp-csso');
var ts = require("gulp-typescript");
var tsProject = ts.createProject("tsconfig.json");
var browserify = require("browserify");
var source = require('vinyl-source-stream');
var tsify = require("tsify");

gulp.task('html', function() {
    return gulp.src('src/index.html')
        .pipe(gulp.dest('dist'))
});

gulp.task('css', function() {
    return gulp.src('src/css/*.css')
        .pipe(minifyCSS())
        .pipe(gulp.dest('dist/css'))
});

// gulp.task('typescript', function() {
//     return tsProject.src()
//         .pipe(tsProject())
//         .js.pipe(gulp.dest('dist'));
// });

// gulp.task('browserify', ['typescript'], function() {
gulp.task('browserify', function() {
    return browserify({
            basedir: '.',
            debug: true,
            entries: ['src/main.ts'],
            cache: {},
            packageCache: {}
        })
        .plugin(tsify)
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest("dist"));
});

gulp.task('default', ['html', 'css', 'browserify']);