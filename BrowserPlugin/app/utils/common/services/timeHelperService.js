angular.module( 'plugin' )
	.service( 'timeHelperService', [
		'utilsService',
		function( utilsService ){
			var timeHelperService = {
				YEAR_IN_SECONDS   : 31557600,
				MONTH_IN_SECONDS  : 2629800,
				DAY_IN_SECONDS    : 86400,
				HOUR_IN_SECONDS   : 3600,
				MINUTE_IN_SECONDS : 60
			};

			timeHelperService.units = {
				year   : {
					title : utilsService.l10n( 'year_genitive' ),
					value : timeHelperService.YEAR_IN_SECONDS
				},
				month  : {
					title : utilsService.l10n( 'month_genitive' ),
					value : timeHelperService.MONTH_IN_SECONDS
				},
				day    : {
					title : utilsService.l10n( 'day_genitive' ),
					value : timeHelperService.DAY_IN_SECONDS
				},
				hour   : {
					title : utilsService.l10n( 'hour_genitive' ),
					value : timeHelperService.HOUR_IN_SECONDS
				},
				minute : {
					title : utilsService.l10n( 'minute_genitive' ),
					value : timeHelperService.MINUTE_IN_SECONDS
				}
			};

			timeHelperService.humanizeDurationShort = function( seconds, full ){
				var
					duration = moment.duration( seconds, 'seconds' ),
					units = [ 'years', 'months', 'days', 'hours', 'minutes', 'seconds'  ],
					selectedTitle = '',
					selectedUnit;

				_.find( units, function( unit ){
					var
						method = _.str.camelize( 'as-' + unit ),
						value = duration[method]();
					if( value >= 1 ){
						selectedTitle = utilsService.l10n( unit + '_short', [ Math.round( value ) ] );
						selectedUnit = unit;
						return true;
					}
				} );
				return full
					? {
					title : selectedTitle,
					unit  : selectedUnit
				}
					: selectedTitle;
			};
			return timeHelperService;
		}] );