angular.module( 'plugin.panel' )
	.directive( 'pageViewCounter', [
		'pluginService',
		'dispatchService',
		'utilsService',
		function( pluginService, dispatchService, utilsService ){
			return {
				templateUrl : pluginService.getTemplateUrl( '//panel/common/pageViewCounter' ),
				replace     : true,
				scope       : {
					counter : '=pageViewCounter'
				},
				link        : function( scope, element, attrs ){
					scope.getFormattedCounter = function (){
						var counter = getRealCounter();
						if ( ! counter ){
							return '';
						}
						return counter > 1000
							? Math.floor( counter / 1000 ) + 'K'
							: counter;
					};
					scope.getCounterLevel = function (){
						var counter = getRealCounter();
						if ( counter <= 0 ){
							return 0;
						}
						else if ( counter === 1 ){
							return 1;
						}
						else{
							return Math.ceil( Math.log( counter ) / Math.LN10 );
						}
					};

					scope.getCounterTitle = function (){
						var counter = getRealCounter();
						if ( ! counter ){
							return utilsService.l10n( 'page_counter_first_time' );
						}
						else{
							return utilsService.l10n( 'page_counter', [ counter ] );
						}
					};

					function getRealCounter(){
						return scope.counter - 1;
					}

				}
			}
		}] );