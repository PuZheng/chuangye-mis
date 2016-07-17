var gulp = require('gulp');
var connect = require('gulp-connect');
var dot = require('gulp-dot');

gulp.task('dot', function() {
  gulp.src(['js/template/*.html', '!dot/layout.dot'])
    .pipe(dot())
    .pipe(gulp.dest('dist'));
});

gulp.task('connect', function() {
  connect.server({
    root: './',
    port : '8080',
    livereload: true,
    fallback: 'index.html',
  });
});

gulp.task('reload', function () {
  gulp.src(['./index.html']).pipe(connect.reload());
});

gulp.task('watch', function () {
  gulp.watch(['./index.html', 'js/bundle.js', 'js/plugins.js', 'css/main.css'], ['reload']);
});

gulp.task('default', ['connect', 'watch']);
