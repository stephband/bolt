var path = require('path');
var gulp = require('gulp');
var sass = require('gulp-sass');
var header = require('gulp-header');
var concat = require('gulp-concat');
var runSequence = require('run-sequence');
var exec = require('child_process').exec;
var package = require('./package.json');

var files = {
	css: [
		"css/normalise.css",
		"css/form.css",
		"css/block.css",
		"css/dialog.css",
		"css/index.css",
		"css/layer.css",
		"css/card.css",
		"css/bubble.css",
		"css/button.css",
		"css/thumb.css",
		"css/grid.css",
		"css/text.css",
		"css/utilities.css",
		"css/color.css",
		"css/dom.css",
		"css/space.css",
		"css/action.css"
	],

	js: [
		"js/jquery.support.inputtypes.js",
		"js/jquery.event.move.js",
		"js/jquery.event.swipe.js",
		"js/jquery.event.activate.js",
		"js/jquery.dialog.js",
		"js/jquery.transition.js",
		"js/jquery.validate.js",
		"js/bolt.js",
		"js/bolt.a.js",
		"js/bolt.dialog.js",
		"js/bolt.input.js",
		"js/bolt.input.placeholder.js",
		"js/bolt.slide.js",
		"js/bolt.tab.js",
		"js/bolt.tip.js",
		"js/bolt.toggle.js"
	],

    jquery: 'js/jquery-2.2.0.js'
};

var config = {
	kss: {
		title: (package.title || ''),

		// Directories to search for KSS comments
		source: ['css', 'scss'],

		// Directory to render styleguide
		destination: 'styles',

		// Location of template
		template: 'styles-template',

		// Relative paths to include in styleguide
		css: files.css.map(upLevel),
		js: [upLevel(files.jquery)].concat(files.js.map(upLevel))
	},

	karma: {
		// unfortunately, karma needs the __dirname here
		//configFile: path.join(__dirname, CONFIG.dir.testConfig, 'karma.conf.js'),
		browsers: ['Chrome'],
		singleRun: true
	}
};

function upLevel(path) {
	return '../' + path;
}

// Lint the source files
gulp.task('lint:src', function() {
  return gulp.src([files.js])
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
  .start(config.karma, function(err) {
    // Stop the gulp task when an error occurs
    // in the unit tests
    if (err) {
      process.exit(1);
    }
    done();
  });
});

gulp.task('sass', function() {
  gulp.src('scss/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./css/'));
});

gulp.task('build-css', function() {
  return gulp.src(files.css)
  // Concat files
  .pipe(concat('bolt-' + package.version + '.css'))
  // Add a comment to the top
  .pipe(header('/* bolt ' + package.version + ' CSS */\n\n'))
  // Write the file to the directory
  .pipe(gulp.dest('./package/css/'));
});

gulp.task('build-js', function() {
  return gulp.src(files.js)
  // Concat files
  .pipe(concat('bolt-' + package.version + '.js'))
  // Add a comment to the top
  .pipe(header('/* bolt ' + package.version + ' JS */\n\n'))
  // Write the file to the directory
  .pipe(gulp.dest('./package/js/'));
});

gulp.task('kss', function(cb) {
	var command =
		'./node_modules/kss/bin/kss-node' +
		' --source '      + config.kss.source.join(' --source ') +
		' --destination ' + config.kss.destination +
		' --template '    + config.kss.template +
		' --css '         + config.kss.css.join(' --css ') +
        ' --js '          + config.kss.js.join(' --js ') ;

	exec(command, function(error, stdout, stderr) {
		console.log(stdout);
		console.log(stderr);
		cb(error);
	});
});

gulp.task('default', function(done) {
	runSequence(['sass', 'build-css', 'build-js', 'kss'], done);
});
