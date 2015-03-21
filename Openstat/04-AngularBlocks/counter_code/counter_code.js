(function ( angular ){

	var UNIVERSAL_COUNTER_ID = 1;

	angular.module( 'osb.block.counter_code', [ 'osb', 'osb.ui', 'ngClipboard' ] )
		.config( ['ngClipProvider', function ( ngClipProvider ){
			ngClipProvider.setPath( '/a/_common/zeroclipboard/ZeroClipboard.swf' );
		}] )
		.controller( 'CounterCodeCtrl', [ '$scope', 'osbUtils', function ( $scope, osbUtils ){
			$scope.codeTemplate = {
				exportCode   : function (){},
				onExportCode : function (){}
			}
			$scope.codeData = {
				id         : 1,
				visible    : false,
				fontLight  : 0,
				gradient   : true,
				color      : 'ff9822',
				image      : null,
				getImageId : function (){return null},
				imageStr   : function (){
					var id;
					return this.visible && ( id = this.getImageId() )
						? ( ', image: ' + id ) +
						(
							this.color
								? ', color: "' + this.color + '"'
								: ''
							)
						: ''
				}
			}
			$scope.isNoFlash = ! osbUtils.FLASH_CHECKING.DetectFlashVer( 8 );
		}] )
		.directive( 'counterCode', [ '$templateCache', '$timeout', 'osbDom', 'osbUtils', function ( $templateCache, $timeout, osbDom, osbUtils ){
			return {
				compile : function ( cElement, cAttrs ){
					cElement.html( $templateCache.get( 'osb.block.counter_code.code_template.html' ) );
					return {
						post : function ( scope, element, attrs ){
							var codeElement = element.closest( '.' + osbDom.composeClass( 'counter_code', 'code' ) );
							scope.codeTemplate.exportCode = function (){
								return $( '<div/>' ).html( element.html() ).text();
							}

							scope.codeTemplate.onExportCode = function (){
								codeElement.osbToggleModifier( 'copied', true );
								$timeout( function (){
									codeElement.osbToggleModifier( 'copied', false );
								}, 500 );
							}

								/* Highlighting code on changes */
							;
							(function (){
								var timer;

								function resetTimer(){
									if ( timer ){
										$timeout.cancel( timer );
										timer = null;
									}
								}

								scope.$watch( function (){
									return scope.codeData.id + scope.codeData.fontLight + scope.codeData.gradient + scope.color + scope.codeData.imageStr();
								}, function (){
									resetTimer();
									codeElement.osbToggleModifier( 'changed', true );
									timer = $timeout( function (){
										codeElement.osbToggleModifier( 'changed', false );
									}, 500 );
								} )
							})();
						}
					}
				}
			}
		}] )
		.directive( 'counterCodeSetup', [ '$timeout', function ( $timeout ){
			return {
				templateUrl : '/a/_common/b/counter_code/counterCodeSetup.html',
				replace     : true,
				link        : function ( scope, element, attrs ){
					scope.colors = [
						'c3c3c3', '828282', '000000', '3400cd', '458efc', '258559', '00d43c', 'c0f890',
						'fdd127', 'ff9822', 'ff5f1e', 'ff001c', '9c0037', '8f46b9', 'c044b6', 'ff86fb'
					];
					var allButtons = {
						'88x31'             : {
							name   : '88x31',
							images : {
								gradient_dark    : 87,
								nogradient_dark  : 88,
								gradient_light   : 89,
								nogradient_light : 90
							}
						},
						'88x31_num'         : {
							name      : '88x31_num',
							dynamical : true,
							images    : {
								gradient_dark    : 5081,
								nogradient_dark  : 5082,
								gradient_light   : 5083,
								nogradient_light : 5084
							}
						},
						'88x15_num'         : {
							name      : '88x15_num',
							dynamical : true,
							images    : {
								gradient_dark    : 5085,
								nogradient_dark  : 5086,
								gradient_light   : 5087,
								nogradient_light : 5088
							}
						},
						'31x31'             : {
							name   : '31x31',
							images : {
								gradient   : 91,
								nogradient : 92
							}
						},
						'31x31_transparent' : {
							name   : '31x31_transparent',
							images : {
								gradient   : 93,
								nogradient : 94
							}
						}
					}

					function setButtons(){
						if ( + scope.codeData.id === UNIVERSAL_COUNTER_ID ){
							/* Numbered buttons are excluding from the list for universal counter */
							scope.buttons = [
								allButtons['88x31'],
								allButtons['31x31'],
								allButtons['31x31_transparent']
							];
						}
						else{
							scope.buttons = [
								allButtons['88x31'],
								allButtons['88x31_num'],
								allButtons['88x15_num'],
								allButtons['31x31'],
								allButtons['31x31_transparent']
							];

						}
					}


					scope.buttons = [];
					setButtons();
					scope.$watch( 'codeData.id', setButtons );

					scope.codeData.buttonIndex = 0;
					scope.codeData.getImageId = function ( button ){
						var
							p = [];
						if ( ! button ){
							button = scope.buttons[ scope.codeData.buttonIndex ] || {};
						}
						if ( ! button || ! button.images ){
							return null;
						}
						p.push(
							scope.codeData.gradient
								? 'gradient'
								: 'nogradient'
						);
						if ( angular.isDefined( button.images.gradient_dark ) ){
							p.push(
								Number( scope.codeData.fontLight )
									? 'light'
									: 'dark'
							);
						}
						return button.images[ p.join( '_' ) ];
					}
				}
			}
		}] )
		.directive( 'counterCodeImage', [function (){
			return {
				scope    : {
					codeData : '=',
					button   : '=counterCodeImage'
				},
				template : '<img data-ng-src="{{getImageSrc()}}" alt="" data-ng-show="isVisible">',
				link     : function ( scope, element, attrs ){
					scope.isVisible = false;
					scope.getImageSrc = function (){
						var
							p = [],
							id = scope.codeData.getImageId( scope.button );
						if ( ! id ){
							scope.isVisible = false;
							return '';
						}
						scope.isVisible = true;
						return scope.button.dynamical
							? 'https://openstat.net/digits?cid=1105998&ls=0&ln=' + id + '&tc=' + scope.codeData.color
							: 'https://openstat.net/i/' + id + '.gif?tc=' + scope.codeData.color
					}
				}
			}
		}] )
})( window.angular );