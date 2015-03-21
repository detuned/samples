angular.module( 'utils' )
	.service( 'tasksQueueService', [function(){
		var
			tasksQueueService = {},
			queues = {};

		tasksQueueService.subscribe = function( queueId, subscriber ){
			getQueue( queueId ).subscriber = subscriber;
			flushQueue( queueId );
		};

		tasksQueueService.pushTask = function( queueId, task ){
			getQueue( queueId ).tasks.push( task );
			flushQueue( queueId );
		};

		function flushQueue( queueId ){
			var queue = getQueue( queueId );
			if( queue.tasks.length && queue.subscriber ){
				while( queue.tasks.length ){
					queue.subscriber( queue.tasks.shift() );
				}
			}
		}

		function getQueue( queueId ){
			if( ! queues[ queueId ] ){
				queues[ queueId ] = {
					subscriber : null,
					tasks      : []
				};
			}
			return queues[ queueId ];
		}

		return tasksQueueService;
	}] );