angular.module( 'index' )
	.directive( 'periodRevolver', [
		'$timeout',
		'configService',
		'periodsService',
		function( $timeout, configService, periodsService ){
			return {
				templateUrl : configService._getUrl( '//APP/common/directives/periodRevolver/periodRevolver.html' ),
				replace     : true,
				scope       : true,
				link        : function( scope, element, attrs ){
					var allPeriods = periodsService.getAllPeriods();
					scope.isRolling = false;
					scope.isNextActive = false;
					scope.nextPeriod = null;
					scope.roll = function (){
						if ( scope.isRolling ){
							return;
						}
						scope.isRolling = true;
						scope.nextPeriod = getNext();
						$timeout(function (){
							scope.isNextActive = true;
							$timeout(function (){
								scope.setPeriod( scope.nextPeriod.id );
								scope.isNextActive = false;
								scope.isRolling = false;
								scope.nextPeriod = null;
							}, 500 );
						});
					};

					function getNext(){
						var
							index = 0,
							res;
						_.find( allPeriods, function ( item, i ){
							if ( item.id == scope.period.id ){
								index = i;
								return true;
							}
						});

						return ( res = allPeriods[ ++ index ] )
							? res
							: allPeriods[0];
					}
				}
			}

		}] );