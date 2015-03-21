angular.module( 'plugin' )
	.filter( 'clearHtml', [
		function(){
			var el = angular.element( '<div></div>' );
			return function( text){
				return text
					? el.text( text ).html()
					: text;
			};
		}] );