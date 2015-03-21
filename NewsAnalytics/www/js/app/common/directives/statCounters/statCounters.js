angular.module( 'index' )
	.directive( 'statCounters', [
		'$log',
		'$window',
		'utilsService',
		function( $log, $window, utilsService ){
			return {
				scope : {
					counters : '@statCounters'
				},
				link : function( scope, element, attrs ){
					if( ! scope.counters ){
						return;
					}
					var
						types = {
							op : {
								add : addOpenstatCounter
							},
							ga: {
								add : addGoogleAnalyticsCounter
							}
						},
						defaultType = 'op',
						counters = utilsService.parseCsvString( scope.counters );
					//TODO support other types of stat counters
					angular.forEach( counters, function ( cid ){
						var
							p = cid.split( ':' ),
							type = defaultType;
						if ( p.length > 1 && types[ p[0] ] ){
							type = p.shift();
							cid = p.join( ':' );
						}
						types[type].add( cid );
					} );

					function addOpenstatCounter( counterId ){
						$log.log( 'statCounters: insert Openstat counter id=', counterId );
						//Use part of openstat counter code as is
						$window.openstat = { counter : counterId, next : $window.openstat, track_links : "ext", nosync_f : true, nosync_p : true };
						(function( d, t, p ){
							var j = d.createElement( t );
							j.async = true;
							j.type = 'text/javascript';
							j.src = ('https:' == p ? 'https:' : 'http:') + '//openstat.net/cnt.js';
							var s = d.getElementsByTagName( t )[0];
							s.parentNode.insertBefore( j, s );
						})( document, 'script', document.location.protocol );
					}


					function addGoogleAnalyticsCounter( counterId ){
						$log.log( 'statCounters: insert Google Analytics counter id=', counterId );
						(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
							(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
							m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
						})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

						ga('create', counterId, 'auto');
						ga('send', 'pageview');
					}
				}
			}
		}] );