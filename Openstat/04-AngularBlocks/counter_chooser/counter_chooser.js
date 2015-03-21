;(function( angular ){
    if ( ! angular ){
	    return;
    }

	angular.module( 'osb.block.counter_chooser', [ 'osb', 'osb.ui' ] )
		.controller( 'ChooserCtrl', [ '$scope', '$window', '$timeout', '$filter', 'osbCountersCollection', 'osbActiveCounter', 'osbActiveReport', 'osbUtils', function ( $scope, $window, $timeout, $filter, osbCountersCollection, osbActiveCounter, osbActiveReport, osbUtils ){
			$scope.items = [];
			$scope.filteredItems = [];
			$scope.isMultiple = false;
			$scope.activeCounter = exposeItemData( osbActiveCounter.getData() );
			$scope.activeItem = {};
			$scope.selectedItem = {};
			$scope.isDropdownShown = false;
			$scope.lastPromise = false;
			$scope.onDropdownShow = function (){
				$scope.$apply( 'isDropdownShown = true' )
			}
			$scope.onDropdownHide = function (){
				$scope.$apply( 'isDropdownShown = false' )
			}
			$scope.isDropdownDisable = function (){
				return ! $scope.isMultiple;
			}
			$scope.navigateToReport = function ( item, $event ){

				$event.preventDefault();

				if ( item.isActive ){
					return false;
				}

				if ( $scope.lastPromise ) {
					$timeout.cancel( $scope.lastPromise );
				}

				
				var url = getReportUrl( item );

				url = osbActiveReport.transformReportExitUrl( url );

				$scope.activeItem.isActive = false;
				$scope.selectedItem.isActive = false;
				$scope.selectedItem.isLoading = false;
				
				item.isActive = true;

				if ( item.isCurrent ) {
					return false;
				}

				item.isLoading = true;

				$scope.selectedItem = item;

				$scope.lastPromise = $timeout(function (){
					$window.location = url;
				},800);
			}
			$scope.navigateToSettings = function ( item, $event ){
				$event.preventDefault();
				$event.stopPropagation();
				$window.location = '/' + osbUtils.getCounterSettingsUrl( item );
			}

			function getReportUrl( item ){
				return '/' + osbUtils.getCounterReportUrl(
					item,
					item._family == $scope.activeCounter._family
						? '_current'
						: 'summary'
				);
			}

			function exposeItemData( item ){
				if ( ! item.serverlog ){
					item._family = 'counters';
					item._familyTitle = osbUtils.l10n( 'Counters' );
					item._id = [ 'counter', item.id ].join( '_' );
				}
				else{
					item._family = 'domains';
					item._familyTitle = osbUtils.l10n( 'Domains' );
					item._id = [ 'domain', item.url ].join( '_' );
				}
				return item;
			}

			// Starting process by getting counters
			(function(){
			    var
				    counters = osbCountersCollection.getCounters(),
				    domains = osbCountersCollection.getDomains(),
				    items = [].concat( counters, domains );

				angular.forEach( items, function ( item ){

					exposeItemData( item );

					if ( item._id == $scope.activeCounter._id ){
						$scope.activeItem = item;
						item.isActive = true;
						item.isCurrent = true;
					}
					else{
						item.isActive = false;
						item.isCurrent = false;
					}
					item.reportUrl = getReportUrl( item );
					item.metaTitle = osbUtils.getCounterMetaTitle( item );
				});

				$scope.items = items;
				//Filtering
				$scope.filteredItems = items;
				$scope.$watch( 'search', function ( v ){
					$scope.filteredItems = $filter( 'counterSearch' )( $scope.items, v );
					if ( $scope.filteredItems[0] ){
						$scope.selectedItem = $scope.filteredItems[0];
					}
				});
				$scope.isMultiple = items.length > 1;
				$scope.isMultifamily = ( counters.length && domains.length );

			})();

		}] )
		.directive( 'filterField', [ '$timeout', function ( $timeout ) {
			return function ( scope, element, attrs ) {
				element
					.on( 'focus', function () {
						element
							.select()
							.on( 'keydown.filterField', function ( event ) {
								if ( 40 == event.keyCode ) {
									/* Down */
									setNext( 1 )
									process();
								}
								else if ( 38 == event.keyCode ) {
									/* Up */
									setNext( - 1 );
									process();
								}
								else if ( 13 == event.keyCode ) {
									/* Enter */
									scope.navigateToReport( scope.selectedItem, event );
								}
								function process() {
									event.preventDefault();
									if ( !scope.$$phase ) {
										scope.$apply();
									}
								}

								function setNext( direction ){
									var nextItem;
									angular.element.each( scope.filteredItems, function ( index, item ){
										if ( item._id == scope.selectedItem._id ){
											nextItem = scope.filteredItems[ index + direction ]
												? scope.filteredItems[ index + direction ]
												: scope.filteredItems[
												direction > 0
													? 0
													: scope.filteredItems.length - 1
												];
											return false;
										}
									} );

									if ( nextItem && angular.isDefined( nextItem._id ) ){
										scope.selectedItem = nextItem;
									}
								}

							} );
					} )
					.on( 'blur', function () {
						element.off( '.filterField' )
					} );
			}
		}] )
		.directive( 'autoscroll', [ '$timeout', function ( $timeout ){
			return function ( scope, element, attrs ){
				attrs.$observe( 'autoscroll', function (){
					var
						activeItem,
						position;
					$timeout(function (){
						if (
							element.is( ':visible' ) &&
							( activeItem = element.findOsb( 'item', 'active' ) ) &&
							activeItem.length
							){
							element.scrollTop(0);
							position = activeItem.position();
							element.scrollTop( position.top - 80 );
						};
					},50)
				} );
			}
		}])
		.filter( 'counterSearch', function ( ){
			return function ( items, searchValue ){
				if ( ! searchValue ){
					return items;
				}
				var filtered = [];
				angular.forEach( items, function ( item ){
					if (
						! item.isActive &&
						(
							( item.name && item.name.indexOf( searchValue ) != -1 ) ||
							( item.title && item.title.indexOf( searchValue ) != -1) ||
							( item.metaTitle && item.metaTitle.indexOf( searchValue ) != -1)
						)
						){
						filtered.push( item );
					}
				});
				return filtered;
			}
		})
})( window.angular );