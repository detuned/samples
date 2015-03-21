angular.module( 'plugin.panel' )
	.directive( 'panelSectionReopen', [
		'$q',
		'$log',
		'$timeout',
		'pluginService',
		'configService',
		'panelReopenTasksService',
		'utilsService',
		'timeHelperService',
		function( $q, $log, $timeout, pluginService, configService, panelReopenTasksService, utilsService, timeHelperService ){
			return {
				templateUrl : pluginService.getTemplateUrl( '//panel/sections/reopen/panelSectionReopen' ),
				replace     : true,
				scope       : true,
				link        : function( scope, element, attrs ){
					var
						destructors = utilsService.elementDestructor( element );
					scope.state = {
						custom : false
					};
					scope.reopenTasks = panelReopenTasksService.reopenTasks;
					scope.presetsNote = '';
					(function(){
						var
							curUnit,
							unitIndex = 0;
						scope.reopenPresets = _.map( configService.reopenPresets || [], function( time ){
							var
								duration = timeHelperService.humanizeDurationShort( time, true ),
								res;
							if( curUnit && duration.unit !== curUnit ){
								unitIndex = 0;
							}
							res = _.extend( {
								time : Number( time )
							}, duration, {
								unitIndex : unitIndex
							} );
							curUnit = duration.unit;
							unitIndex ++;
							return res;
						} );

					})();

					scope.switchCustomMode = function( isCustom ){
						scope.state.custom = arguments.length
							? ! ! isCustom
							: ! scope.state.custom;
					};

					scope.custom = {};

					reset();

					scope.customUnits = scope.repeatUnits = [
						timeHelperService.units.minute,
						timeHelperService.units.hour,
						timeHelperService.units.day,
						timeHelperService.units.month
					];


					scope.customSubmit = function(){
						var
							task = {
								offset : scope.custom.timeValue * scope.custom.timeUnit,
								note   : scope.custom.note
							};
						if( ! ( task.offset > 0 ) ){
							$log.warn( 'panelSectionReopen: bad offset value', task.offset );
							//TODO handle error
							return;
						}
						if( scope.custom.repeat ){
							task.cycle = scope.custom.repeatEach * scope.custom.repeatUnit;
							if( ! ( task.cycle > 0 ) ){
								$log.warn( 'panelSectionReopen: bad cycle value', task.cycle );
								//TODO handle error
								return;
							}
						}
						return panelReopenTasksService.addTask( task ).then( reset );
					};

					scope.activatePreset = function( preset ){
						return panelReopenTasksService.addTask( {
							offset : preset.time,
							note   : scope.presetsNote

						} );
					};

					function reset(){
						scope.state.custom = false;
						scope.custom = {
							timeValue  : 1,
							timeUnit   : timeHelperService.MINUTE_IN_SECONDS,
							repeat     : false,
							repeatEach : 1,
							repeatUnit : timeHelperService.MINUTE_IN_SECONDS
						};
					}

					//Start
					scope.$on( 'sectionActivated_reopen', fieldFocus );

					if( 'reopen' === scope.activeSection.name ){
						fieldFocus();
					}

					function fieldFocus(){
						$timeout( function(){
							element.find( 'textarea:visible:first' ).focus();
						}, 200 )
					}

				}
			}

		}] );