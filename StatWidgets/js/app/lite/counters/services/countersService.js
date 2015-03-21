angular.module( 'lite' )
	.service( 'countersService', [
		'utilsService',
		function( utilsService ){
			var countersService = {};

			countersService.getCounterTitle = function( counter ){
				return counter.title || ( 'Счётчик ' + counter.id );
			};

			countersService.getCounterSubTitle = function( counter ){
				if( ! counter._subtitle ){
					if ( counter.url ){
						counter._subtitle = utilsService.getClearUrl( counter.url );
					}
					else{
						counter._subtitle = counter.metaTitle || counter.title;
					}
				}
				return counter._subtitle;
			};

			return countersService;
		}] );