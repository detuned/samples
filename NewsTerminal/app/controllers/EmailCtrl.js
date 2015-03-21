newsModule.controller('EmailCtrl', ['$rootScope','$scope', '$routeParams', '$location', 'newsService', 'feedsService',
	function($rootScope, $scope, $routeParams, $location, newsService, feedsService) {

		$scope.emailOptions = newsService.getEmailOptions();

		$scope.SendEmail = function( onComplete ){
			newsService.sendEmailNews();
			onComplete && $scope.$eval( onComplete );
		};
	}]);