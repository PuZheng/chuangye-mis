var gulp = require('gulp');
var connect = require('gulp-connect');


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
