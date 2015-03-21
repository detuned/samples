newsModule.controller( 'FeedStatCtrl', [ '$scope', 'NEWST', 'feedStatService', 'articleService', function ( $scope, NEWST, feedStatService, articleService ){
	$scope.feedStat = {
		enable : false
	};
	$scope.feedStatObjectDropdownHide = false;
	$scope.setActiveObject = function ( obj ){
	    $scope.feedStat.activeObject = obj;
		$scope.feedStatObjectDropdownHide = true;
	}

	function getStatKey(){
		var key = $scope.mode[0].feedViewMode
			? feedStatService.serializeRequest( $scope.mode[1] )
	        : null;
		return key;
	}

	$scope.getBarWidth = function ( val, total ){
		return ( val / total ).roundFloat() * 100 + '%';

	}

	$scope.$watch( getStatKey , function ( statId ){
		var
			options = $scope.mode[0],
			feedData = $scope.mode[1];
		$scope.feedStat = {
			enable : options.feedViewMode && feedData && ( + feedData.type == NEWST.FEED_TYPE_COMMON || + feedData.type == NEWST.FEED_TYPE_USER || feedData.search ),
			statId : statId
		};
	    if ( ! $scope.feedStat.enable ){
		    return;
	    }
		$scope.feedStat.isLoading = true;
		feedStatService.getStat( feedData ).then(function ( stat ){
		    $scope.feedStat.isLoading = false;
			if ( statId != $scope.feedStat.statId ){
				/* New stat was started while we loading */
				return;
			}
			if ( ! stat && ! stat.objects && ! stat.chart ){
				$scope.feedStat.enable = false;
				return;
			}
			_.extend( $scope.feedStat, _.pick( stat , 'objects', 'chart' ));
			if ( $scope.feedStat.objects && $scope.feedStat.objects[0] ){
				$scope.feedStat.activeObject = $scope.feedStat.objects[0];
			}
		}, function ( res ){
			if ( ! res.expired ){
		        $scope.feedStat.isLoading = false;
			}
		})
	} )
}]);