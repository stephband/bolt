var path = require('path');
var gulp = require('gulp');


var CONFIG = {};

CONFIG.dir = {
  src: 'js',
  build: 'build',
  testSpec: 'test/spec',
  testConfig: 'test/config'
}

CONFIG.files = {
  src: path.join(CONFIG.dir.src, '**', '*.js'),
  testSpec: path.join(CONFIG.dir.testSpec, '**', '*.spec.js')
}

CONFIG.plugins = {
  loadPlugins: {

  },
  karma: {
    // unfortunately, karma needs the __dirname here
    configFile: path.join(__dirname, CONFIG.dir.testConfig, 'karma.conf.js'),
    browsers: ['Chrome'],
    singleRun: true
  }
}

// Load the gulp plugins
var package = require('./package.json');
var gulp = require('gulp');
var sass = require('gulp-sass');
var header = require('gulp-header');
var concat = require('gulp-concat');
var runSequence = require('run-sequence');
var exec = require('child_process').exec;

// Lint the source files
gulp.task('lint:src', function() {
  return gulp.src([
    CONFIG.files.src
  ])
  // eslint() attaches the lint output to the eslint property
  // of the file object so it can be used by other modules.
  .pipe($.eslint())
  // eslint.format() outputs the lint results to the console.
  // Alternatively use eslint.formatEach() (see Docs).
  .pipe($.eslint.format())
  // To have the process exit with an error code (1) on
  // lint error, return the stream and pipe to failOnError last.
  .pipe($.eslint.failOnError());
});

// Run the unit tests
gulp.task('test:spec', function(done) {
  return karma
  .start(CONFIG.plugins.karma, function(err) {
    // Stop the gulp task when an error occurs
    // in the unit tests
    if (err) {
      process.exit(1);
    }
    done();
  });
});

gulp.task('sass', function() {
  gulp.src('css/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./css/'));
});

gulp.task('build-css', function() {
  return gulp.src([
    "css/normalise.css",
    "css/form.css",
    "css/block.css",
    "css/index.css",
    "css/card.css",
    "css/button.css",
    "css/thumb.css",
    "css/grid.css",
    "css/text.css",
    "css/color.css",
    "css/utilities.css",
    "css/document.css",
    "css/nav.css",
    "css/space.css"
  ])
  // Concat files
  .pipe(concat('bolt-' + package.version + '.css'))
  // Add a comment to the top
  .pipe(header('/* bolt ' + package.version + ' CSS */\n\n'))
  // Write the file to the directory
  .pipe(gulp.dest('./package/css/'));
});

gulp.task('build-js', function() {
  return gulp.src([
    "./js/jquery.support.inputtypes.js",
    "./js/jquery.event.move.js",
    "./js/jquery.event.swipe.js",
    "./js/jquery.event.activate.js",
    "./js/jquery.dialog.js",
    "./js/jquery.transition.js",
    "./js/jquery.validate.js",
    "./js/bolt.js",
    "./js/bolt.a.js",
    "./js/bolt.dialog.js",
    "./js/bolt.input.js",
    "./js/bolt.input.placeholder.js",
    "./js/bolt.slide.js",
    "./js/bolt.tab.js",
    "./js/bolt.tip.js",
    "./js/bolt.toggle.js"
  ])
  // Concat files
  .pipe(concat('bolt-' + package.version + '.js'))
  // Add a comment to the top
  .pipe(header('/* bolt ' + package.version + ' JS */\n\n'))
  // Write the file to the directory
  .pipe(gulp.dest('./package/js/'));
});

gulp.task('kss', function(cb) {
  exec('./node_modules/kss/bin/kss-node --config config.json', function(error, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(error);
  });
});

gulp.task('default', function(done) {
  runSequence(['sass', 'build-css', 'build-js', 'kss'], done);
});
