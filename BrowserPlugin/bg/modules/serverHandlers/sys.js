define( 'serverHandlers/sys', [
	'underscore',
	'jquery',
	'config',
	'log',
	'utils',
	'api/tasks',
	'api/messages',
	'api/request',

	'services/userTagsBgService',
	'services/sessionBgService',
	'services/userPageBgService',
	'services/relationsBgService'
], function( _, $, config, log, utils, tasks, messages, request, userTagsBgService, sessionBgService, userPageBgService, relationsBgService ){
	var
		sys = {},
		log = log.c( 'sys' );

	sys.done = function( params ){
		log.debug( 'done fired with', params );

		//A task was received so we need to send 'done' response to server
		if( params.mid ){
			messages.done( params.mid, _.omit( params, 'mid' ) );
		}

	};

	sys.tagsReset = function( params ){
		if( params.tags ){
			userTagsBgService.resetTags( params.tags );
		}
		return utils.getResolvedPromise();
	};

	sys.termReset = function( params ){
		var
			defer = $.Deferred(),
			save = function(){
				$.when(
						sessionBgService.setTermId( params.termId ),
						sessionBgService.setTermKey( params.termKey )
					)
				.always( defer.resolve );
			};
		if( params.termId ){
			//Before set new termId, apply previous one
			sessionBgService.getTermData().then( function( termData ){
				request.send( 'userTerm::cacheResend', termData );
				save();
			}, save );
		}
		else {
			defer.resolve();
		}
		return defer.promise();
	};

	sys.warningShow = function( params ){
		userPageBgService.broadcastAllTabs( 'sys::warningShow', params );
		return utils.getResolvedPromise();
	};

	sys.warningHide = function( params ){
		userPageBgService.broadcastAllTabs( 'sys::warningHide', params );
		return utils.getResolvedPromise();
	};

	sys.relReset = function( params ){
		relationsBgService.resetRelations( params.rels );
		return utils.getResolvedPromise();
	};

	return sys;
} );