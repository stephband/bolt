module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		package: grunt.file.readJSON('package.json'),

		clean: ['./public/', './styleguide/'],

		concat: {
			options: {
				stripBanners: true,
				banner: '/* \n * <%= package.name %> - v<%= package.version %> - <%= grunt.template.today("yyyy") %> \n * \n * <%= package.author %>, and the web community.\n * Licensed under the <%= package.license %> license. \n * \n * Many thanks to Brad Frost and Dave Olsen for inspiration, encouragement, and advice. \n *\n */\n\n',
			},
			patternlab: {
				src: './builder/patternlab.js',
				dest: './builder/patternlab.js'
			},
			object_factory: {
				src: './builder/object_factory.js',
				dest: './builder/object_factory.js'
			},
			lineage: {
				src: './builder/lineage_hunter.js',
				dest: './builder/lineage_hunter.js'
			},
			media_hunter: {
				src: './builder/media_hunter.js',
				dest: './builder/media_hunter.js'
			},
			patternlab_grunt: {
				src: './builder/patternlab_grunt.js',
				dest: './builder/patternlab_grunt.js'
			},
			parameter_hunter: {
				src: './builder/parameter_hunter.js',
				dest: './builder/parameter_hunter.js'
			},
			pattern_exporter: {
				src: './builder/pattern_exporter.js',
				dest: './builder/pattern_exporter.js'
			},
			pattern_assembler: {
				src: './builder/pattern_assembler.js',
				dest: './builder/pattern_assembler.js'
			},
			pseudopattern_hunter: {
				src: './builder/pseudopattern_hunter.js',
				dest: './builder/pseudopattern_hunter.js'
			},
			list_item_hunter: {
				src: './builder/list_item_hunter.js',
				dest: './builder/list_item_hunter.js'
			},
			style_modifier_hunter: {
				src: './builder/style_modifier_hunter.js',
				dest: './builder/style_modifier_hunter.js'
			}
		},

		copy: {
			patternlab: {
				files: [
					{ expand: true, cwd: './patternlab-template/', src: '**', dest: './public/' }
				]
			},

			main: {
				files: [
					{ expand: true, cwd: './source/js/', src: '*', dest: './public/js/'},
					{ expand: true, cwd: './source/css/', src: ['*.css', '*.map'], dest: './public/css/' },
					{ expand: true, cwd: './source/images/', src: ['*.png', '*.jpg', '*.gif', '*.jpeg', '*.svg'], dest: './public/images/' },
					{ expand: true, cwd: './source/images/sample/', src: ['*.png', '*.jpg', '*.gif', '*.jpeg', '*.svg'], dest: './public/images/sample/'},
					{ expand: true, cwd: './source/media/', src: ['*.mp4', '*.ogg'], dest: './public/media/'},
					{ expand: true, cwd: './source/fonts/', src: '**', dest: './public/fonts/'},
					{ expand: true, cwd: './source/_data/', src: 'annotations.js', dest: './public/data/' }
				]
			},

			css: {
				files: [
					{ expand: true, cwd: './source/css/', src: '*.css', dest: './public/css/' }
				]
			}
		},

		watch: {
			all: {
				files: [
					'source/css/**/*.scss',
					'source/js/**/*.js',
					//'public/styleguide/css/*.css',
					'source/_patterns/**/*.mustache',
					'source/_patterns/**/*.json',
					'source/_data/*.json'
				],
				tasks: ['default']
			},
			// scss: {
			// 	files: ['source/css/**/*.scss', 'public/styleguide/css/*.scss'],
			// 	tasks: ['sass', 'copy:css','bsReload:css']
			// },
			patterns: {
				files: [
					'source/_patterns/**/*.mustache',
					'source/_patterns/**/*.json',
					'source/_data/*.json'
				],
				tasks: ['default']
			}
		},

		sass: {
			build: {
				options: {
					style: 'expanded',
					precision: 8
				},
				files: {
					'source/css/style.css':     'source/css/style.scss',
					'source/css/theme-arc.css': 'source/css/theme-arc.scss',
					'source/css/theme-arl.css': 'source/css/theme-arl.scss',
					'source/css/theme-bot.css': 'source/css/theme-bot.scss',
					'source/css/theme-cin.css': 'source/css/theme-cin.scss',
					'source/css/theme-mcb.css': 'source/css/theme-mcb.scss',
					'source/css/theme-mon.css': 'source/css/theme-mon.scss',
					'source/css/theme-mor.css': 'source/css/theme-mor.scss',
					'source/css/theme-zoo.css': 'source/css/theme-zoo.scss',
					'source/css/theme-pal.css': 'source/css/theme-pal.scss'
					//'./public/styleguide/css/static.css': './public/styleguide/css/static.scss',
					//'./public/styleguide/css/styleguide.css': './public/styleguide/css/styleguide.scss',
					//'./public/styleguide/css/styleguide-specific.css': './public/styleguide/css/styleguide-specific.scss'
				}
			}
		},

		//nodeunit: {
		//	all: ['test/*_tests.js']
		//},

		//browserSync: {
		//	dev: {
		//		options: {
		//			server:  './public',
		//			watchTask: true,
		//			plugins: [
		//				{
		//					module: 'bs-html-injector',
		//					options: {
		//						files: './public/index.html'
		//					}
		//				}
		//			]
		//		}
		//	}
		//},

		//bsReload: {
		//	css: './public/**/*.css'
		//},

		uglify: {
			options: {
				banner: '/*! <%= package.name %> <%= package.version %> */\n',
				screwIE8: true
			},

			build: {
				files: [{
					src: [
						'source/js/object.assign.js',
						'source/js/jquery-2.1.4.js',
						'source/js/window.breakpoint.js',
						'source/js/bolt-musees.js',
						'source/js/site-nav.js',
						'source/js/logo-thumb.js',
						'source/js/slide.js'
					],
					dest: 'public/js/musees.min.js'
				}]
			},
		},

		cssmin: {
			target: {
				files: {
					'public/css/style.min.css':     [
						'source/fonts/roboto/stylesheet.css',
						'source/css/style.css'
					],
					'public/css/theme-arc.min.css': 'source/css/theme-arc.css',
					'public/css/theme-arl.min.css': 'source/css/theme-arl.css',
					'public/css/theme-bot.min.css': 'source/css/theme-bot.css',
					'public/css/theme-cin.min.css': 'source/css/theme-cin.css',
					'public/css/theme-mcb.min.css': 'source/css/theme-mcb.css',
					'public/css/theme-mon.min.css': 'source/css/theme-mon.css',
					'public/css/theme-mor.min.css': 'source/css/theme-mor.css',
					'public/css/theme-zoo.min.css': 'source/css/theme-zoo.css',
					'public/css/theme-pal.min.css': 'source/css/theme-pal.css'
				}
			}
		},

		browserSync: {
			dev: {
				bsFiles: {
					src : [
						/* PatternLab public files */
						'public/css/*.css',
						'public/patterns/*.html',

						/* KSS public files */
						'styleguide/*.html'
					]
				},
				options: {
					watchTask: true,
					server: "./"
				}
			}
		},

		// The only way I have found to make KSS generation work inside Grunt,
		// or indeed outside Grunt, is to run it directly as a shell command. I
		// did try the grunt-kss and grunt-kssgen packages, but no joy.
		shell: {
			kss: {
				command: './node_modules/kss/bin/kss-node --config styleguide-config.json'
			}
		},

		'gh-pages': {
			options: {},
			src: ['index.html', 'README.md', 'public/**', 'styleguide/**']
		}
	});

	// Load NPM tasks
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-browser-sync');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-gh-pages');
	grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks('grunt-browser-sync');

	//load the patternlab task
	grunt.task.loadTasks('./builder/');

	// Define tasks
	grunt.registerTask('default',  ['clean', 'copy:patternlab', 'patternlab', 'sass', 'copy:main', 'cssmin', 'uglify:build', 'shell:kss']);
	grunt.registerTask('live',     ['default', 'watch:all']);
	grunt.registerTask('livesync', ['default', 'browserSync', 'watch:all']);
	grunt.registerTask('publish',  ['gh-pages']);
};
