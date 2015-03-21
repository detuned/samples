angular.module( 'plugin.panel' )
	.service( 'tagsService', [
		'$q',
		'$timeout',
		'$log',
		'utilsService',
		'apiService',
		'dispatchService',
		'userPageService',
		function( $q, $timeout, $log, utilsService, apiService, dispatchService, userPageService ){
			var
				tagsService = {},
				isLoaded = false,
				loadingDefer,
				newTags = {};

			tagsService.allTags = [];
			tagsService.pageTags = userPageService.pageData.tags;

			tagsService.getAllTags = function(){
				var defer = $q.defer();
				if( isLoaded ){
					defer.resolve( tagsService.allTags );
				}
				else if( loadingDefer ){
					return loadingDefer.promise;
				}
				else {
					loadingDefer = $q.defer();
					apiService.request( 'userTags::list' ).then( function( list ){
						$log.log( 'tagsService: tags loaded ', list );
						setAllTags( _.isArray( list ) ? list : [] );
						isLoaded = true;
						loadingDefer.resolve( tagsService.allTags );
						defer.resolve( tagsService.allTags );
					} );
				}
				return defer.promise;
			};


			tagsService.init = function(){
				return $q.all(
					tagsService.getAllTags()
				);
			};

			tagsService.getPageTags = function(){
				return userPageService.getPageData().then( function( data ){
					utilsService.updateArray( tagsService.pageTags, data.tags || [] );
				} );
			};

			tagsService.addPageTag = function( tag, quite ){
				if( ! tagsService.hasTagInList( tag, tagsService.pageTags ) ){
					tagsService.pageTags.push( tag );
					apiService.request( 'userTags::tagAdd', { tag : tag } );
				}
			};

			tagsService.removePageTag = function( tag, quite ){
				var
					index = tagsService.getTagIndex( tag, tagsService.pageTags );
				if( index > - 1 ){
					tagsService.pageTags.splice( index, 1 );
					if( ! quite ){
						apiService.request( 'userTags::tagRemove', { tag : tag } );
					}
				}
			};

			function Autocomplete( options ){
				var
					_options = angular.extend( {
						allowAddTags : true,
						allowQuery   : false,
						fieldElement : null
					}, options || {} ),
					_isLoading = false,
					_suggestedList = [],
					_value = '',
					_lastValue = '',
					_addTagIndex = - 1,
					instance = {
						get suggestedList(){ return _suggestedList },
						get query(){ return _lastValue },
						get isLoading(){ return _isLoading },
						get isEmpty(){ return ! _suggestedList.length },
						get addTagIndex(){ return _addTagIndex },
						suggest   : suggest,
						showAll   : showAll,
						toggleAll : toggleAll,
						clear     : clear,
						value     : ''
					},
					limit = 5,
					updateTimer;

				if( _options.fieldElement && ! _options.fieldModel ){
					_options.fieldModel = _options.fieldElement.controller( 'ngModel' );
				}

				function suggest( value ){
					var
						defer = $q.defer(),
						query = value;
					_lastValue = value;

					_isLoading = true;

					tagsService.getAllTags().then( function( allTags ){
						if( _lastValue != query ){
							// Request has changed
							return;
						}
						var res = _.filter( allTags, function( item ){
							return normalize( item ).indexOf( normalize( query ) ) > - 1;
						} );
						if( query && ! tagsService.hasTagInList( query, res ) && _options.allowAddTags ){
							res.push( utilsService.l10n( 'tag_new' ) + ': ' + query );
							_addTagIndex = res.length - 1;
						}
						_suggestedList = res;
						defer.resolve( res );
					}, defer.reject )
						.finally( function(){
							_isLoading = false;
						} );


					return defer.promise;
				}

				function showAll(){
					if( _options.fieldElement && _options.fieldModel ){
						_options.fieldElement.focus();
						_options.fieldModel.$setViewValue( ' ' );
						$timeout( function(){
							//Magic to force typeAhead directive's to refresh
							_options.fieldModel.$setViewValue( '' );
							_options.fieldModel.$render();
						} )
					}
				}

				function toggleAll(){
					$timeout(function (){
						if ( _suggestedList.length ){
							clear();
							_options.fieldElement.focus();
						}
						else{
							showAll();
						}
					});
				}

				function clear(){
					_suggestedList.length = 0;
					_addTagIndex = - 1;
					_isLoading = false;
					if( updateTimer ){
						$timeout.cancel( updateTimer );
					}
				}

				return instance;
			}

			tagsService.Autocomplete = Autocomplete;

			tagsService.normalize = normalize;

			tagsService.removeTag = function( tag, list ){
				var index = getTagIndex( tag, list );
				if( index > - 1 ){
					list.splice( index, 1 );
				}
			};

			tagsService.hasTagInList = function( tag, list ){
				return ( getTagIndex( tag, list ) > - 1 );
			};

			tagsService.getTagIndex = getTagIndex;

			tagsService.registerTag = function( tag ){
				//TODO save new tag on server
			};

			tagsService.isTagNew = function( tag ){
				return ( tag in newTags );
			};

			dispatchService
				.listen( 'sys::tagsReset', function( data ){
					if( data && data.tags ){
						$log.log( 'tagsService: got command to reset tags', data.tags );
						setAllTags( data.tags );
					}
					else {
						$log.warn( 'tagsService: tagsReset fired with', data, 'but not applied' );
					}
				} )
				.listen( 'userPage::tagAdd', function( data ){
					if( data && data.tag ){
						$log.log( 'tagsService: got command to add tag', data.tag );
						tagsService.addPageTag( data.tag, true );
						$log.log( 'page data after adding tag', userPageService.pageData );
					}
					else {
						$log.warn( 'tagsService: tagAdd fired with', data, 'but not applied' );
					}
				} )
				.listen( 'userPage::tagRemove', function( data ){
					if( data && data.tag ){
						$log.log( 'tagsService: got command to remove tag', data.tag );
						tagsService.removePageTag( data.tag, true );
						$log.log( 'page data after removing tag', userPageService.pageData );
					}
					else {
						$log.warn( 'tagsService: tagRemove fired with', data, 'but not applied' );
					}
				} );


			function setAllTags( tags ){
				utilsService.updateArray( tagsService.allTags, tags || [] );
			}

			function getTagIndex( tag, list ){
				return _.indexOf( normalize( list ), normalize( tag ) );
			}

			function normalize( tag ){
				if( angular.isArray( tag ) ){
					return _.map( tag, normalize );
				}
				return tag.toLocaleLowerCase();
			}


			return tagsService;
		}] );