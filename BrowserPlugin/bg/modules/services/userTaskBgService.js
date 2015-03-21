define( 'services/userTaskBgService', [
	'underscore',
	'jquery',
	'config',
	'log',
	'api/request'
], function( _, $, config, _log, request ){
	var
		log = _log.c( 'userTaskService' ),
		userTaskBgService = {};


	userTaskBgService.addTask = function( data ){
		var
			defer = $.Deferred(),
			task;
		if( ! data || ! data.task || ! data.url ){
			log.warn( 'cannot add wrong task ', data );
			defer.reject();
		}


		if( ! data.task['class'] ){
			log.warn( 'cannot add task of unknown class', data );
			defer.reject();
		}
		if( ! data.task['data'] ){
			log.warn( 'cannot add task with no data', data );
			defer.reject();
		}

		task = _.clone( data.task );

		task.data.url = data.url;

//		task.data = JSON.stringify( task.data );

		log.log( 'add task', data.task, ' for page ', data.url );
		request.send( 'userTask::add', task ).then(
			defer.resolve,
			defer.reject
		);

		return defer.promise();
	};


	userTaskBgService.removeTask = function( data ){
		var defer = $.Deferred();
		if( ! data || ! data.tid ){
			log.warn( 'cannot remove wrong task ', data );
			defer.reject();
		}

		log.log( 'remove task', data.tid );
		request.send( 'userTask::remove', {
			tid : data.tid
		} ).then( defer.resolve, defer.reject );

		return defer.promise();
	};


	return userTaskBgService;
} );