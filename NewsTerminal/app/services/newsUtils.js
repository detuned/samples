services.factory( 'newsUtils', [ '$document', '$q', '$http', '$timeout', 'NEWST', function( $document, $q, $http, $timeout, NEWST ){
	var utils = {
		isArticleUrgent : function( article ){
			var priority;
			var res = (
				article
					&& article.priority !== null
					&& ! isNaN( priority = Number( article.priority ) )
					&& (
					priority === NEWST.PRIORITY_URGENT
						|| priority == NEWST.PRIORITY_MOSTURGENT
					)
				);
			return res;
		},
		reachServer     : function(){
			var
				deferred = $q.defer(),
				ticker,
				interval = 1000,
				intervalIncreaseFactor = 2,
				maxInterval = 16000,
				startTime = ( new Date ).getTime();

			function tick(){
				ticker && $timeout.cancel( ticker );
				console.log( 'trying to reach server after ' + ( ( new Date ).getTime() - startTime ) + 'ms' );
				$http.get( '/api/settings' ).then( function(){
					var time = ( new Date ).getTime() - startTime;
					/* Server successfully reached, stop ticking */
					console.log( 'successfully reached server for ' + time + 'ms' );
					deferred.resolve( { time : time } );
				}, function(){
					ticker = $timeout( tick, interval = Math.min( maxInterval, interval * intervalIncreaseFactor ) );
				} );
			}

			tick();
			$document.on( 'jsResurrection', function(){
				/*
				 * We has not reached server yet, but device fell asleep and woke up again
				 * So stop ticking and wait until reachServer will start from outside once more
				 */
				ticker && $timeout.cancel( ticker );
			} )

			return deferred.promise;
		},
		parseMediaList  : function( list ){
			var
				parsedMedia = {
					list    : [],
					archive : null
				},
				mediaVariant,
				listByType = {},
				mediaTypesMap = {
					Photo    : 'photo',
					Graphics : 'photo',
					VideoFLV : 'video',
//			        VideoWMV : 'video',
					Flash    : 'flash'
				},
				mediaPreviewsMap = {
					Photo    : 'Preview',
					Graphics : 'PreviewGraphics',
					VideoFLV : 'PreviewVideo',
//			        VideoWMV : 'video',
					Flash    : 'PreviewFlash'
				};
			if( ! list || ! list[0] || ! ( mediaVariant = list[0].media_variant ) ){
				return parsedMedia;
			}
			angular.forEach( mediaVariant, function( item ){
				listByType[item.type] = item;
			} );

			angular.forEach( mediaVariant, function( item ){
				var
					mediaItem;
				if( ! item.type ){
					return;
				}

				mediaItem = angular.extend( {}, item );

				if( mediaItem.type in mediaTypesMap ){
					mediaItem.mediaType = mediaTypesMap[mediaItem.type];
//					mediaItem.desc = ''; //TODO
					mediaItem.preview = mediaPreviewsMap[mediaItem.type] && ( mediaPreviewsMap[mediaItem.type] in listByType )
						? angular.extend( {}, listByType[mediaPreviewsMap[mediaItem.type]] )
						: null;
					parsedMedia.list.push( mediaItem );
				}
				else if( mediaItem.type == 'Archive' ){
					parsedMedia.archive = angular.extend( {}, mediaItem );
				}

			} );
			return parsedMedia;
		}
	};
	return utils;
}] );