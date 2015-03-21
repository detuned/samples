define( 'services/sectionsBgService', [
	'underscore',
	'jquery',
	'config',
	'log',
	'api/request',
	'services/userPageBgService',
	'utils/eventsFabric',
	'services/userInfoBgService'
], function( _, $, config, _log, request, userPageBgService, eventsFabric, userInfoBgService ){
	var
		log = _log.c( 'sections' ),
		events = eventsFabric.getInstance( { name : 'sessionsService' } ),
		aliases = {},
		disabled = {},
		sectionsBgService = {};

	sectionsBgService.getDisabled = function(){
		return disabled;
	};

	sectionsBgService.setDisabled = function( disabledIds ){
		var
			newDisabled = {},
			diffEnabled = [],
			diffDisabled = [];

		_.map( disabledIds, function( id ){
			id = aliases[id] || id;
			newDisabled[id] = true;
			if( ! disabled[id] ){
				diffDisabled.push( id );
			}
		} );
		diffEnabled = _.difference( _.keys( disabled ), _.keys( newDisabled ) );
		disabled = newDisabled;

		if( diffEnabled.length ){
			log.log( 'enabled sections', diffEnabled );
		}
		if( diffDisabled.length ){
			log.log( 'disabled sections', diffDisabled );
		}

		_.map( diffEnabled, function( id ){
			userPageBgService.broadcastAllTabs( 'sectionToggle::' + id, { disable : false }, {
				activeOnly : true,
				preserve   : true
			} );
			events.trigger( 'sectionEnable_' + id )();
			events.trigger( 'sectionEnable', { sectionId : id } )();
		} );
		_.map( diffDisabled, function( id ){
			userPageBgService.broadcastAllTabs( 'sectionToggle::' + id, { disable : true }, {
				activeOnly : true,
				preserve   : true
			} );
			events.trigger( 'sectionDisable_' + id )();
			events.trigger( 'sectionDisable', { sectionId : id } )();
		} );

	};

	userInfoBgService.on( 'userInfoUpdated', function ( event, info ){
		var
			disabled = [],
			m;
		_.each( info, function ( value, id ){
			if( + value && ( m = id.match( /^noTab(.+)$/ ) ) ){
				disabled.push( m[1].toLowerCase() );
			}
		});
		sectionsBgService.setDisabled( disabled );
	} );

	sectionsBgService.isSectionDisabled = function ( id ){
		return disabled[id];
	};

	sectionsBgService.on = events.on();
	sectionsBgService.off = events.off();

	return sectionsBgService;
} );