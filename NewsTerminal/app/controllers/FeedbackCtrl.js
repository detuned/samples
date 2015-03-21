
newsModule.controller('FeedbackCtrl', ['$rootScope','$scope', '$routeParams', '$location', 'newsService', 'feedsService',
	function($rootScope, $scope, $routeParams, $location, newsService) {

		$scope.feedbackTypes = [
			{
				id: 'general', title: GLOBAL.l10n('общие вопросы'), selected: true
			},
			{
				id: 'tech_problems', title: GLOBAL.l10n('технические проблемы'), selected: false
			},
			{
				id: 'product', title: GLOBAL.l10n('вопросы по продуктам'), selected: false
			},
//			{
//				id: 'errors', title: GLOBAL.l10n('сообщение об ошибке'), selected: false
//			},
			{
				id: 'contents', title: GLOBAL.l10n('вопросы по использованию контента'), selected: false
			}
		];

		$scope.mail_subject = {
			id: $scope.feedbackTypes[0].id,
			title: $scope.feedbackTypes[0].title
		};

		$scope.mail_text = '';

		$scope.feedbackTypeSelect = {
			opened: false
		};

		$scope.SendFeedback = function(){
			newsService.sendFeedback($scope.mail_subject, $scope.mail_text);
			$scope.popupFeedback.opened = false;
		};
		$scope.FeedbackTypeSelectShow = function($event){
			$event.stopPropagation();
			$event.preventDefault();
			if ( ! $scope.feedbackTypeSelect.opened ){
				$scope.feedbackTypeSelect.opened = true;
			} else {
				$scope.feedbackTypeSelect.opened = false;
			}
		};
		$scope.AddTypeToSelected = function(index, $event){
			var type = $scope.feedbackTypes[index];
			$scope.mail_subject.id = type.id;
			$scope.mail_subject.title = type.title;
			_.each($scope.feedbackTypes, function(type){
				type.selected = false;
			});
			$scope.feedbackTypes[index].selected = true;
			$scope.feedbackTypeSelect.opened = false;
		};


	}]);