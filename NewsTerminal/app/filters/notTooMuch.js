newsModule
	.filter( 'notTooMuch', function(){
		return function( input ){
			var
				num = Number( input ),
				out = input;
			if( ! isNaN( num ) && num > 999 ){
				out = '999+';
			}
			return out;
		}
	} );