angular.module( 'lite' )
	.service( 'templateService', [function(){
		var templateService = {};

		templateService.getUrl = function( url ){
			var
				m,
				parts = [],
				res;
			if( m = url.match( /^\/\/([^\/]+)((?:\/.+)+)?\/([^\/\:]+?)(?:\:([^\/\.]+))?(?:\.([^\/]+))?$/ ) ){
				parts.push( '/js/app' );

				// App
				parts.push( m[1] );

				// Path
				if( m[2] ){
					parts.push( _.str.trim( m[2], '/' ) );
				}

				//Directive's folder
				parts.push( 'directives', m[3] );

				//File name + extension
				//Name by default equals to folder
				parts.push( ( m[4] || m[3] ) + '.' + ( m[5] || 'html' ) );

				res = parts.join( '/' );
			}
			else {
				res = url;
			}
			return res;
		};

		return templateService;
	}] );