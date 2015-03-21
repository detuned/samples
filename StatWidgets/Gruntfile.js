module.exports = function( grunt ){

	var
		jsFiles = {
			common : [
				'www/js/lib/jquery.js',
				'www/js/lib/angular.js',
				'www/js/lib/angular-route.js',
				'www/js/lib/underscore.js',
				'www/js/lib/underscore.string.js',
				'www/js/lib/moment.js',
				'www/js/lib/highcharts.js'
			],

			lite : [
				'www/js/config.js',
				'www/js/app/config/config.js',
				'www/js/app/lite/lite.js',
				'www/js/app/**/*.js',
				'<%= ngtemplates.lite.dest %>'
			],

			widgets : [
				'www/js/lib/require.js',
				'www/wd/x/config.js',
				'www/wd/**/*.js'
			],

			xWidgets : [
				'www/wd/x/config.js',
				'www/wd/x/x.js'
			],

			ie : [
				'www/js/lib/html5.js'
			]
		},
		jsFilesProd = [].concat( jsFiles ),
		globals = {
			title       : 'Lite Statistics Dashboard',
			name        : 'Lite',
			description : 'Stat ',
			js          : '/build/js/app.js',
			css         : '/build/css/screen.css',
			app         : 'lite',
			ctrl        : 'AppCtrl',
			'class'     : ''
		},
		terminal = require('child_process').exec,
		gzipFiles = {};

	grunt.initConfig( {
		pkg : grunt.file.readJSON( 'package.json' ),

		ngtemplates : {
			lite : {
				cwd     : 'www',
				src     : ['js/app/lite/**/*.html'],
				dest    : 'tmp/templates/lite.js',
				options : {
					prefix : '/'
				}
			}
		},

		concat : {
			lite    : {
				src  : jsFiles.common.concat( jsFiles.lite, jsFiles.widgets ),
				dest : 'www/build/js/lite.js'
			},
			widgets : {
				src  : jsFiles.widgets,
				dest : 'www/build/js/w.js'
			},

			xWidgets : {
				src  : jsFiles.xWidgets,
				dest : 'www/build/js/wx.js'
			},

			ie : {
				src  : jsFiles.ie,
				dest : 'www/build/js/ie.js'
			}
		},

		copy : {
			widgets : {
				files : [
					{
						expand : true,
						cwd    : 'www/wd',
						src    : ['**'],
						dest   : 'www/w/'
					},
					{
						src  : 'www/build/js/w.js',
						dest : 'www/w/all.js'
					},
					{
						src  : 'www/build/js/wx.js',
						dest : 'www/w/x/x.js'
					},
					{
						expand : true,
						cwd    : 'www/js/lib',
						src    : ['**'],
						dest   : 'www/w/lib/'
					}
				]
			}
		},

		uglify : {
			lite    : {
				src  : 'www/build/js/lite.js',
				dest : 'www/build/js/lite.js'
			},
			widgets : {
				files : [
					{
						expand : true,
						cwd    : 'www/w',
						src    : [ '**/*.js' ],
						dest   : 'www/w'
					}
				]
			},
			ie      : {
				src  : 'www/build/js/ie.js',
				dest : 'www/build/js/ie.js'
			}
		},

		compress : {
			all  : {
				options : {
					mode : 'gzip'
				},
				files   : [
					{
						expand : true,
						src    : [
							'www/build/js/**/*.js',
							'www/w/**/*.js',

							'www/build/css/*.css',
							'www/w/**/*.css',

							'www/**/index.html',
							'www/w/**/*.html'
						],
						rename : function( dest, src ){
							//Save all files to allow the gzipMtime task use it later for changing mtime
							gzipFiles[ src ] = src + '.gz';
							return src + '.gz';
						}
					}
				]
			}
		},


		watch   : {
			lite : {
				files : [
					'www/js/**/*.js',
					'www/js/**/*.html',
					'www/wd/**/*',
					'www/js/lib/**/*.js'
				],
				tasks : [ 'dev.js' ]
			},

			html : {
				files : ['html/**/*.html'],
				tasks : [ 'dev.html' ]
			},
			sass : {
				files : ['sass/**', 'www/img/icons*//**//*'],
				tasks : ['compass:dev']
			}
		},
		compass : {
			clean : {
				options : {
					clean : true
				}
			},
			dev   : {
				options : {
					config : 'config.rb'
				}
			},
			prod  : {
				options : {
					config         : 'config.rb',
					'environment'  : 'production',
					'output-style' : 'compressed'
				}
			}
		},

		filerev : {
			js  : {
				src : [
					'www/build/js/lite.js',
					'www/build/js/w.js'
				]
			},
			css : {
				src : ['www/build/css/screen.css' ]
			}
		},

		filerev_assets : {
			dist : {
				options : {
					dest : 'tmp/assets.json'
				}
			}
		},

		usemin : {
			html    : ['www/**/index.html'],
			options : {
				assetsDirs : ['www']
			}
		},

		includereplace : {
			prod : {
				options : {
					prefix      : '<!-- @@',
					suffix      : ' -->',
					globals     : globals,
					includesDir : 'html/'
				},
				expand  : true,
				cwd     : 'html/',
				src     : ['**/index.html'],
				dest    : 'www/'
			},
			dev  : {
				options : {
					prefix      : '<!-- @@',
					suffix      : ' -->',
					globals     : globals,
					includesDir : 'html/'
				},
				expand  : true,
				cwd     : 'html/',
				src     : '**/index.html',
				dest    : 'www/'
			}
		},

		htmlmin : {
			prod : {
				options : {
					removeComments     : true,
					collapseWhitespace : true,
					minifyJS           : true
				},
				expand  : true,
				cwd     : 'www',
				src     : '**/index.html',
				dest    : 'www/'
			},
			dev  : {
				expand : true,
				cwd    : 'www',
				src    : '**/index.html',
				dest   : 'www/'
			}
		}
	} );

	grunt.registerTask( 'gzipMtime', function (){
		var cmd;
		for ( var src in gzipFiles ){
			cmd = 'touch -r ' + src + ' ' + gzipFiles[src];
			grunt.log.writeln( '  Exec ' + cmd );
			terminal( cmd, function(error, stdout, stderr) {
				if ( error ) {
					grunt.log.error( '    Error exec `' + cmd + '`:' + error + ' (' + stderr + ')' );
				}
			} );
		}
	} );

	grunt.loadNpmTasks( 'grunt-contrib-concat' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );
	grunt.loadNpmTasks( 'grunt-contrib-uglify' );
	grunt.loadNpmTasks( 'grunt-contrib-compass' );
	grunt.loadNpmTasks( 'grunt-angular-templates' );
	grunt.loadNpmTasks( 'grunt-filerev' );
	grunt.loadNpmTasks( 'grunt-filerev-assets' );
	grunt.loadNpmTasks( 'grunt-usemin' );
	grunt.loadNpmTasks( 'grunt-contrib-htmlmin' );
	grunt.loadNpmTasks( 'grunt-include-replace' );
	grunt.loadNpmTasks( 'grunt-contrib-copy' );
	grunt.loadNpmTasks( 'grunt-contrib-compress' );

	grunt.registerTask( 'dev.js.lite', [ 'ngtemplates', 'concat:lite', 'concat:ie' ] );
	grunt.registerTask( 'dev.js.widgets', [ 'concat:widgets', 'concat:xWidgets', 'copy:widgets' ] );
	grunt.registerTask( 'dev.js', [ 'dev.js.lite', 'dev.js.widgets' ] );

	grunt.registerTask( 'dev.sass', [ 'compass:clean', 'compass:dev' ] );
	grunt.registerTask( 'dev.html', [ 'includereplace:dev', 'htmlmin:dev' ] );
	grunt.registerTask( 'dev', [ 'dev.js', 'dev.sass', 'dev.html' ] );


	grunt.registerTask( 'prod.js.lite', [ 'ngtemplates', 'concat:lite', 'concat:ie', 'uglify:lite' ] );
	grunt.registerTask( 'prod.js.widgets', [ 'concat:widgets', 'concat:xWidgets', 'copy:widgets', 'uglify:widgets' ] );
	grunt.registerTask( 'prod.js', [ 'prod.js.lite', 'prod.js.widgets' ] );

	grunt.registerTask( 'prod.sass', [ 'compass:prod' ] );
	grunt.registerTask( 'prod.html', [ 'includereplace:prod', 'htmlmin:prod', 'filerev', 'usemin', 'filerev_assets' ] );
	grunt.registerTask( 'prod.compress', [ 'compress:all', 'gzipMtime' ] );
	grunt.registerTask( 'prod', [ 'prod.js', 'prod.sass', 'prod.html', 'prod.compress' ] );


	grunt.registerTask( 'default', [ 'dev' ] );
};
