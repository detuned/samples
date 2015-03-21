angular.module( 'plugin.panel' )
	.directive( 'panelSectionSearch', [
		'$q',
		'$log',
		'$timeout',
		'pluginService',
		'searchService',
		'tagsService',
		'tasksQueueService',
		function( $q, $log, $timeout, pluginService, searchService, tagsService, tasksQueueService ){
			return {
				templateUrl : pluginService.getTemplateUrl( '//panel/sections/search/panelSectionSearch' ),
				replace     : true,
				scope       : true,
				link        : function( scope, element, attrs ){
					var
						fieldElement = element.find( '[role=searchField]' );

					scope.state = {
						ready   : false,
						loading : true //Cause we'll start search immediately anyway
					};

					scope.tags = [];
					scope.tagsHighlighted = {};
					scope.results = [];

					tagsService.init()['finally']( function(){
						scope.state.ready = true;
					} );

					scope.autocomplete = tagsService.Autocomplete( {
						allowAddTags : false,
						fieldElement : fieldElement
					} );

					scope.selectTag = function( tag ){
						var
							index = tagsService.getTagIndex( tag, scope.autocomplete.suggestedList );

						if( ! tagsService.hasTagInList( tag, scope.tags ) ){
							scope.tags.push( tag );
							scope.autocomplete.value = '';
							scope.search();
							updateLayout();
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
							scope.autocomplete.value = '';
						}
					};

					scope.isTagHighlighted = function( tag ){
						return ! ! scope.tagsHighlighted[ tag ];
					};

					scope.removeTag = function( index ){
						tagsService.removeTag( scope.tags[ index ], scope.tags );
						scope.search();
						updateLayout();
					};

					scope.hasAnyTags = function(){
						return tagsService.allTags.length > 0;
					};


					scope.search = _.debounce( search, 300 );

					function search(){
						var
							searchData = {};
						searchData.allStr = [ scope.autocomplete.value ];
						if( scope.tags.length ){
							searchData.allTags = scope.tags;
						}

						scope.results = [];
						scope.state.loading = true;
						$log.log( 'search: start searching with query=', scope.autocomplete.value, 'tags=', scope.tags );
						searchService.search( searchData )
							.then( function( results ){
								scope.results = results;
								$log.log( 'search: got results', results );
							}, function (){
								scope.results = [];
							} )
							.finally( function(){
								scope.state.loading = false;
							} );
					}

					function updateLayout(){
						$timeout(function (){
							scope.$broadcast( 'panelContentUpdated' );
						});
					}


					//Start
					scope.$on( 'sectionActivated_search', function(){
						fieldFocus();
						scope.search();
					} );

					if( 'search' === scope.activeSection.name ){
						fieldFocus();
						scope.search();
					}

					tasksQueueService.subscribe( 'section:search', function ( task ){
						if ( task.tags ){
							scope.tags = task.tags;
							updateLayout();
						}
						if ( task.query ){
							scope.autocomplete.value = task.query;
						}
						scope.search();
					} );

					function fieldFocus(){
						$timeout( function(){
							fieldElement.focus();
						}, 200 )
					}
				}
			}

		}] );