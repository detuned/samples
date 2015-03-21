angular.module( 'plugin' )
	.service( 'userPageService', [
		'$q',
		'$log',
		'apiService',
		'eventsFabricService',
		'dispatchService',
		'utilsService',
		function( $q, $log, apiService, eventsFabricService, dispatchService, utilsService ){
			var
				userPageService = {},
				/**
				 * Main storage of pageData for all app
				 * No one could override or extend it
				 * It's only possible to update it one be one param
				 */
					pageData = {
					tags         : [],
					notes        : [],
					privateNotes : [],
					publicNotes  : [],
					tasks        : []
				},
				events = eventsFabricService.getInstance(),
				triggerDataUpdate = events.trigger( 'pageDataUpdate', function(){
					return pageData;
				} ),
				triggerPubNotesViewUpdate = function ( data ){
					events.trigger( 'pubNotesView' )( _.extend( { lastPubNotesView : pageData.lastPubNotesView }, data || {} ) );
				},
				extendFieldsHandlers = {};

			userPageService.pageData = pageData;

			userPageService.getPageData = function(){
				return apiService.request( 'userPage::getData', { url : location.href } ).then( function( data ){
					if ( angular.isArray( data.notes ) ){
						//Server returns notes sorted ascending but we should display them descending
						//(last is in top)
						data.notes = data.notes.reverse();
					}
					extendPageData( data || {} );
					$log.info( 'userPageService: load actual page data', data );
					return data;
				} )
			};

			userPageService.getPageUrl = function(){
				return userPageService.pageData.url; //?
			};

			userPageService.listenDataUpdate = events.on( 'pageDataUpdate' );
			userPageService.unListenDataUpdate = events.off( 'pageDataUpdate' );
			userPageService.listenPubNotesView = events.on( 'pubNotesView' );
			userPageService.unListenPubNotesView = events.off( 'pubNotesView' );

			/**
			 * Sends to number or friends
			 */
			userPageService.sendToUsers = function ( options ){
				return apiService.request( 'userPage::send', options );
			};


			dispatchService
				.listen( 'userPage::update', function ( data ){
					resetPageData();
					updatePageData( data );
				} )
				.listen( 'userPage::reset', function(){
					resetPageData();
					triggerDataUpdate();
					triggerPubNotesViewUpdate();
				} )
				.listen( 'auth::reset', function(){
					resetPageData();
					userPageService.getPageData().then(function (){
//						triggerDataUpdate();
						triggerPubNotesViewUpdate( { force : true } );
					})
				} )
				.listen( 'userPage::pubNotesView', function( data ){
					if ( data.utime && ( ! pageData.lastPubNotesView || data.utime > pageData.lastPubNotesView ) ){
						pageData.lastPubNotesView = + data.utime;
						triggerPubNotesViewUpdate();
					}
				} );


			function updatePageData( data ){
				$log.log( 'userPageService: page data updated with', data );
				if( ! data || _.isNull( data ) ){
					resetPageData();
				}
				else {
					extendPageData( data );
				}
				triggerDataUpdate();
				triggerPubNotesViewUpdate();
			}


			extendFieldsHandlers.notes = function( newValue ){
				utilsService.updateArray( pageData.notes, newValue );
				pageData.privateNotes.length = 0;
				pageData.publicNotes.length = 0;
				angular.forEach( newValue, function ( item ){
					item.isOwn = true;
					if ( + item.pub === 0 ){
						pageData.privateNotes.push( item );
					}
					else{
						pageData.publicNotes.push( item );
					}
				});
				$log.log( 'set new notes. private:', pageData.privateNotes, ' public:', pageData.publicNotes );
			};

			function extendPageData( data ){
				angular.forEach( data, function( value, key ){
					if( extendFieldsHandlers[key] ){
						extendFieldsHandlers[key]( value );
					}
					else if( angular.isArray( pageData[key] ) ){
						utilsService.updateArray( pageData[key], value || [] );
					}
					else if( angular.isObject( pageData[key] ) ){
						angular.extend( pageData[key], value || {} );
					}
					else {
						pageData[key] = value;
					}
				} );
			}

			function resetPageData(){
				angular.forEach( pageData, function( value, key ){
					if( extendFieldsHandlers[key] ){
						extendFieldsHandlers[key]( value );
					}
					else if( angular.isArray( value ) ){
						utilsService.updateArray( pageData[key], [] );
					}
					else if( angular.isObject( value ) ){
						utilsService.clearObject( pageData[key] );
					}
					else {
						delete pageData[key];
					}
					$log.log( 'userPageService: reset page data', pageData );

				} );
			}

			return userPageService;
		}] );