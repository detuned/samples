services.factory( 'suggestService', [ '$http', 'NEWST', function( $http, NEWST ){
	var suggestService = {
		autoCompleteData     : {
			items            : [],
			query            : null,
			limit            : NEWST.AUTOCOMPLETE_BASE_COUNT,
			offset           : 0,
			inProgress       : false,
			isFull           : false,
			highlightedIndex : NaN
		},
		initAutoCompleteData : function(){
			suggestService.autoCompleteData.items = [];
			return suggestService.autoCompleteData;
		},
		clearAutoComplete    : function(){
			suggestService.autoCompleteData.items.length = 0;
		},
		getAutoComplete      : function( query, options ){
			var
				storage = arguments.callee,
				_options = angular.extend( {
					more : false
				}, options || {} );
			if( suggestService.autoCompleteData.query == query && _options.more ){
				if( storage.isLoading || suggestService.autoCompleteData.isFull ){
					return;
				}
				suggestService.autoCompleteData.offset = suggestService.autoCompleteData.items.length;
			}
			else {
				suggestService.autoCompleteData.offset = 0;
				suggestService.autoCompleteData.isFull = false;
			}
			suggestService.autoCompleteData.query = query;
			suggestService.autoCompleteData.inProgress = true;

			storage.isLoading = true;
			$http.get( '/api/suggest', {params : _.pick( suggestService.autoCompleteData, 'query', 'limit', 'offset' ), cache : true} ).then( function( r ){
				if( suggestService.autoCompleteData.query == query && _options.more ){

				}
				else {
					suggestService.autoCompleteData.items.length = 0;
				}
				storage.isLoading = false;
				suggestService.autoCompleteData.inProgress = false;
				// response from DB
				console.log( 'NewsServ: got auto search data' );
				var mySearchArray = ( r.data.list || [] );
				if( mySearchArray.length < suggestService.autoCompleteData.limit ){
					suggestService.autoCompleteData.isFull = true;
				}
//	            mySearchArray = mySearchArray.slice( 0, suggestService.maxsuggestServiceInAutocomplete );
				// need to update list
				_.each( mySearchArray, function( item ){
					suggestService.autoCompleteData.items.push( {
						sid            : item.sid,
						group          : item.group,
						title          : item.title,
						type           : item.type,
						suggest_string : item.suggest_string || r.data.suggest_string //TODO
					} );
				} );

			}, function( e ){
				if( suggestService.autoCompleteData.query == query && _options.more ){
					suggestService.autoCompleteData.isFull = true;
				}
				storage.isLoading = false;
				suggestService.autoCompleteData.inProgress = false;
				if( e.status == 404 ){
					console.log( 'unauthorizated!' );
					// need to login
				}
			} );
		}
	};
	return suggestService;
}] );