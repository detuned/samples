(function () {
	angular.module( 'osb.block.nano_histogram', [ 'osb' ] )
		.directive( 'osbBlockNanoHistogram', [ function () {
			return {
				scope : {
					data : '=osbBlockNanoHistogram'
				},
				replace : true,
				template : '<div data-osb-block="nano_histogram" data-osb><ul data-osb="list"><li data-osb="item" data-ng-repeat="height in heights"><span data-osb="bar" data-ng-style="{ height : height }"></span></li></ul></div>',
				controller : [ '$scope', '$element', '$attrs', '$timeout', function ( $scope, $element, $attrs, $timeout ){
					var renderTimer;

					$scope.heights = [];

					function actualizeStat(){
						var
							max = 0,
							minHeight = '1px',
							heights = [];
						if ( $scope.data && $scope.data.stat && $scope.data.stat.length ){
							angular.forEach( $scope.data.stat, function ( item ){
								max = Math.max( max, item );
							});
							if ( max === $scope.max ){
								return;
							}
							if ( renderTimer ){
								$timeout.cancel( renderTimer );
							}
							$scope.max = max;
							angular.forEach( $scope.data.stat, function ( item ){
								var height;
								if ( item == 0 || ! max ){
									height = minHeight;
								}
								else{
									height = ( item / max ) * 100 + '%';
								}
								heights.push( height )
							});
							$scope.heights = heights;
						}
					}

					$scope.$watch( 'data.stat', actualizeStat )
				}]
			}
		} ] );
})();