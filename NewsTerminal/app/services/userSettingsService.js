/*-------------- User Settings service synchronization------------------*/
services.factory('userSettingsService', ['$rootScope', '$http', '$q', 'feedsService',
    function($rootScope, $http, $q, feedsService) {
        function UserSettingsItem(data) {
	        angular.extend( this, data );
        }


	    var
		    isLoaded = false,
		    deferredLoading;
        var settings = {

            data: {},

            getUserSettings: function( isForce ){
				var deferred;
				if ( ! isForce && isLoaded ){
					deferred = $q.defer();
					return deferred.resolve( settings.data );
				}
	            else if ( ! isForce && ! isLoaded && deferredLoading ){
					return deferredLoading;
				}

	            deferredLoading = $http.get('/api/settings').then(function(r) {
                    console.log('userSettingsServ: get');
                    var response = r.data;
	                isLoaded = true;
                    settings.data = new UserSettingsItem( response );
                    return settings.data;
                },function(e){
	                isLoaded = true;
                    if (e.status == 404){
                        console.log('unauthorizated!');
                        // need to login
                    }
                });
	            return deferredLoading;
            },

            setUserSettings: function(params){
                angular.extend( settings.data, params || {} );
                $http.post('/api/settings', settings.data).then(function(r) {
                    console.log('userSettingsServ: set');
                    var response = r.data;

                },function(e){
                    if (e.status == 404){
                        console.log('unauthorizated!');
                        // need to login
                    }
                });
            },

            getLeftDragPosition: function(){
                return settings.data.dragPositionLeft;
            }

        };

        return settings;
    }]);