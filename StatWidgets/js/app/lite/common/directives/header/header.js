angular.module( 'lite' )
	.directive( 'header', [
		'$timeout',
		'templateService',
		'dashboardService',
		function( $timeout, templateService, dashboardService ){
			return {
				templateUrl : templateService.getUrl( '//lite/common/header' ),
				replace     : true,
				link        : function( scope, element, attrs ){

					function init(){
//						if( scope.appData.user ){
//							element.find( '[role="counter-selector"]' ).replaceWith(
//								'<div class="osb-wx counter-selector" data-widget="counter_selector" data-counters="' + _.pluck( scope.appData.counters, 'id' ).join( ',' ) + '"></div>'
//							);
//							dashboardService.initWidgets();
//						}
					}

					$timeout( init );
				}
			}

		}] );