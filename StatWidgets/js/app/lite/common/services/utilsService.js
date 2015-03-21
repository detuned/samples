angular.module( 'lite' )
	.service( 'utilsService', [
		'$window',
		'$timeout',
		function( $window, $timeout ){
			var utilsService = {};

			utilsService.redirect = function( url ){
				$window.location.href = url;
			};

			utilsService.elementDestructor = function( element ){
				var destructors = [];
				element.on( '$destroy', function(){
					angular.forEach( destructors, function( d ){
						d();
					} )
				} );
				return {
					push : _.bind( destructors.push, destructors )
				}
			};

			utilsService.timersManager = function(){
				var
					timers = {},
					instance = {
						resetTimer : resetTimer,
						setTimer   : setTimer
					};

				function resetTimer( name ){
					if( timers[ name ] ){
						$timeout.cancel( timers[name] );
						timers[name] = null;
					}
					return instance;
				}

				function setTimer( name, action, delay ){
					resetTimer( name );
					return ( timers[name] = $timeout( action, delay ) );
				}

				return instance;
			};

			utilsService.scopeDestructor = function( scope ){
				var destructors = [];
				scope.$on( '$destroy', function(){
					angular.forEach( destructors, function( d ){
						d();
					} )
				} );
				return {
					push : _.bind( destructors.push, destructors )
				}
			};

			utilsService.getClearUrl = function( url ){
				var res = url.toString().replace( /^(https?:\/\/)(www\.)?/, '' ).replace( /\/.*$/, '' );
				return res;
			};

			utilsService.parseCsvString = function( str ){
				var p = _.map( str.split( ',' ), angular.element.trim );
				return p;
			};


			return utilsService;
		}] );