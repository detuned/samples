angular.module( 'plugin' )
	.service( 'userTaskService', [
		'$log',
		'apiService',
		'dispatchService',
		'userPageService',
		function( $log, apiService, dispatchService, userPageService ){
			var
				userTaskService = {
					TASK_CLASS_PAGE : 'page'
				};

			userTaskService.tasks = userPageService.pageData.tasks;

			userTaskService.addTask = function( task, options ){
				return apiService.request( 'userTask::add', {
					task    : task,
					options : options
				} );
			};

			userTaskService.updateTask = function( task ){
				return apiService.request( 'userTask::update', { task : task } ).then( function( res ){
					addOrUpdateTask( task );
					return res;
				} )
			};

			userTaskService.removeTask = function( tid ){
				return apiService.request( 'userTask::remove', { tid : tid } ).then( function( res ){
					removeTaskFromList( tid );
					return res;
				} )
			};

			function addOrUpdateTask( task, list ){
				if( ! task || ! task.tid ){
					$log.warn( 'userTaskService: cannot add bad task', task );
					return; // XXX right?
				}
				var oldTask;
				list = list || userTaskService.tasks;
				oldTask = _.find( list, function( item ){
					return item.tid === task.tid;
				} );
				if( oldTask ){
					$log.log( 'userTaskService: task with the same tid', task.tid, 'was found and updated with', task );
					extendTask( oldTask, task );
				}
				else {
					$log.log( 'userTaskService: new task was prepended to list', task );
					list.push( task );
				}
			}

			function removeTaskFromList( tid, list ){
				if( ! tid ){
					$log.warn( 'userTaskService: cannot remove bad task tid=', tid );
					return; // XXX right?
				}
				var taskIndex;
				list = list || userTaskService.tasks;
				_.find( list, function( item, index ){
					if( item.tid == tid ){
						taskIndex = index;
						return true;
					}
				} );
				if( ! isNaN( taskIndex ) ){
					list.splice( taskIndex, 1 );
				}
			}

			function extendTask( task, newTask ){
				angular.forEach( [
					'tid',
					'start',
					'offset',
					'cycle',
					'class',
					'sig',
					'on',
					'data'
				], function( key ){
					if( key in newTask ){
						task[key] = newTask[key];
					}
				} );
			}

			dispatchService
				.listen( 'userTask::add', function( data ){
					if( data && data.task ){
						$log.log( 'userTaskService: got command to add task', data.task );
						addOrUpdateTask( data.task );
					}
					else {
						$log.warn( 'userTaskService: add fired with', data, 'but not applied' );
					}
				} )
				.listen( 'userTask::update', function( data ){
					if( data && data.task && data.task.tid ){
						$log.log( 'userTaskService: got command to update task', data.task.tid, 'with data', data.tid );
						addOrUpdateTask( data.task );
					}
					else {
						$log.warn( 'userTaskService: update fired with', data, 'but not applied' );
					}
				} )
				.listen( 'userTask::remove', function( data ){
					if( data && data.tid ){
						$log.log( 'userTaskService: got command to remove task', data.tid );
						removeTaskFromList( data.tid );
					}
					else {
						$log.warn( 'userTaskService: remove fired with', data, 'but not applied' );
					}
				} )
				.listen( 'userTask::done', function( data ){
					if( data && data.tid ){
						$log.debug( 'userTaskService: got signal that task done ', data.tid, 'remove is from list' );
						removeTaskFromList( data.tid );
					}
					else {
						$log.warn( 'userTaskService: task done data', data, 'has not applied' );
					}
				} );

			return userTaskService;
		}] );