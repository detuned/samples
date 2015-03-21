angular.module( 'plugin' )
	.filter( 'liveDiff', [function(){
			return function( text ){
				return text
					? moment.unix( + text ).fromNow()
					: ''
			};
		}] )