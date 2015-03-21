angular.module( 'plugin.panel' )
	.directive( 'pnNote', [
		'$timeout',
		'pluginService',
		'notesService',
		function( $timeout, pluginService, notesService ){
			return {
				templateUrl : pluginService.getTemplateUrl( '//panel/sections/notes/pnNote' ),
				replace     : true,
				scope       : {
					note : '=pnNote'
				},
				link        : function( scope, element, attrs ){
					var
						fieldElement = element.find( '[role="noteField"]' );
					scope.state = {
						edit    : false,
						loading : false
					};

					scope.switchEditMode = function( isEdit ){
						var
							newIsEditMode = arguments.length
								? ! ! isEdit
								: ! scope.state.edit;

						if( newIsEditMode ){
							onSetEdit();
						}
						scope.state.edit = newIsEditMode;
					};

					scope.onSubmit = function(){
						scope.state.loading = true;
						notesService.updatePageNote( scope.editNote ).then( function(){
							scope.switchEditMode( false );
						} )
							['finally']( function(){
							scope.state.loading = false;
						} );
					};

					scope.deleteNote = function(){
						scope.state.loading = true;
						notesService.removePageNote( scope.note.noteId )
							['finally']( function(){
							scope.state.loading = false;
						} );

					};

					function onSetEdit(){
						scope.editNote = _.clone( scope.note );
						$timeout( function(){
							fieldElement.focus();
						} );
					}

				}
			}

		}] );