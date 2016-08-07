var gulp = require('gulp-npm-run')(require('gulp'), {
  include: ['watch:test', 'test']
});
var connect = require('gulp-connect');
var fs = require('mz/fs');
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
var cheerio = require('cheerio');
var R = require('ramda');
var co = require('co');
var OSS = require('ali-oss');
var postcss    = require('gulp-postcss');
var sourcemaps = require('gulp-sourcemaps');

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
  gulp.watch(['smart-grid/**/*', 'js/**/*.js', 'js/**/*.ejs', '!js/bundle.js'], ['rollup']);
  gulp.watch(['./index.html', 'js/bundle.js', 'js/plugins.js'], ['reload']);
  gulp.watch(['./postcss/**/*.css'], ['css']) ;
});

gulp.task('collect-dist', ['rollup'], function (cb) {
  var cnt = 0;
  co(function *() {
    var content = yield fs.readFile('index.html');
    let $ = cheerio.load(content);
    // css and js
    var filenames = $('script').map((idx, e) => $(e).attr('src')).get().concat(
        $('link').map((idx, e) => $(e).attr('href')).get()
    );
    filenames.push('index.html');
    // fonts
    var fontsFiles = yield new Promise(function (resolve, reject) {
      glob('semantic/dist/themes/default/assets/**/*', function (err, filenames) {
        resolve(filenames);
      });
    });
    filenames = filenames.concat(fontsFiles);
    console.log('files to distribute: ', filenames);
    for (var filename of filenames) {
      yield new Promise(function (resolve, reject) {
        fse.copy(filename, 'dist/' + filename, function (err) {
          resolve();
        });
      }); 
    }
    cb();
  });
});

gulp.task('dist', ['rollup', 'collect-dist', 'rev', 'rev-replace'], 
          function () {
});

gulp.task('default', ['css', 'rollup', 'connect', 'watch']);

gulp.task('rollup', function () {
  var plugins = [
    nodeResolve({
      jsnext: true,
      browser: true,
      skip: ['moment']
    }),
    commonjs({
      ignoreGlobal: true,
    }),
    string({
      include: ['js/**/*.ejs'],
    }),
    // buble({
    //   transforms: {
    //     arrow: true,
    //     dangerousForOf: true
    //   },
    // }),
  ];
  if (process.env.ENV === 'production') {
    plugins.push(rollupUglify());
  }
  return rollup({
    entry: 'js/main.js',
    plugins: plugins,
    external: ['moment', 'virtual-dom'],
  }).then(function (bundle) {
    return bundle.write({
      format: 'iife',
      dest: 'js/bundle.js',
      sourceMap: true,
      globals: {
        moment: 'moment',
        virtualDom: 'virtual-dom',
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

var uploadDir = function * (client, dir, opts) {
  var filenames = yield new Promise(function (resolve, reject) {
    glob(dir + '/**/*', function (err, filenames) {
      resolve(filenames);
    });
  });
  for (var filename of filenames) {
    if ((yield fs.stat(filename)).isFile()) {
      var key = path.relative(opts.base, filename);
      console.log('deploy ' + key);
      var result = yield client.put(key, filename);
      console.log(result);
    }
  };
};

gulp.task('deploy', ['dist'], function (cb) {
  co(function * () {
    var config = JSON.parse((yield fs.readFile('config.json')).toString());
    var client = new OSS({
      region: config.region,
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret
    });
    client.useBucket(config.bucket);
    yield * uploadDir(client, 'dist', { base: 'dist' });
  }).catch(console.error);
});

gulp.task('css', function () {
    return gulp.src('postcss/main.css')
    .pipe( sourcemaps.init() )
    .pipe( postcss([ 
      require('autoprefixer'), 
      require('postcss-import'),
      require('postcss-custom-media'),
      require('postcss-custom-properties'),
      require('postcss-calc'),
      require('postcss-color-function'),
      require('postcss-discard-comments'),
    ]) )
    .pipe( sourcemaps.write('.') )
    .pipe( gulp.dest('css/') ).pipe(connect.reload());
});
