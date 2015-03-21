newsModule.controller('ErrorFeedbackCtrl', ['$rootScope','$scope', 'newsService',
	function( $rootScope, $scope, newsService ) {
		$scope.popupErrorFeedback.sel = {
			errorSelectedTextPre : '',
			errorSelectedText : '',
			errorSelectedTextPost : '',
			errorSelectedNodeUrl : ''
		}

		$scope.reset = function (){
			$scope.fields = {
				text : '',
				errorSelectedTextPre : $scope.popupErrorFeedback.sel.errorSelectedTextPre,
				errorSelectedText : $scope.popupErrorFeedback.sel.errorSelectedText,
				errorSelectedTextPost : $scope.popupErrorFeedback.sel.errorSelectedTextPost,
				errorSelectedNodeUrl : $scope.popupErrorFeedback.sel.errorSelectedNodeUrl
			};
			$scope.isError = false;
			$scope.isSending = false;
		}

		$scope.reset();
		$scope.send = function(){
			$scope.isSending = true;
			$scope.isError = false;
			newsService.sendErrorFeedback( $scope.fields ).then(function (){
				// Success
				$scope.popupErrorFeedback.opened = false;
				$scope.isSending = false;
			}, function (){
				// Error
				$scope.isError = true;
				$scope.isSending = false;
			})
		};

	}]);
