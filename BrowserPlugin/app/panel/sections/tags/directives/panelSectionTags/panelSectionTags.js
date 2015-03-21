angular.module( 'plugin.panel' )
	.directive( 'panelSectionTags', [
		'$q',
		'$log',
		'$timeout',
		'pluginService',
		'tagsService',
		function( $q, $log, $timeout, pluginService, tagsService ){
			return {
				templateUrl : pluginService.getTemplateUrl( '//panel/sections/tags/panelSectionTags' ),
				replace     : true,
				scope       : true,
				link        : function( scope, element, attrs ){
					var
						fieldElement = element.find( '[role=tagsField]' ),
						newTagIndex;
					scope.tags = tagsService.pageTags;
					scope.tagsHighlighted = {};
					scope.tagsNew = {};
					scope.state = {
						ready : false
					};

					tagsService.init()['finally']( function(){
						scope.state.ready = true;
					} );

					scope.autocomplete = tagsService.Autocomplete( {
						fieldElement : fieldElement
					} );


					scope.selectTag = function( tag ){
						var
							index = tagsService.getTagIndex( tag, scope.autocomplete.suggestedList );

						//If field is empty it could means that 'showAll' mode is on
						//so addTagIndex doesn't matter
						if( + index == + scope.autocomplete.addTagIndex && scope.autocomplete.query ){
							tag = scope.autocomplete.query;
						}
						if( ! tagsService.hasTagInList( tag, scope.tags ) ){
							tagsService.addPageTag( tag );
							scope.tagsNew[ tag ] = $timeout( function(){
								$timeout.cancel( scope.tagsNew[ tag ] );
								delete scope.tagsNew[ tag ];
							}, 200 );
						}
						else {
							//Tag already selected so do not add but just highlight it for a while
							if( scope.tagsHighlighted[ tag ] ){
								$timeout.cancel( scope.tagsHighlighted[ tag ] );
							}
							scope.tagsHighlighted[ tag ] = $timeout( function(){
								$timeout.cancel( scope.tagsHighlighted[ tag ] );
								delete scope.tagsHighlighted[ tag ];
							}, 500 );
						}
						scope.autocomplete.value = '';
						scope.autocomplete.clear();
					};

					scope.isTagHighlighted = function( tag ){
						return ! ! scope.tagsHighlighted[ tag ];
					};

					scope.isTagNew = function( tag ){
						return ! ! scope.tagsNew[ tag ];
					};

					scope.removeTag = function( index ){
						tagsService.removePageTag( scope.tags[ index ] );
					};

					scope.hasAnyTags = function(){
						return tagsService.allTags.length > 0;
					};


					scope.searchByTag = function( tag ){
						scope.activateSection( 'search', { tags : [ tag ] } );
					};


					//Start
					scope.$on( 'sectionActivated_tags', fieldFocus );

					if( 'tags' === scope.activeSection.name ){
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