angular.module( 'plugin.panel' )
	.service( 'panelReopenTasksService', [
		'$rootScope',
		'userTaskService',
		function( $rootScope, userTaskService ){
			var panelReopenTasksService = {};

			panelReopenTasksService.reopenTasks = [];

			$rootScope.$watch( function(){
				//Hope length monitoring is enough
				return userTaskService.tasks.length
			}, function(){
				panelReopenTasksService.reopenTasks.length = [];
				angular.forEach( userTaskService.tasks, function( task ){
					if(
						task.data
							&& 'open' === task.data.act
							&& 'page' === task.data.obj
							&& + task.on !== 0
						){
						panelReopenTasksService.reopenTasks.push( task );
					}
				} );
			} );

			panelReopenTasksService.addTask = function( data, options ){
				data = _.defaults( data, {
					data    : {
						act : 'open',
						obj : 'page',
						src : {
							rel : 'self'
						}
					},
					'class' : [ userTaskService.TASK_CLASS_PAGE ]
				} );
				if ( data.note ){
					data.data.src.note = data.note;
					delete data.note;
				}
				options = _.defaults( options || {}, {
					closeCurrentTab : true
				} );
				return userTaskService.addTask( data, options );
			};

			panelReopenTasksService.updateTask = userTaskService.updateTask;
			panelReopenTasksService.removeTask = userTaskService.removeTask;


			return panelReopenTasksService;
		}] );