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
var header = require('gulp-header');
var concat = require('gulp-concat');
var runSequence = require('run-sequence');

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

gulp.task('build-css', function() {
  return gulp.src([
    "./css/bolt.normalise.css",
    "./css/bolt.classes.css",
    "./css/bolt.forms.css",
    "./css/bolt.grid.css",
    "./css/bolt.type.css"
  ])
  // Concat files
  .pipe(concat('bolt-' + package.version + '.css'))
  // Add a comment to the top
  .pipe(header('/* bolt ' + package.version + ' CSS */\n\n'))
  // Write the file to the directory
  .pipe(gulp.dest('./css/'));
});


var files = [
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
];

var museeFiles = [
  "./js/jquery.support.inputtypes.js",
  "./js/jquery.event.move.js",
  "./js/jquery.event.swipe.js",
  "./js/jquery.event.activate.js",
  //"./js/jquery.dialog.js",
  "./js/jquery.transition.js",
  "./js/jquery.validate.js",
  "./js/bolt.js",
  "./js/bolt.a.js",
  //"./js/bolt.dialog.js",
  "./js/bolt.input.musees.js",
  //"./js/bolt.input.placeholder.js",
  "./js/bolt.slide.js",
  //"./js/bolt.tab.js",
  //"./js/bolt.tip.js",
  "./js/bolt.toggle.js"
];

gulp.task('build-js', function() {
  return gulp.src(museeFiles)
  // Concat files
  .pipe(concat('bolt-' + package.version + '.js'))
  // Add a comment to the top
  .pipe(header('/* bolt ' + package.version + ' JS */\n\n'))
  // Write the file to the directory
  .pipe(gulp.dest('./js/'));
});

gulp.task('default', function(done) {
  runSequence(['build-css', 'build-js'], done);
});
