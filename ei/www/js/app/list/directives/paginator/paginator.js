angular.module( 'index' )
	.directive( 'paginator', [ '$window', 'utilsService', 'configService', function( $window, utilsService, configService ){
		var windowElement = angular.element( $window );
		return {
			templateUrl : configService._getUrl( '//APP/list/directives/paginator/paginator.html' ),
			replace  : true,
			scope    : {
				page       : '=',
				totalPages : '='
			},
			link     : function( scope, element, attrs ){
				var
					destructors = utilsService.elementDestructor( element ),
					defaultMaxSide = 3,
					prevWidth = element.width(),
					isFitWidth = 'fitWidth' in attrs,
					update = _.debounce( function (){
						_update();
						scope.$apply();
					}, 200 );

				scope.pages = [];
				destructors.push(
					scope.$watch( 'page * totalPages', _update )
				);
				if ( isFitWidth ){
					windowElement.on( 'resize', update );
					destructors.push(function (){
						windowElement.off( 'resize', update );
					});
				}
				scope.change = function ( p ){
					var value = + ( p.value || p );
					if ( + value === + scope.page ){
						return;
					}
					if ( angular.isDefined( attrs.onChange ) ){
						scope.$parent.$eval( attrs.onChange.replace( /\$page/g, value ) );
					}
					scope.page = + value;
				}


				function _update(){
					var
						maxSide = defaultMaxSide,
						lead = [],
						tail = [],
						beginPage, leftSide, endPage, containerWidth, itemWidth, itemNum;


					if ( isFitWidth ){
						if ( containerWidth = element.width() ){
							prevWidth = containerWidth;
						}
						else{
							containerWidth = prevWidth;
						}
						itemWidth = scope.page.toString().length * 6.5 + 24;
						itemNum = Math.max( 0,  Math.floor( containerWidth / itemWidth ) - 8 );
						maxSide = Math.max( defaultMaxSide, Math.floor( itemNum / 2 ) );
					}
					beginPage = Math.max( 1, scope.page - maxSide );
					leftSide = scope.page - beginPage;
					endPage = Math.min( scope.totalPages || 0, scope.page + ( 2 * maxSide - leftSide ) );


					lead = [];
					tail = [];


					scope.pages = _.range( beginPage, endPage + 1 );

					// Add leading pages
					if ( beginPage > 1 ){
						lead.push( 1 );
					}
					if ( beginPage == 3 ){
						lead.push( 2 );
					}
					if ( beginPage > 3 ){
						lead.push( { title : '...', value : beginPage - 1, fake : true } );
					}

					// Add tailing pages
					if ( endPage < scope.totalPages ){
						tail.unshift( scope.totalPages );
					}
					if ( scope.totalPages - endPage == 2 ){
						tail.unshift( scope.totalPages - 1 );
					}
					if ( scope.totalPages - endPage > 2 ){
						tail.unshift( { title : '...', value : endPage + 1, fake : true } );
					}
					scope.pages = lead.concat( scope.pages, tail );
				}
				_update();


			}
		}

	}] )