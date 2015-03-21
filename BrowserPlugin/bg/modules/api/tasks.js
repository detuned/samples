define( 'api/tasks', [
	'underscore',
	'jquery',
	'config',
	'log',
	'api',
	'utils',
	'api/task',
	'services/userPageBgService'
], function( _, $, config, _log, api, utils, task, userPageBgService ){
	var
		tasks = {},
		tasksRegistry = {},
		tasksDoneRegistry = {},
		log = _log.c( 'tasks' ),
		timers = utils.timersManager();

	tasks.done = function( tid ){
		log.log( 'mark task tid=', tid, 'as done' );
		getTask( tid ).done();
	};

	tasks.dispatch = function( tid, actionMethod, taskData ){
		if ( tasksDoneRegistry[tid] ){
			getTask( tid ).done();
			tasksDoneRegistry[tid] = (new Date).getTime();
		}
		return getTask( tid, taskData ).act( function(){
			return actionMethod( {}, [ 'tid' ] );
		} );
	};

	tasks.getActiveTasks = function (){
		return tasksRegistry;
	};
	tasks.getActiveTasksNum = function (){
		return _.keys( tasksRegistry ).length;
	};
	tasks.getDoneTasks = function (){
		return tasksDoneRegistry;
	};
	tasks.getDoneTasksNum = function (){
		return _.keys( tasksDoneRegistry ).length;
	};

	tasks.removeGarbage = removeGarbage;

	function getTask( tid, taskData ){
		var options;
		if( ! tasksRegistry[ tid ] ){
			options = {
				onDone : function (){
					if( taskData && taskData.obj && taskData.obj === 'page' ){
						broadcastTaskDoneToAllTabs( tid )
					}
					tasksRegistry[ tid ].destroy();
					delete tasksRegistry[ tid ];
					tasksDoneRegistry[tid] = ( new Date ).getTime();
				}
			};
			tasksRegistry[ tid ] = task( tid, options );
		}
		return tasksRegistry[ tid ];
	}


	function broadcastTaskDoneToAllTabs( tid ){
		userPageBgService.broadcastAllTabs( 'userTask::done', { tid : tid } );
	}


	function sendMethod( str, data ){
		api.send( utils.decodeAction( str, data ) );
	}

	function removeGarbage(){
		var
			limit = (new Date).getTime() - config.taskTtl,
			totalNum = 0,
			deletedNum = 0;
		log.log( 'removing expired tasks, time limit is', limit );
		_.each( tasksDoneRegistry, function ( time, tid ){
			totalNum ++;
			if ( time < limit ){
				delete( tasksDoneRegistry[tid] );
				deletedNum ++;
			}
		} );
		log.log( totalNum, 'task(s) was analyzed and', deletedNum, 'expired task(s) was deleted' );
		
		timers.setTimer( 'garbage', removeGarbage, config.taskRemoveGarbageInterval );
	}

	timers.setTimer( 'garbage', removeGarbage, config.taskRemoveGarbageInterval );

	return tasks;
} );