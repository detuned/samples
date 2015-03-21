services.factory( 'feedStatService', [ '$http', '$q', 'articleService', 'NEWST', function( $http, $q, articleService, NEWST ){

	function normalizeData( data ){
		var res = angular.extend( {}, data );
		if( ! res.sid ){
			res.sid = res.searchParams && res.searchParams.sid
				? res.searchParams.sid
				: [];
		}
		if( ! angular.isArray( res.sid ) ){
			res.sid = res.sid.split( ',' );
		}
		if( res.id ){
			if( _.indexOf( res.sid, res.id ) < 0 ){
				res.sid.push( res.id );
			}
			delete res.id;
		}

		if( res.searchParams ){
			if( res.searchParams.fields && ! angular.isArray( res.searchParams.fields ) ){
				res.searchParams.fields = res.searchParams.fields.split( ',' );
			}
		}

		return res;
	}

	var
		requestId = 0,
		service = {
			serializeRequest : function( data ){
				if( ! data || ! ( data.id || data.search ) ){
					return null;
				}
				var res = [];
				data = normalizeData( data );
				res.push( 'sid', data.sid.toString() );
				if( data.search ){
					res.push( 'query', data.query );
					if( data.searchParams ){
						if( data.searchParams.fields ){
							res.push( 'fields', data.searchParams.fields.toString() );
						}
						if( data.searchParams.match ){
							res.push( 'fields', data.searchParams.match.toString() );
						}
					}
				}
				return res.join( '__' );
			},
			getStat          : function( data ){
				var
					statId = this.serializeRequest( data ),
					reqParams = {},
					reqUrl = '/api/statistics',
					urlParams = [],
					reqId,
					deferred = $q.defer();
				if( ! statId ){
					deferred.reject();
					return deferred.promise;
				}
				reqId = ++ requestId;
				data = normalizeData( data );

				if( data.sid && data.sid.length ){
					angular.forEach( data.sid, function( sid ){
						urlParams.push( 'sid[]=' + sid );
					} );
				}
				if( data.query ){
					reqParams.query = data.query;
				}
				if( data.searchParams ){
					if( data.searchParams.match ){
						reqParams.match = data.match;
					}
					if( data.searchParams.fields && data.searchParams.fields.length ){
						angular.forEach( data.fields, function( field ){
							urlParams.push( 'fields[]=' + field );
						} );
					}
				}
				reqParams.date_start = (new Date).offsetDays( - 14 ).dateFormat( 'Y-m-d' );
				reqParams.date_end = (new Date).dateFormat( 'Y-m-d' );

				if( urlParams ){
					reqUrl += '?' + urlParams.join( '&' );
				}

				$http.get( reqUrl, { params : reqParams, cache : true } ).then( function( res ){
					if( reqId != requestId ){
						/* Request has expired */
						deferred.reject( { expired : true } );
					}
					var
						objects = {},
						hasObjects = false,
						chart = [],
						stat = {};
					if( angular.isArray( res.data.list ) ){
						/* Grouping objects by type */
						angular.forEach( res.data.list, function( obj ){
							if( ! obj.group ){
								/* Bad object format */
								return;
							}
							if( ! objects[ obj.group ] ){
								objects[ obj.group ] = {
									type  : obj.group,
									title : articleService.groupsNamesLocalized[ obj.group ] || obj.group,
									total : 0,
									list  : []
								};
							}
							objects[ obj.group ].list.push( obj );
							objects[ obj.group ].total += obj.count;
							hasObjects = true;
						} )
					}
					if( angular.isArray( res.data.published ) ){
						chart = res.data.published;
					}
					res.data.stat = {};
					if( hasObjects ){
						res.data.stat.objects = _.toArray( objects );
					}
					if( chart.length ){
						res.data.stat.chart = chart;
					}
					deferred.resolve( res.data.stat );
				}, function( res ){
					deferred.reject( res );
				} );

				return deferred.promise;
			}

		};

	return service;
}] );