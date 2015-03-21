angular.module( 'lite' )
	.directive( 'authForm', [
		'$timeout',
		'templateService',
		'accountService',
		function( $timeout, templateService, accountService ){
			return {
				scope       : true,
				templateUrl : templateService.getUrl( '//lite/account/authForm' ),
				replace     : true,
				link        : function( scope, element, attrs ){
					scope.state = {
						loading  : false,
						accepted : false,
						error    : false
					};
					scope.data = {
						login    : '',
						password : ''
					};
					scope.submit = function(){
						var hasErrors = false;
						fixModels();
						if( ! scope.data.login ){
							scope.authForm.login.$setValidity( false );
							hasErrors = true;
						}
						if( ! scope.data.password ){
							scope.authForm.password.$setValidity( false );
							hasErrors = true;
						}
						if( hasErrors ){
							scope.state.accepted = true;
							return;
						}

						scope.state.loading = true;
						scope.state.error = false;
						accountService.auth( scope.data ).then( function(){

						}, function(){
							scope.authForm.login.$setValidity( false );
							scope.authForm.password.$setValidity( false );
							scope.state.accepted = true;
							scope.state.error = true;
						} )['finally']( function(){
							scope.state.loading = false;
						} );
					};
					scope.releaseError = function(){
						scope.state.accepted = false;
					};

					function setError( state ){
						scope.authForm.login.$setValidity( ! state );
						scope.authForm.password.$setValidity( ! state );
					}

					function fixModels(){
						angular.forEach( ['login', 'password'], function( key ){
							if( ! scope.data[ key ] ){
								scope.data[key] = element.find( 'input[name="' + key + '"]' ).val();
							}
						} );
					}
				}
			}

		}] );