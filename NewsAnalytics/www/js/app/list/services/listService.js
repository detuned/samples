angular.module( 'index' )
	.service( 'listService', [
		'$timeout',
		'$rootScope',
		'$q',
		'$http',
		'$window',
		'listApiService',
		'utilsService',
		'sourcesService',
		'periodsService',
		'themesService',
		'configService',
		'mailService',
		'previewService',
		function( $timeout, $rootScope, $q, $http, $window, listApiService, utilsService, sourcesService, periodsService, themesService, configService, mailService, previewService ){
			var
				isPaused = false,
				isFrozen = false,
				timeToUpdate = 15,
				listService = {};

			listService.pause = function(){
				if( isPaused ){
					return;
				}
				isPaused = true;
				$rootScope.$emit( 'pause' );
			};

			listService.play = function(){
				if( ! isPaused ){
					return;
				}
				isPaused = false;
				if( configService.resetPollingIntervalAfterPause ){
					listApiService.resetUpdateInterval()
				}
				$rootScope.$emit( 'play' );
			};

			listService.isPaused = function(){
				return isPaused;
			};

			listService.isFrozen = function(){
				return isFrozen;
			};

			listService.getTimeToUpdate = function(){
				return timeToUpdate;
			};

			listService.togglePause = function(){
				if ( isFrozen ){
					return;
				}
				if( isPaused ){
					listService.play();
				}
				else {
					listService.pause();
				}
			}

			listService.getShareUrl = function( entity ){
				return utilsService.fixUrlProtocol(
					utilsService.parseStringTemplate(
						configService.shareUrl, {
							id : encodeURIComponent( entity.id )
						}
					)
				);
			};

			listService.getShareTitle = function( entity ){
				return utilsService.parseStringTemplate( configService.shareTitle, {
					title : entity.title || ''
				} );
			};

			listService.mailShare = function( entity ){
				mailService.mailTo( {
					'subject' : utilsService.parseStringTemplate( configService.shareMailSubject, {
						title : listService.getShareTitle( entity ),
						url   : listService.getShareUrl( entity )
					} ),
					'body'    : utilsService.parseStringTemplate( configService.shareMailBody, {
						title : listService.getShareTitle( entity ),
						url   : listService.getShareUrl( entity )
					} )
				} );
			};

			listService.getNormalizedHost = function( entity ){
				var res = '';
				if( entity && entity.domain ){
					res = utilsService.normalizeUrl( entity.domain );
				}
				return res;
			};

			listService.getClickableHost = function( entity ){
				var res = '';
				if( entity && entity.domain ){
					res = utilsService.fixUrlProtocol( entity.domain );
				}
				return res;
			};

			listService.getCompactedHost = function( entity ){
				var res = '';
				if( entity && entity.domain ){
					res = utilsService.normalizeUrl( entity.domain ).replace( /^(.+)\.livejournal\.com$/i, "\$1" );
				}
				return res;
			};

			listService.getHostSignature = function( entity ){
				var
					prefix = 'list-entity__host_host',
					host = listService.getNormalizedHost( entity ),
					subHosts = [], parts;
				if( ! host ){
					return '';
				}
				parts = host.split( '.' );
				while( parts.length > 1 ){
					subHosts.push( [prefix].concat( parts ).join( '-' ) )
					parts.shift();
				}
				return subHosts.join( ' ' );
			};

			listService.getPreviewUrl = function( entity ){
				return previewService.getPreviewUrl( entity.id );
			};

			listService.registerEntityClick = function( entity ){
				var defer = $q.defer();
				$timeout( function(){
					//TODO add real tracking
					defer.resolve();
				} )
				return defer.promise;
			}

			listService.getEntityBadge = function( entity ){
				var
					threshold = entity.weight * configService.badgeThreshold,
					source, badge;

				_.find( entity.social, function( value, name ){
					if( value >= threshold && ( source = sourcesService.getSource( name ) ) ){
						badge = {
							type     : source.id,
							sourceId : source.id,
							title    : source.badge
						};
						return true;
					}
				} );

				return badge;
			};

			listService.getEntityActivityStat = function( id ){
				var defer = $q.defer();
				$http.get( configService.socialActivityUrl, { params : { url_id : id } } ).then( function( res ){
					defer.resolve( res.data );
				}, defer.reject );
				return defer.promise;
			};

			function ListEngine( data, options ){
				var
					receivedData,
					currentData,
					updatingTimer,
					destructors = [];
				_.defaults( data, {
					theme           : null,
					source          : null,
					period          : null,
					periodRangeFrom : null,
					periodRangeTo   : null,
					query           : null,
					domain          : null,
					title           : null,
					limit           : 10,
					page            : 0
				} );
				_.defaults( options, {
					onUpdate     : function(){},
					apiTransport : null
				} );

				if( options.apiTransport ){
					listApiService.setApiTransport( options.apiTransport );
				}


				listApiService.listen( prepareDataForExport(), onReceive );

				destructors.push( function(){
					listApiService.unListen( onReceive );
				} );

				function prepareDataForExport(){
					var
						res = {},
						setValue = function( key, obj ){
							if( obj ){
								res[key] = angular.isDefined( obj.value )
									? obj.value
									: obj.id;
							}
						};

					if( data.periodRangeFrom && data.periodRangeTo ){
						res[ 'from' ] = data.periodRangeFrom;
						res[ 'to' ] = data.periodRangeTo;
					}
					else {
						setValue( 'period', periodsService.getPeriod( data.period ) );
					}

					// Query
					if( data.title && ! _.isNull( data.title ) && data.title !== 'null' && data.title !== 'undefined' ){
						res.title = data.title;
					}
					if( data.domain && ! _.isNull( data.domain ) && data.domain !== 'null' && data.domain !== 'null' ){
						res.domain = utilsService.normalizeUrl( data.domain );
					}


					//Theme
					(function(){
						var categoriesArray = [];
						angular.forEach( data.theme || {}, function( v, themeId ){
							var theme = themesService.getTheme( themeId );
							if( theme && theme.id != themesService.THEME_ALL_ID ){
								categoriesArray.push(
									angular.isDefined( theme.value )
										? theme.value
										: theme.id
								)
							}
						} )
						res['category'] = categoriesArray;
					})();

					//Source
					(function(){
						var socialArray = [];
						angular.forEach( data.source || {}, function( v, sourceId ){
							var source = sourcesService.getSource( sourceId );
							if( source && source.id != sourcesService.SOURCE_ALL_ID ){
								socialArray.push(
									angular.isDefined( source.value )
										? source.value
										: source.id
								)
							}
						} )
						res['social'] = socialArray;
					})();


					res.limit = data.limit;
					res.offset = ( data.page - 1 ) * data.limit;
					//TODO add others

					return res;
				}

				function destroy(){
					angular.forEach( destructors, function( d ){
						d();
					} );
				}

				function onReceive( msg ){
					receivedData = angular.copy( msg );
					if( ! angular.isArray( msg.data ) ){
						msg.data = [];
					}
					receivedData.list = msg.data.slice( 0, data.limit );
					if( ! receivedData.total_count ){
						receivedData.total_count = 0;
					}
					delete receivedData.data;
					tick();
				}

				function tick(){
					if( updatingTimer ){
						return;
					}
					else {
						updatingTimer = null;
						if( receivedData && ( ! isPaused || ! currentData ) ){
							options.onUpdate( currentData = receivedData );
							receivedData = null;
							updatingTimer = $timeout( function(){
								updatingTimer = null;
								tick();
							}, + configService.minListUpdateInterval );
						}
					}
				}

				destructors.push(
					function(){
						if( updatingTimer ){
							$timeout.cancel( updatingTimer );
							updatingTimer = null;
						}
						receivedData = null;
					},
					$rootScope.$on( 'play', tick ),
					$rootScope.$on( 'pause', tick )
				);

				return {
					destroy : destroy
				};
			}

			(function(){
				var lastIsPaused;
				$rootScope.$on( 'apiUpdateBegin', function (){
					lastIsPaused = isPaused;
					listService.pause();
					isFrozen = true;
				} );
				$rootScope.$on( 'apiUpdateEnd', function (){
					if ( isPaused && ! lastIsPaused ){
						listService.play();
					}
					isFrozen = false;
				} );

			})();

			listService.getListEngine = ListEngine;

			return listService;
		}] );