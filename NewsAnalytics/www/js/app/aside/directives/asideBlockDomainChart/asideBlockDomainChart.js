angular.module( 'index' )
	.directive( 'asideBlockDomainChart', [
		'configService',
		'domainStatService',
		'periodsService',
		function( configService, domainStatService, periodsService ){
			return {
				templateUrl : configService._getUrl( '//APP/aside/directives/asideBlockDomainChart/asideBlockDomainChart.html' ),
				replace     : true,
				scope       : true,
				link        : function( scope, element, attrs ){
					scope.blockData = _.extend( {}, attrs.asideBlockData ? scope.$eval( attrs.asideBlockData ) : {} );

					scope.chart = [];
					domainStatService.loadChart().then(function ( res ){
						scope.chart = res;
					});

					scope.getDomainHref = function ( item ){
						return '/#/?query=' + item.normalizedHost + (
							scope.period && scope.period.alias && scope.period.alias !== periodsService.PERIOD_NOW_ALIAS
								? '&period=' + scope.period.alias
								: ''
							);
					}
				}
			}

		}] );