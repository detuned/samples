var
	DistrictsDict = (function(){
		var
			DISTRICTS = {				
				},
			/** 
			 * Public of RegionsDict
			 */
			obj = {
				getDistrictCode : function( code ){
					if (!code) {
						return NaN;
						}
					code = trimStr( code , ' \\s\\t' ).split( "\t" ).shift();
					if (!isNaN (+ code)) {
						return + code;
						}
					if (! (code in DISTRICTS)) {
						return NaN;
						}
					return DISTRICTS[code];
					}
				}
		return obj;
		})();