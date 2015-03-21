(function( global ){
	/**
	 * Smart Collection of users data already loaded and preserved on client-side
	 */
	global.UsersRegistry = (function(){
		var
			registry = {},

			/**
			 * User Model
			 * Features:
			 *  — providing the necessary (!) data transparently for consumers
			 *     from server or from cache
			 *  — using requests queue and avoiding of dual loading the same data
			 *  — controlling the relevance of the each field
			 */
				UserModel = function( data ){
				var
					_schema = {
						fields : {
							id            : undefined,
							name          : undefined,
							online        : {
								lifetime : 300000
							},
							status        : {
								lifetime : 300000
							},
							avatar        : undefined,
							age           : undefined,
							location      : undefined,
							unread        : undefined,
							folder        : undefined,
							favorite      : undefined,
							ignored       : undefined,
							totalMessages : undefined,
							like          : undefined,
							likeTime      : undefined
						}
					},
					_data = {
						id : undefined
					},
					instance,

					/**
					 * Requests to server queued by this
					 * Idea is if the previous requests load values of fields
					 * required for the next one
					 * the next will not load it again but just use them
					 */
						queue = (function(){
						var
							queue = [],
							req,
							queueDfd = $.Deferred().resolve(),
							instance = $.eventDriven( {
								push      : function( data ){
									var
										dfd = $.Deferred();
									if( 'resolved' == queueDfd.state() ){
										queueDfd = $.Deferred();
									}

									queue.push( {
										dfd     : dfd,
										fields  : data.fields || [],
										onStart : data.onStart || function(){
										}
									} );
									next();
									return dfd;
								},
								whenEmpty : function(){
									return queueDfd;
								}
							} );

						function next(){
							if( req ){
								/* Already sending */
								return false;
							}
							var
								item = queue.shift();
							if( ! item ){
								/* Queue is empty, nothing to do */
								queueDfd.resolve();
								return false;
							}
							if( item.onStart( item ) === false ){
								next();
								return;
							}
							req = load( item.fields )
								.done( function( res ){
									item.dfd.resolve( res );
									req = null;
									next();
								} )
								.fail( function( res ){
									item.dfd.reject( res );
									req = null;
									next();
								} );
						}

						return instance;
					})();

				if( data && data.__userModel ){
					/*
					 * UserModel diven as argument
					 * So just return it
					 */
					return data;
				}
				data && $.extend( _data, data );
				if( ! _data.id ){
					/* User with no id is invalid */
					return false;
				}
				if( registry[ _data.id ] ){
					/*
					 * User with such id already exists in registry
					 * So we'll just update and return it, not duplicate
					 */
					registry[ _data.id ].setData( _data );
					return registry[ _data.id ];
				}
				$.each( _schema.fields, function( fieldName, fieldSchema ){
					if( typeof _data[ fieldName ] != 'undefined' ){
						if( ! _schema.fields[ fieldName ] ){
							_schema.fields[ fieldName ] = {};
						}
						_schema.fields[ fieldName ].settime = ( new Date ).getTime();
					}
				} );

				/**
				 * Updates field value
				 * and triggers 'change' event if new value is different
				 *
				 * @param {String} k Field name
				 * @param {*} v New field value
				 */
				function setValue( k, v ){
					var prev = _data[ k ];
					_data[ k ] = v;
					if( ! _schema.fields[ k ] ){
						_schema.fields[ k ] = {};
					}
					_schema.fields[ k ].settime = (new Date).getTime();
					if( prev != v ){
						$( instance ).trigger( j( 'change:', k ), v );
					}
				}

				/**
				 * Loads values of specified fields.
				 * If nothing specified loads values of all known fields.
				 *
				 * @param {Array} fields Array of fields to load
				 */
				function load( fields ){
					if( ! fields || fields.length == 0 ){
						fields = [];
						$.each( _schema.fields, function( fieldName ){
							fields.push( fieldName );
						} )
					}
					return $.ajax( {
						url  : j( '/users/data/', _data.id ),
						type : 'GET',
						data : {
							fields : fields.join( ',' )
						}
					} );
				}

				/**
				 * Filters specified fields list and returns undefined or expired only
				 *
				 * @param {Array} fields
				 */
				function getUndefinedFields( fields ){
					var
						res = [];
					if( fields && fields.length ){
						$.each( fields, function( num, fieldName ){
							if(
								typeof _data[ fieldName ] == 'undefined'
									|| (
									_schema.fields[ fieldName ]
										&& _schema.fields[ fieldName ].lifetime
										&& _schema.fields[ fieldName ].settime
										&& ( (new Date).getTime() - _schema.fields[ fieldName ].settime > _schema.fields[ fieldName ].lifetime )
									)
								){
								/**
								 * We considering field undefined if it's really undefined
								 * or if its settime was expired
								 */
								res.push( fieldName );
							}
						} )
					}
					else {
						$.each( _schema.fields, function( fieldName, fieldSchema ){
							if( typeof _data[ fieldName ] == 'undefined' ){
								res.push( fieldName );
							}
						} );
					}
					return res;
				}

				/**
				 * Public of UserModel instance
				 * Wrapping object with <code>$.eventDriven</code> means
				 * that result object supports jQuery's on & off methods
				 *
				 * @type {Object}
				 */
				instance = $.eventDriven( {
					__userModel : true,
					data        : _data,
					setData     : function( d, v ){
						if( $.isPlainObject( d ) ){
							$.each( d, setValue );
						}
						else {
							setValue( d, v );
						}
						$( instance ).trigger( 'change', _data );
					},
					/**
					 * Asynchronously loads (or takes from cache) and returns
					 * values of specified user data's fields
					 *
					 * @param {Array} fields
					 */
					getData     : function( fields ){
						var
							dfd = $.Deferred(),
							undefinedFields = getUndefinedFields( fields );
						fields = fields || [];

						if( ! undefinedFields.length ){
							dfd.resolve( _data );
						}
						else {
							queue.push( {
								onStart : function( item ){
									undefinedFields = getUndefinedFields( fields );
									if( ! undefinedFields.length ){
										dfd.resolve( _data );
										return false;
									}
									else {
										item.fields = undefinedFields;
									}
								}
							} ).done( function( res ){
									instance.setData( res );
									dfd.resolve( _data );
								} )
						}
						return dfd;
					}
				} );


				/* Self registering in registry */
				registry[ _data.id ] = instance;

				return instance;
			},
			instance = $.eventDriven( {
				UserModel : UserModel
			} );

		return instance;
	})();

})( this );