newsModule.controller('FeedSettingsCtrl', ['$rootScope','$scope', 'feedSettingsService', 'feedsService', function($rootScope, $scope, feedSettingsService, feedsService){
	$scope.feedsList = feedSettingsService.init();
	$scope.Init = function(){
		feedSettingsService.getAllFeedsFromServer();
	};
	$scope.CheckAll = function(check){
		feedSettingsService.checkAll(check);
	};
	$scope.ToggleAll = function(){
		feedSettingsService.checkAll( ! feedSettingsService.isAllChecked() );
	};
	$scope.UpdateFeedsVisibility = function(){
		feedSettingsService.sendToServerFeedSettings().then(function(){
			feedsService.getFeedsFromServer(); // update feeds
		});
	};
	$scope.isAllChecked = feedSettingsService.isAllChecked;

	$scope.getTotalItemsNumber = function (){
		return feedSettingsService.getTotalItemsNumber();
	}

	$rootScope.$on('handleCloseMenuForFeedEmit', function(event, args) {
		console.log('feed news need close menus ForFeed');
		$rootScope.showFeedSettings = false;
		$( document ).trigger( 'layoutUpdate' );
	});
}]);