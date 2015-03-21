(function ( angular ){
	if ( ! angular ){
		return;
	}
	angular.module( 'osb', [] )
		.constant( 'CONST', {
			'USER_RIGHTS'     : {
				'STATVIEW' : 2,
				'VIEW'     : 10,
				'EDIT'     : 50,
				'ADMIN'    : 90,
				'OWN'      : 100
			},
			'CLASS_PREFIX'    : 'osb',
			'CLASS_SEPARATOR' : '-'
		} )
		.run( [ '$rootScope', '$document', '$window', '$http', 'CONST', 'osbDom', 'osbUser', 'osbUtils',
			function ( $rootScope, $document, $window, $http, CONST, osbDom, osbUser, osbUtils ){
				$rootScope.CONST = CONST;
				$rootScope.activeUser = osbUser;
				$rootScope.utils = osbUtils;
				$rootScope.lang = $document.find( 'body' ).data( 'lang' );

				$http.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
				$http.defaults.transformRequest = function ( data ){
					if ( data === undefined ){
						return data;
					}
					return angular.element.param( data, true );
				}

				angular.extend( angular.element.fn, {
					findOsb           : function ( ext, m ){
						return this.find( '.' + osbDom.composeClass( this.osbBlockName(), ext, m ) );
					},
					removeOsbClasses  : function (){
						return this.each( function ( index, item ){
							var
								_cl = item.className || '',
								_cln = [];
							angular.forEach( _cl.split( ' ' ), function ( clPart ){
								if ( clPart.indexOf( CONST.CLASS_PREFIX + CONST.CLASS_SEPARATOR ) ){
									_cln.push( clPart );
								}
							} );
							item.className = _cln.join( ' ' );
						} )
					},
					osbBlockName      : function (){
						var blockName = this.data( 'osbBlock' );
						if ( ! blockName ){
							blockName = this.closest( '[data-osb-block]' ).data( 'osbBlock' );
							if ( blockName ){
								this.data( 'osbBlock', blockName );
							}
						}
						return blockName;
					},
					osbElemName       : function (){
						var
							elemName = this.data( 'osbElem' ),
							cl, m;
						if ( ! elemName ){
							cl = ( this.attr( 'class' ) || '' ).split( ' ' );
							for ( var i in cl ){
								if (
									cl.hasOwnProperty( i )
										&& ( m = cl[i].match( new RegExp( '^osb(?:-.*)-e-([^-]+)', 'i' ) ) )
										&& m[1]
									){
									elemName = m[1];
									break;
								}
							}
							if ( elemName ){
								this.data( 'osbElem', elemName );
							}
						}
						return elemName;
					},
					osbToggleModifier : function ( m, state ){
						return this.each( function (){
							var elem = angular.element( this );
							elem.toggleClass( osbDom.composeClass( elem.osbBlockName(), elem.osbElemName(), m ), state );
						} );
					},
					osbModifier       : function ( expr, m, state ){
						return this.findOsb( expr ).osbToggleModifier( m, state );
					},
					osbHasModifier    : function ( m, state ){
						return this.hasClass( osbDom.composeClass( this.osbBlockName(), this.osbElemName(), m ) );
					},
					serializeObject   : function (){
						var o = {};
						var a = this.serializeArray();
						$.each( a, function (){
							if ( o[this.name] !== undefined ){
								if ( ! o[this.name].push ){
									o[this.name] = [o[this.name]];
								}
								o[this.name].push( this.value || '' );
							} else {
								o[this.name] = this.value || '';
							}
						} );
						return o;
					}
				} );


			}] );

	angular.element( document ).on( 'ready', function (){
		angular.element( '[data-osb-app]' ).each( function (){
			angular.bootstrap( this, [ angular.element( this ).data( 'osbApp' ) ] );
		} );
	} );

})( window.angular );