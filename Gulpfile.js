var gulp = require('gulp-npm-run')(require('gulp'), {
  include: ['watch:test', 'test']
});
var connect = require('gulp-connect');
var fs = require('mz/fs');
var rev = require('gulp-rev');
var revReplace = require('gulp-rev-replace');
var rollup = require('rollup').rollup;
var nodeResolve = require('rollup-plugin-node-resolve');
var babel = require('rollup-plugin-babel');
var commonjs = require('rollup-plugin-commonjs');
var fse = require('fs-extra');
var glob = require('glob');
var path = require('path');
var cheerio = require('cheerio');
var co = require('co');
var OSS = require('ali-oss');
var postcss    = require('gulp-postcss');
var sourcemaps = require('gulp-sourcemaps');
var json = require('rollup-plugin-json');
var eslint = require('gulp-eslint');
var includePaths = require('rollup-plugin-includepaths');
var jsx = require('rollup-plugin-jsx');
var beautify = require('js-beautify');
var inquirer = require('inquirer');
var conflict = require('gulp-conflict');
var template = require('gulp-template');
var casing = require('casing');
var rename = require('gulp-rename');

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
  gulp.watch(
    ['smart-grid/**/*', 'js/**/*.js', 'js/**/*.jsx', '!js/bundle.js'],
    ['rollup']
  );
  gulp.watch(['./*.html', 'js/bundle.js', 'js/plugins.js'], ['reload']);
  gulp.watch(['./postcss/**/*.css'], ['css']) ;
});

var collectConfig = function (cb) {
  let backend = process.env.BACKEND || 'http://127.0.0.1:5000';
  let pageSize = process.env.PAGE_SIZE || 16;
  let config = {
    backend,
    pageSize,
  };
  let env = process.env.ENV || 'development';
  fs.readFile(env + '.json', function (err, data) {
    if (err) {
      if (err.code === 'ENOENT') {
        cb(config);
        return;
      }
      throw err;
    }
    Object.assign(config, JSON.parse(data));
    cb(config);
  });
};

// make config file, configuration "backend" and "pageSize" could be specified
// by environment variables, and overriden by <ENV>.json
gulp.task('config', function (cb) {
  collectConfig(function (config) {
    config = JSON.stringify(config, null, 4);
    fs.writeFile(
      'js/config.js',
      beautify(
        `
        // this file generated automatically, don't MODIFY this file
        /* eslint-disable quotes */
        var _config = ((${config}));
        /* eslint-enable quotes */
        export default Object.assign(_config, {
          getPageSize(type) {
            return _config[type + 'PageSize'] || _config.pageSize;
          },
        });
      `, {
        indent_size: 2
      }),
      function () {
        cb();
      });
  });
});

gulp.task('collect-dist', ['rollup'], function (cb) {
  co(function *() {
    var content = yield fs.readFile('index.html');
    let $ = cheerio.load(content);
    // css and js
    var filenames = $('script').map((idx, e) => $(e).attr('src')).get().concat(
        $('link').map((idx, e) => $(e).attr('href')).get()
    );
    filenames.push('index.html');
    // fonts
    var fontsFiles = yield new Promise(function (resolve) {
      glob('node_modules/font-awesome/fonts/**/*', function (err, filenames) {
        resolve(filenames);
      });
    });
    filenames = filenames.concat(fontsFiles);
    console.log('files to distribute: ', filenames);
    for (var filename of filenames) {
      yield new Promise(function (resolve) {
        fse.copy(filename, 'dist/' + filename, function () {
          resolve();
        });
      });
    }
    cb();
  });
});

gulp.task('dist', ['config', 'rollup', 'collect-dist', 'rev', 'rev-replace'],
          function () {
          });

gulp.task('default', ['css', 'rollup', 'connect', 'watch']);

gulp.task('rollup', function () {
  var plugins = [
    jsx({
      factory: 'virtualDom.h',
      include: ['js/**/*.jsx']
    }),
    nodeResolve({
      jsnext: true,
      browser: true,
      skip: ['moment', 'slot', 'smart-grid', 'throttle-slot', 'pipe-slot',
        'validate-obj', 'checkers', 'store', 'toast', 'widget', 'scrollable']
    }),
    commonjs({
      ignoreGlobal: true,
    }),
    includePaths({
      paths: ['js'],
      include: {
        slot: 'js/slot/index.js',
        'throttle-slot': 'js/throttle-slot/index.js',
        'smart-grid': 'js/smart-grid/index.js',
        'pipe-slot': 'js/pipe-slot/index.js',
        'validate-obj': 'js/validate-obj.js',
        checkers: 'js/checkers.js',
        store: 'js/store/',
        toast: 'js/toast.js',
        widget: 'js/widget/',
        scrollable: 'js/scrollable/index.js',
      }
    }),
    json({
      include: ['js/config.json'],
      exclude: ['node_modules/**/*', 'config.json', 'config.sample.json']
    }),
  ];
  if (process.env.ENV === 'production') {
    plugins.push(babel({
      presets: [['es2015', { modules: false }]],
      plugins: [
        'external-helpers'
      ],
      exclude: ['node_modules/**']
    }));
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
        'virtual-dom': 'virtualDom',
      },
      moduleName: 'chuangye',
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
  var filenames = yield new Promise(function (resolve) {
    glob(dir + '/**/*', function (err, filenames) {
      resolve(filenames);
    });
  });
  for (let filename of filenames) {
    if ((yield fs.stat(filename)).isFile()) {
      var key = path.relative(opts.base, filename);
      console.log('deploy ' + key);
      var result = yield client.put(key, filename);
      console.log(result);
    }
  }
};

gulp.task('deploy', ['dist'], function () {
  co(function * () {
    var config = JSON.parse((yield fs.readFile('config.json')).toString());
    var client = new OSS({
      region: config.region,
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret
    });
    client.useBucket(config.bucket);
    yield * uploadDir(client, 'dist', { base: 'dist' });
  })
  .catch(console.error);
});

gulp.task('css', function () {
  return gulp.src('postcss/main.css')
    .pipe( sourcemaps.init() )
    .pipe( postcss([
      require('postcss-import'),
      require('postcss-custom-media'),
      require('postcss-calc'),
      require('postcss-custom-properties'),
      require('postcss-color-function'),
      require('postcss-discard-comments'),
      require('postcss-extend'),
      require('postcss-nesting'),
      require('autoprefixer'),
    ]) )
    .pipe( sourcemaps.write('.') )
    .pipe( gulp.dest('css/') ).pipe(connect.reload());
});

gulp.task('lint', function() {
  return gulp.src(
    ['js/**/*.js','!node_modules/**', '!js/bundle.js', '!js/vendor/**',
      '!js/config.js']
  )
  // eslint() attaches the lint output to the "eslint" property
  // of the file object so it can be used by other modules.
  .pipe(eslint())
  // eslint.format() outputs the lint results to the console.
  // Alternatively use eslint.formatEach() (see Docs).
  .pipe(eslint.format())
  // To have the process exit with an error code (1) on
  // lint error, return the stream and pipe to failAfterError last.
  .pipe(eslint.failAfterError());
});

gulp.task('gen-object-app', function (done) {
  inquirer.prompt([
    {
      type: 'input',
      name: '对象名称',
      message: '输入对象名称, 使用snake case命名法',
    }, {
      type: 'input',
      name: 'store模块文件',
      message: '输入store模块文件',
      default: function (answers) {
        return answers.对象名称.replace('_', '-') + '-store';
      }
    }, {
      type: 'input',
      name: '对象中文名称',
      message: '输入对象中文名称',
    }, {
      type: 'input',
      name: '对象名称字段',
      message: '输入对象名称字段',
      default: 'name',
    }
  ]).then(function (answers) {
    gulp.src(__dirname + '/templates/object-app.js')
    .pipe(template(Object.assign({
      'store模块引入名': casing.camelize(answers.对象名称) + 'Store',
    }, answers)))
    .pipe(conflict('./js/' + answers.对象名称.replace('_', '-'), {
      defaultChoice: 'd'
    }))
    .pipe(gulp.dest('./js/' + answers.对象名称.replace('_', '-')))
    .on('end', function () {
      done();
    })
    .resume();
  });
});

gulp.task('gen-list-app', function (done) {
  inquirer.prompt([
    {
      type: 'input',
      name: '对象名称',
      message: '输入对象名称, 使用snake case命名法',
    }, {
      type: 'input',
      name: 'store模块文件',
      message: '输入store模块文件',
      default: function (answers) {
        return answers.对象名称.replace('_', '-') + '-store';
      }
    }, {
      type: 'input',
      name: '对象label',
      message: '输入对象label',
    }
  ]).then(function (answers) {
    gulp.src(__dirname + '/templates/list-app.js')
    .pipe(template(Object.assign({
      'store模块引入名': casing.camelize(answers.对象名称) + 'Store',
    }, answers)))
    .pipe(conflict('./js/' + answers.对象名称.replace('_', '-'), {
      defaultChoice: 'd'
    }))
    .pipe(gulp.dest('./js/' + answers.对象名称.replace('_', '-')))
    .on('end', function () {
      done();
    })
    .resume();
  });
});

gulp.task('gen-store', function (done) {
  inquirer.prompt([
    {
      type: 'input',
      name: '对象名称',
      message: '输入对象名称, 使用snake case命名法',
    }
  ]).then(function (answers) {
    let {对象名称} = answers;
    对象名称 = 对象名称.replace('_', '-');
    gulp.src(__dirname + '/templates/store.js')
    .pipe(template({ 对象名称 }))
    .pipe(rename(function (path) {
      path.basename = 对象名称 + '-store';
    }))
    .pipe(conflict('./js/store/', {
      defaultChoice: 'd'
    }))
    .pipe(gulp.dest('./js/store/'))
    .on('end', function () {
      done();
    })
    .resume();
  });

});
