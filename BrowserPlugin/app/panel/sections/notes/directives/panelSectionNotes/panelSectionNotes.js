angular.module( 'plugin.panel' )
	.directive( 'panelSectionNotes', [
		'$timeout',
		'pluginService',
		'notesService',
		function( $timeout, pluginService, notesService ){
			return {
				templateUrl : pluginService.getTemplateUrl( '//panel/sections/notes/panelSectionNotes' ),
				replace     : true,
				scope       : true,
				link        : function( scope, element, attrs ){
					var
						fieldElement = element.find( '[role=addNotesField]' );

					scope.newNote = {
						text : ''
					};
					scope.state = {
						adding   : false,
						addFocus : false
					};

					scope.notes = notesService.pageNotes;

					scope.addNote = function(){
						if ( ! scope.newNote.text ){
							return;
						}
						scope.state.adding = true;
						notesService.addPageNote( scope.newNote ).then( function(){
							scope.newNote.text = '';
						}, function(){
							//TODO handle adding error
						} )['finally']( function(){
							scope.state.adding = false;
							fieldFocus();
						} )
					};


					//Start
					scope.$on( 'sectionActivated_notes', fieldFocus );

					if( 'notes' === scope.activeSection.name ){
						fieldFocus();
					}

					function fieldFocus(){
						$timeout( function(){
							fieldElement.focus();
						}, 200 )
					}
				}
			}

		}] );