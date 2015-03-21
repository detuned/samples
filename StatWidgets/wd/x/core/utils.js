define( 'core/utils', [ 'jquery', 'underscore' ], function( $, _ ){
	var
		utils = {
			defaultDateFormat   : 'YYYYMMDD',
			parseStringTemplate : function( template, params, options ){
				return _.template(
					template,
					params,
					_.extend( options || {}, {
						interpolate : /\{(.+?)\}/g
					} )
				);
			},
			firstCharLc         : function( str ){
				return str.charAt( 0 ).toLocaleLowerCase() + str.substr( 1 );
			},
			getElementData      : function( element, filterOptions ){
				var
					data = element.data(),
					res = {};
				if( filterOptions ){
					$.each( data, function( key, value ){
						key = String( key );
						if(
							filterOptions.namespace
								&& key.indexOf( filterOptions.namespace ) === 0
								&& key.length > filterOptions.namespace.length
							){
							res[ utils.firstCharLc( key.substr( filterOptions.namespace.length ) ) ] = value;
						}
					} );
				}
				else {
					res = data;
				}
				return res;
			},
			numberFormat        : function( value, thousandSeparator, fractionSeparator ){
				if( ! value ){
					return value;
				}
				var
					str = value.toString(),
					decParts = str.split( '.' ),
					intStr = decParts.shift(),
					fractionStr = decParts.shift(),
					parts = [];
				if( _.isUndefined( thousandSeparator ) || _.isNull( thousandSeparator ) ){
					thousandSeparator = ' ';
				}
				if( _.isUndefined( fractionSeparator ) || _.isNull( fractionSeparator ) ){
					fractionSeparator = ',';
				}
				while( intStr.length > 2 ){
					parts.unshift( intStr.substr( intStr.length - 3, intStr.length ) );
					intStr = intStr.substr( 0, intStr.length - 3 );
				}
				if( intStr.length ){
					parts.unshift( intStr );
				}
				return [
					parts.join( thousandSeparator ),
					( fractionStr
						? fractionSeparator + fractionStr
						: '' )
				].join( '' );
			},

			pluralIndex : function( num ){
				var
					r10, r100, plr;

				if( isNaN( num ) ){
					return;
				}

				r10 = num % 10;
				r100 = num % 100;
				plr = (r10 == 1 && r100 != 11)
					? 0
					: (
					(r10 >= 2 && r10 <= 4 && (r100 < 10 || r100 >= 20) )
						? 1
						: 2
					);
				return plr;
			},
			plural      : function( num, endings, replace ){
				if( isNaN( num ) || ! endings.length ){
					return num;
				}
				var index = utils.pluralIndex( num );
				return replace
					? endings[ index ].replace( '%1', num )
					: num + ' ' + endings[ index ];
			},

			parseCsvString : function( str ){
				var p = _.map( str.split( ',' ), $.trim );
				return p;
			},

			/**
			 * Parses any form of list of settings and guaranteed returns an array
			 * @param {*} v
			 * @param {number} shift
			 * @returns {array}
			 */
			parseSettingsList : function( v, shift ){
				var res;
				if( _.isUndefined( v ) || ! String( v ) ){
					res = [];
				}
				else if( _.isArray( v ) ){
					res = v;
				}
				else {
					res = utils.parseCsvString( String( v ) );
				}
				if( shift ){
					shift = shift % res.length;
					res = res.concat( res.splice( 0, shift ) );
				}
				return res;
			},

			parsePeriodString : function( str, options ){
				options = _.defaults( options || {}, {
					format : utils.defaultDateFormat,
					sprt   : '-'
				} );
				
				function parseObject(){
					var
						dates = {},
						obj;
					try{
						eval( 'obj=' + str );
					}
					catch(e){
						throw new Error( 'Incorrect period notation: ' + str );
					}

					_.map( [ 'from', 'to' ], function ( key ){
						dates[key] = moment();
						//TODO parse more patterns
						if ( _.isObject( obj[key] ) ){
							dates[key].add( obj[key] );
						}
					} );

					return utils.getPeriod( dates.from, dates.to )
				}

				function parseString(){
					var
						parts = str.split( '-' ),
						date1 = moment( parts[0], options.format ),
						date2 = moment( parts[1], options.format );
					return utils.getPeriod( date1, date2 );
				}

				if ( utils.isJson( str ) ){
					return parseObject();
				}
				else{
					return parseString();
				}
			},

			getPeriodString : function( date1, date2, options ){
				options = _.defaults( options || {}, {
					format : utils.defaultDateFormat,
					sprt   : '-'
				} );

				var period = utils.getPeriod( date1, date2 );

				return [
					period.from.format( options.format ),
					period.to.format( options.format )
				].join( options.sprt );
			},

			getPeriod : function( date1, date2 ){
				var tmp;
				if( date2.isBefore( date1 ) ){
					tmp = date2;
					date2 = date1;
					date1 = tmp;
				}
				return {
					from : date1,
					to   : date2
				}
			},

			normalizeUrl : function( url ){
				return url
					? String( url )
					.toLocaleLowerCase()
					.replace( /^https?:\/\//, '' )
					.replace( /^www\./, '' )
					.replace( /\/$/, '' )
					: '';
			},

			makeUrlClickable : function( url ){
				return ! url || url.match( /^(?:https?:\/\/|javascript:)/ )
					? url
					: 'http://' + url;
			},

			isClickableUrl : function ( url ){
				return url && url.match( /^https?:\/\// );
			},

			isJson : function ( str ){
				return str && String( str ).match( /^\{.*\}$|^\[.*\]$/ );
			}
		};
	return utils;
} );