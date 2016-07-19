var gulp = require('gulp');
var connect = require('gulp-connect');
var qiniu = require("qiniu");
var fs = require('fs');
var rev = require("gulp-rev");
var revReplace = require("gulp-rev-replace");
var rollup = require('rollup').rollup;
var nodeResolve = require('rollup-plugin-node-resolve');
var buble = require('rollup-plugin-buble');
var commonjs = require('rollup-plugin-commonjs');
var string = require('rollup-plugin-string');
var rollupUglify = require('rollup-plugin-uglify');
var fse = require('fs-extra');
var glob = require('glob');
var path = require('path');

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
  gulp.watch(['js/**/*.js', 'js/template/**/*.ejs', '!js/bundle.js'], ['rollup']);
  gulp.watch(['./index.html', 'js/bundle.js', 'js/plugins.js', 'css/main.css'], ['reload']);
});

gulp.task('collect-dist', ['rollup'], function (cb) {
  var cnt = 0;
  var copyCb = function (err) {
    if (err) return console.error(err);
    if (++cnt === files.length) {
      cb();
    }
  };
  var files = [
    'index.html',
    'semantic/dist/semantic.min.css',
    'css/normalize.css',
    'css/main.css',
    'js/vendor/modernizr-2.6.2.min.js',
    'node_modules/jquery/dist/jquery.min.js',
    'semantic/dist/semantic.min.js',
    'node_modules/ejs/ejs.min.js',
    'js/bundle.js',
    'js/bundle.js.map'
  ];
  files.forEach(function (filename) {
    fse.copy(filename, 'dist/' + filename, copyCb);
  });
});

gulp.task('dist', ['rollup', 'collect-dist', 'rev', 'rev-replace'], 
          function () {
});

gulp.task('default', ['connect', 'watch']);


gulp.task('rollup', function () {
  var plugins = [
    nodeResolve({
      jsnext: true,
      browser: true,
      skip: ['moment']
    }),
    commonjs(),
    string({
      include: 'js/template/*.ejs',
    }),
    // buble(),
  ];
  if (process.env.ENV === 'production') {
    plugins.push(rollupUglify());
  }
  return rollup({
    entry: 'js/main.js',
    plugins: plugins,
  }).then(function (bundle) {
    return bundle.write({
      format: 'iife',
      dest: 'js/bundle.js',
      sourceMap: true,
      globals: {
        moment: 'moment',
      }
    });
  });
});

gulp.task('rev', ['collect-dist'], function(){
  return gulp.src('dist/js/bundle.js')
    .pipe(rev())
    .pipe(gulp.dest('dist/js'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('dist/js'));
});

gulp.task('rev-replace', ['rev'], function(){
  var manifest = gulp.src('dist/js/rev-manifest.json');
 
  return gulp.src('dist/index.html')
    .pipe(revReplace({manifest: manifest}))
    .pipe(gulp.dest('dist'));
});

function uploadDir(bucket, dir, options) {
  var putFileCb = function putFileCb(err, ret) {
    if(!err) {
      // 上传成功， 处理返回值
      console.log(ret.hash, ret.key, ret.persistentId);       
    } else {
      // 上传失败， 处理返回代码
      console.log(err);
    }
  };
  glob('dist/**/*', function (err, files) {
    for (var filename of files) {
      var key = path.relative('dist', filename);
      var putPolicy = new qiniu.rs.PutPolicy(`${bucket}:${key}`);
      qiniu.io.putFile(putPolicy.token(), key, filename, 
                       new qiniu.io.PutExtra(), putFileCb);
    }
  });
}
 
gulp.task('deploy', function () {
  fs.readFile('config.json', function (err, buf) {
    var config = JSON.parse(buf.toString());
    qiniu.conf.ACCESS_KEY = config.qiniuAccessKey;
    qiniu.conf.SECRET_KEY = config.qiniuSecrectKey;
    console.log(qiniu.conf);

    //要上传的空间
    uploadDir('chuangye-mis', 'dist', {
      base: 'dist',
    });
  });

});
