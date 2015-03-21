angular.module( 'plugin.panel' )
	.directive( 'panelSectionShare', [
		'$timeout',
		'pluginService',
		'configService',
		'socialService',
		'userPageService',
		'tasksQueueService',
		function( $timeout, pluginService, configService, socialService, userPageService, tasksQueueService ){
			return {
				templateUrl : pluginService.getTemplateUrl( '//panel/sections/share/panelSectionShare' ),
				replace     : true,
				scope       : true,
				link        : function( scope, element, attrs ){
					scope.networks = _.chain( configService.shareNetworks )
						.map( socialService.getNetwork )
						.compact()
						.value();

					scope.share = function( network ){
						socialService.share( {
							networkId : network.id,
							url       : userPageService.pageData.url,
							title     : userPageService.pageData.title
						} )
					};

					scope.friends = {
						bridge  : {},
						note    : '',
						loading : false
					};
					scope.shareWithFriends = function( selected, fullList ){
						if ( scope.friends.loading || ! selected.length ){
							return
						}
						scope.friends.loading = true;
						userPageService.sendToUsers( { to : selected, taskNote : scope.friends.note } ).then(function (){
							scope.friends.note = '';
							scope.friends.bridge.unSelectAll();
						} ).then(function (){
							scope.deactivateSection();
						})
							.finally(function (){
							scope.friends.loading = false;
						})
					};

					scope.onTextFieldSubmit = function (){
						scope.shareWithFriends( scope.friends.bridge.getSelected(), scope.friends.bridge.list );
					};

					scope.jumpToAddFriend = function(){
						scope.activateSection( 'settings', { tab : 'friends' } );
					};

					tasksQueueService.subscribe( 'section:share', function ( task ){
						if ( task.shareWithFriends ){
							scope.friends.note = task.shareWithFriends.note || '';
						}
					} );
				}
			}

		}] );