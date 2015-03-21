module.exports = function( grunt ){

	var
		jsFiles = [
			'www/js/config.js',
			'www/js/lib/jquery.js',
			'www/js/lib/angular_1.2.23.js',
			'www/js/lib/angular-ui.js',
			'www/js/lib/angular-route.js',
			'www/js/lib/angular-storage.js',
			'www/js/lib/sockjs.js',
			'www/js/lib/angular-socket.js',
			'www/js/lib/moment.js',
			'www/js/lib/underscore.js',
			'www/js/lib/underscore.string.js',
			'www/js/lib/bootstrap/*.js',
			'www/js/lib/bootstrap-datetimepicker.js',
			'www/js/lib/uri.js',
			'www/js/lib/progressbar.js',
			'www/js/lib/jquery.sparkline.js',
			'www/js/lib/highcharts.js',
			'www/js/configApp/configApp.js',
			'www/js/configApp/**/*.js',
			'www/js/app/app.js',
			'www/js/app/**/*.js',
			'<%= ngtemplates.index.dest %>'
		],
		jsFilesProd = [].concat( jsFiles ),
		globals = {
			title       : 'SuperINDEX',
			name        : 'SuperINDEX',
			geo_title   : 'World',
			description : 'News beat of the Europe',
			image       : '/img/superindex.png', //TODO change with absolute URLs
			js          : '/build/js/app.js',
			css         : '/build/css/screen.css',
			app         : 'index',
			ctrl        : 'AppCtrl',
			'class'     : ''
		};

	grunt.initConfig( {
		pkg : grunt.file.readJSON( 'package.json' ),

		clean : {
			dev  : [ ],
			prod : [ 'www/add.html', 'www/test.html', 'www/test' ]
		},

		ngtemplates : {
			index : {
				cwd     : 'www',
				src     : ['js/app/**/*.html'],
				dest    : 'tmp/appTemplates.js',
				options : {
					prefix : '/'
				}
			}
		},

		concat : {
			dev       : {
				src  : jsFiles,
				dest : 'www/build/js/app.js'
			},
			prod      : {
				src  : jsFilesProd,
				dest : 'www/build/js/app.js'
			},
			ie        : {
				src  : [
					'www/js/lib/html5.js'
				],
				dest : 'www/build/js/html5.js'
			},
			test      : {
				src  : [
					'www/build/js/app.js',
					'www/js/testApp/testApp.js',
					'www/js/testApp/**/*.js'
				],
				dest : 'www/build/js/testApp.js'
			},
			widgetApp : {
				src  : [
					'www/build/js/app.js',
					'www/js/widgetApp/widgetApp.js',
					'www/js/widgetApp/**/*.js'
				],
				dest : 'www/build/js/widgetApp.js'
			},
			widget    : {
				src  : [
					'www/js/widget/widget.js'
				],
				dest : 'www/e/w.js'
			}

		},
		uglify : {
			js        : {
				src  : 'www/build/js/app.js',
				dest : 'www/build/js/app.js'
			},
			testjs    : {
				src  : 'www/build/js/testApp.js',
				dest : 'www/build/js/testApp.js'
			},
			widgetApp : {
				src  : 'www/build/js/widgetApp.js',
				dest : 'www/build/js/widgetApp.js'
			},
			widget    : {
				src  : 'www/e/w.js',
				dest : 'www/e/w.js'
			},
			ie        : {
				src  : 'www/build/js/html5.js',
				dest : 'www/build/js/html5.js'
			}
		},

		compress : {
			js  : {
				options : {
					mode : 'gzip'
				},
				files   : [
					{
						expand : true,
						src    : ['www/build/js/*.js'],
						rename : function( dest, src ){
							return src + '.gz';
						}
					}
				]
			},
			css : {
				options : {
					mode : 'gzip'
				},
				files   : [
					{
						expand : true,
						src    : ['www/build/css/*.css'],
						rename : function( dest, src ){
							return src + '.gz';
						}
					}
				]
			}
		},

		watch   : {
			js : {
				files : ['www/js/lib/*.js', 'www/js/**/*.js', 'www/js/**/*.html'],
				tasks : [ 'dev.js' ]
			},

			html : {
				files : ['html/**/*.*'],
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
					'www/build/js/app.js',
					'www/build/js/widgetApp.js'
				]
			},
			css : {
				src : [ 'www/build/css/screen.css', 'www/build/css/screen-widget.css' ]
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
			html    : ['www/**/index.html', 'tmpl/**/*.tmpl'],
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
				src     : ['**/index.html', '!test/index.html' ],
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
				src     : ['**/index.html'],
				dest    : 'www/'
			},

			tmpl : {
				options : {
					prefix      : '<!-- @@',
					suffix      : ' -->',
					globals     : globals,
					includesDir : 'html/'
				},
				expand  : true,
				cwd     : 'html/tmpl',
				src     : '*.tmpl',
				dest    : 'tmpl/'
			}
		},

		htmlmin : {
			prod     : {
				options : {
					removeComments     : true,
					collapseWhitespace : true,
					minifyJS           : false
				},
				expand  : true,
				cwd     : 'www',
				src     : '**/index.html',
				dest    : 'www/'
			},
			dev      : {
				expand : true,
				cwd    : 'www',
				src    : '**/index.html',
				dest   : 'www/'
			},
			tmplDev  : {
				expand : true,
				cwd    : 'tmpl',
				src    : '*.tmpl',
				dest   : 'tmpl/'
			},
			tmplProd : {
				options : {
					removeComments     : true,
					collapseWhitespace : true,
					minifyJS           : false
				},
				expand  : true,
				cwd     : 'tmpl',
				src     : '*.tmpl',
				dest    : 'tmpl/'
			}
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
	grunt.loadNpmTasks( 'grunt-contrib-clean' );
	grunt.loadNpmTasks( 'grunt-contrib-compress' );


	grunt.registerTask( 'dev.js', [ 'ngtemplates', 'concat:dev', 'concat:widgetApp', 'concat:widget', 'concat:test', 'concat:ie'] );
	grunt.registerTask( 'dev.sass', [ 'compass:clean', 'compass:dev' ] );
	grunt.registerTask( 'dev.html', [ 'includereplace:dev', 'includereplace:tmpl', 'htmlmin:dev', 'htmlmin:tmplDev' ] );
	grunt.registerTask( 'dev', [ 'clean:dev', 'dev.js', 'dev.sass', 'dev.html' ] );

	grunt.registerTask( 'prod.js', [ 'ngtemplates', 'concat:prod', 'concat:widgetApp', 'concat:widget', 'concat:ie', 'uglify'] );
	grunt.registerTask( 'prod.sass', [ 'compass:prod' ] );
	grunt.registerTask( 'prod.html', [ 'includereplace:prod', 'includereplace:tmpl', 'htmlmin:prod', 'htmlmin:tmplProd', 'filerev', 'usemin', 'filerev_assets' ] );
	grunt.registerTask( 'prod.compress', [ 'compress:js', 'compress:css' ] );
	grunt.registerTask( 'prod', [ 'clean:prod', 'prod.js', 'prod.sass', 'prod.html', 'prod.compress' ] );

	grunt.registerTask( 'default', [ 'dev' ] );
};
