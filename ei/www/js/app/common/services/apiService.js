angular.module( 'index' )
	.service( 'apiService', [ 'configService', 'socketApiService', 'pollingApiService', function( configService, socketApiService, pollingApiService ){
		var
			apiService = {},
			types = {
				socket  : socketApiService,
				polling : pollingApiService
			};

		apiService.getInstance = function( type ){
			return types[ type || configService.defaultApiTransport ];
		};

		return apiService;
	}] );