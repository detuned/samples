angular.module( 'plugin.panel' )
	.directive( 'pnReopenTask', [
		'$timeout',
		'pluginService',
		'panelReopenTasksService',
		'utilsService',
		function( $timeout, pluginService, panelReopenTasksService, utilsService ){
			return {
				templateUrl : pluginService.getTemplateUrl( '//panel/sections/reopen/pnReopenTask' ),
				replace     : true,
				scope       : {
					task : '=pnReopenTask'
				},
				link        : function( scope, element, attrs ){
					var
						destructors = utilsService.elementDestructor( element ),
						updateSummaryTimer;
					scope.state = {
						edit    : false,
						loading : false
					};

					scope.summaryStart = '';

					function updateSummary(){
						if ( ! scope.task || ( ! scope.task.start && ! scope.task.offset ) ){
							return;
						}
						if ( ! scope.task.start && scope.task.offset ){
							scope.task.start = moment().add( scope.task.offset, 'seconds' ).unix();
						}
						scope.task.passed = scope.task.start < moment().unix();
						scope.summaryStart = utilsService.l10n(
							scope.task.passed
								? 'reopen_page_was'
								: 'reopen_page_will',
							moment.unix( scope.task.start ).fromNow() );
						scope.summaryRepeat = scope.task.cycle > 0
							? utilsService.l10n( 'reopen_repeat_every', moment.duration( scope.task.cycle, 'seconds' ).humanize() )
							: '';

						if ( updateSummaryTimer ){
							$timeout.cancel( updateSummaryTimer );
							updateSummaryTimer = $timeout( updateSummary, 5000 );
						}
					}

					updateSummary();

					destructors.push(
						scope.$watch( 'task.start', updateSummary ),
						function (){
							if ( updateSummaryTimer ){
								$timeout.cancel( updateSummaryTimer );
							}
						}
					);


					scope.switchEditMode = function( isEdit ){
						var
							newIsEditMode = arguments.length
								? ! ! isEdit
								: ! scope.state.edit;

						if( newIsEditMode ){
							onSetEdit();
						}
						scope.state.edit = newIsEditMode;
					};

					scope.onSubmit = function(){
						scope.state.loading = true;
						panelReopenTasksService.updateTask( scope.editTask ).then( function(){
							scope.switchEditMode( false );
						} )
							['finally']( function(){
							scope.state.loading = false;
						} );
					};

					scope.deleteTask = function(){
						scope.state.loading = true;
						panelReopenTasksService.removeTask( scope.task.tid )
							['finally']( function(){
							scope.state.loading = false;
						} );

					};


					function onSetEdit(){
						scope.editTask = _.clone( scope.task );
						//TODO focus first field
					}
				}
			}

		}] );