var gulp = require('gulp');
var connect = require('gulp-connect');
var qiniu = require("qiniu");
var fs = require('fs');


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

function uploadFiles(bucket, paths) {
  var putFileCb = function putFileCb(err, ret) {
    if(!err) {
      // 上传成功， 处理返回值
      console.log(ret.hash, ret.key, ret.persistentId);       
    } else {
      // 上传失败， 处理返回代码
      console.log(err);
    }
  };
  for (var path of paths) {
    var putPolicy = new qiniu.rs.PutPolicy(`${bucket}:${path}`);
    qiniu.io.putFile(putPolicy.token(), path, path, 
                     new qiniu.io.PutExtra(), putFileCb);
  }
}
gulp.task('deploy', function () {
  fs.readFile('config.json', function (err, buf) {
    config = JSON.parse(buf.toString())
    qiniu.conf.ACCESS_KEY = config.qiniuAccessKey;
    qiniu.conf.SECRET_KEY = config.qiniuSecrectKey;
    console.log(qiniu.conf);

    //要上传的空间
    uploadFiles('chuangye-mis', [
      'index.html',
      'semantic/dist/semantic.min.css',
      'css/normalize.css',
      'css/main.css',
      'js/vendor/modernizr-2.6.2.min.js',
      'node_modules/jquery/dist/jquery.min.js',
      'semantic/dist/semantic.min.js',
      'node_modules/ejs/ejs.min.js',
      'js/bundle.js',
    ]);
  });

});
