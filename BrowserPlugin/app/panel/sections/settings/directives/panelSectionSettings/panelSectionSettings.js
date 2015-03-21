angular.module( 'plugin.panel' )
	.directive( 'panelSectionSettings', [
		'$timeout',
		'configService',
		'pluginService',
		'userService',
		'utilsService',
		'tasksQueueService',
		'panelSectionsService',
		'relationsService',
		function( $timeout, configService, pluginService, userService, utilsService, tasksQueueService, panelSectionsService, relationsService ){
			return {
				templateUrl : pluginService.getTemplateUrl( '//panel/sections/settings/panelSectionSettings' ),
				replace     : true,
				scope       : true,
				link        : function( scope, element, attrs ){
					var
						fieldElement = element.find( '[role=tokenField]' ),
						prefFlags = [
							{
								id    : 'noMailPubNotes',
								title : utilsService.l10n( 'no_mail_discussion' )
							}
						],
						currentToken;
					scope.state = {
						infoLoading : false,
						prefLoading : false,
						tab         : 'friends'
					};
					scope.token = {
						value : '',
						error : ''
					};
					scope.info = {};
					scope.infoErrors = {
						name  : '',
						email : '',
						tel   : ''
					};

					//TODO move to service or to helper or to something else
					scope.langs = [
						{
							id    : 'en',
							title : 'English'
						},
						{
							id    : 'ru',
							title : 'Русский'
						}
					];

					scope.prefFlags = prefFlags;

					userService.getToken().then( function( v ){
						scope.token.value = currentToken = v;
					} );

					scope.setToken = function(){
						if( ! scope.token.value ){
							scope.token.error = utilsService.l10n( 'token_empty' );
							return;
						}
						userService.setToken( scope.token.value ).then( function(){
							scope.deactivateSection();
							currentToken = scope.token.value;
						}, function(){
							scope.token.error = utilsService.l10n( 'token_incorrect' );
						} );
					};

					scope.switchTab = function( tabName ){
						if( scope.state.tab != tabName ){
							scope.state.tab = tabName;
							//XXX useful to add specific handlers
						}
					};

					tasksQueueService.subscribe( 'section:settings', function( task ){
						if( task.tab ){
							scope.state.tab = task.tab;
						}
					} );

					scope.onPrefChange = function(){
						if( scope.prefTmp.noTabSearch === true ){
							//We think that Tags section has no sense without Search tags
							//so we synchronize them together
							scope.prefTmp.noTabTags = true;
						}
					};

					scope.state.infoLoading = true;
					scope.state.prefLoading = true;
					scope.info = userService.info;
					scope.isGrantedToSetRelations = relationsService.isGrantedToSetRelations;
					setInfoTmp();
					setPrefTmp();
					setPersonal();

					userService.getInfo()
						.finally( function(){
							scope.state.infoLoading = false;
							scope.state.prefLoading = false;
						} );

					scope.submitInfo = function(){
						scope.state.infoLoading = true;
						userService.setInfo( scope.infoTmp ).then(function(){
							scope.infoSuccessLabel = utilsService.l10n( 'saved' );
							$timeout( function(){
								scope.infoSuccessLabel = '';
							}, 3000 );
						} ).finally( function(){
								scope.state.infoLoading = false
							} );
					};

					scope.submitPref = function(){
						scope.state.prefLoading = true;
						userService.setInfo( scope.prefTmp ).then(function(){
							scope.prefSuccessLabel = utilsService.l10n( 'saved' );
							$timeout( function(){
								scope.prefSuccessLabel = '';
							}, 3000 );
						} ).finally( function(){
								scope.state.prefLoading = false
							} );
					};

					scope.isHighlightEmpty = function( name ){
						return ! scope.infoTmp[name];
					};

					userService.on( 'updateInfo', function(){
						setInfoTmp();
						setPrefTmp();
						setPersonal();
					} );

					function setInfoTmp(){
						scope.infoTmp = _.clone( userService.info );
					}

					function setPersonal(){
						scope.uid = userService.uid;
						scope.avatar = utilsService.urlTemplate( configService.avatarUrl, { uid : userService.uid } ) + '?r=' + _.random( 0, 1000 );
					}

					function setPrefTmp(){
						var pref = {};
						_.each( prefFlags, function( item ){
							pref[ item.id ] = ! ! userService.info[ item.id ];
						} );
						pref.lang = userService.info.lang || pluginService.lang;
						if( pref.lang != 'ru' ){
							pref.lang = 'en';
						}
						scope.prefTmp = pref;
						scope.onPrefChange();
					}

					function resetTokenForm(){
						scope.token.value = currentToken || '';
						scope.token.error = '';
					}

					//Start
					(function(){
						var activationNum = 0;
						scope.$on( 'sectionActivated_settings', handleActivation );

						if( 'settings' === scope.activeSection.name ){
							handleActivation();
						}

						function handleActivation(){
							if( panelSectionsService.Section( 'settings' ).getUpdates() ){
								scope.state.tab = 'friends';
							}
							else if( panelSectionsService.Section( 'settings' ).isWarned() ){
								scope.state.tab = 'personal';
							}
							activationNum ++;
							fieldFocus();
						}

						function fieldFocus(){
							$timeout( function(){
								resetTokenForm();
								element.find( 'input:visible:first' ).select();
							}, 200 )
						}
					})();

					scope.socialProviders = [
						userService.socialProviders.fb,
						userService.socialProviders.vk,
						userService.socialProviders.google
					];
					scope.socialAuth = function( provider ){
						if( provider.auth ){
							return;
						}
						userService.socialAuth( provider.id );
					};


				}
			}

		}] );