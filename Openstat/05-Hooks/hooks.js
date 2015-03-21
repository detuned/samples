/**
 * Engine for creating, storing and applying hooks —
 * tiny functions, embedding to any modules
 *
 * Hooks are the good alternate to hacks.
 * Using hooks you can group in one place all exceptions
 * of the business logic and simply manage these groups:
 * turn all of them on or off.
 * The main code will be not cluttered with numerous repetitions
 * of the same conditions checking.
 *
 * @example <code>
 *
 *     // Step 1
 *     // Creating new hooks provider e.g. named myFunctionality
 *     // and describing hooks
 *     HooksController.registerProvider( 'myFunctionality' , HooksController.Provider({
 *	        schema : {
 *				'needToMakeSomeAction' : HooksController.HookSchema({
 *					'returnType' : HooksController.RETURN_TYPE_BOOLEAN_OR
 *					})
 *			}
 *		}) );
 *
 *
 *      // Step 2
 *      // If necessary register any number of hooks sets:
 *
 *          // 1. makes sence if page runs in any 'modern; mode
 *          HooksController.registerSet( 'modern' , HooksController.Set({
 *              'needToMakeSomeAction' : HooksController.Hook(function(){
 *					return true;
 *					}),
 *          });
 *
 *          // 2. makes sence if page runs in any 'fallback' mode
 *          HooksController.registerSet( 'fallback' , HooksController.Set({
 *              'needToMakeSomeAction' : HooksController.Hook(function(){
 *					return false;
 *					}),
 *          });
 *
 *
 *     // Step 3
 *     // In the appropriate key points of myFunctionality code
 *     // place hooks like this:
 *
 *     var myFunctionality = {
 *         anyAction : function (){
 *              if ( false === HooksController.hook( 'myFunctionality.needToMakeSomeAction' ) ){
 *					return false;
 *				}
 *          }
 *     }
 *
 *     </code>
 *
 * @author Maxim Smirnov <detunedtv@gmail.com>
 */
var HooksController = (function (){
	var
		GLOBAL_PROVIDER_ID = 'global',
		RETURN_TYPE_ARRAY = 'array',
		RETURN_TYPE_BOOLEAN_AND = 'boolean_and',
		RETURN_TYPE_BOOLEAN_OR = 'boolean_or',

		/**
		 * Controller for Hook Provider — external engine to embed hooks
		 */
			Provider = function ( data ){
			var
				_data = {
					/**
					 * Hooks schemas
					 * @type {Object}
					 */
					schema : {}
				},
				/**
				 * Linked sets
				 * @type {Object}
				 */
					_sets = {};
			data && $.extend( _data, data );

			/* Public of Provider */
			return {
				getHookSchema : function ( hookName ){
					return hookName in _data.schema
						? _data.schema[ hookName ]
						: HookSchema();
				},
				linkSet       : function ( id, sset ){
					_sets[ id ] = sset;
				},
				getLinkedSets : function (){
					return _sets;
				}
			}
		},
		/**
		 * Storage for hooks group
		 */
			Set = function ( data ){
			var
				_data = {
					/** @type {String} provider id  */
					provider : GLOBAL_PROVIDER_ID,
					/** @type {Object} */
					hooks    : {}
				};
			data && $.extend( _data, data );

			/* Public of Set */
			return {
				getHook       : function ( hookName ){
					return hookName in _data.hooks
						? _data.hooks[ hookName ]
						: undefined
				},
				getProviderId : function (){
					return _data.provider;
				}
			}
		},

		/**
		 * Model of hook properties data
		 */
			HookSchema = function ( data ){
			var
				_data = {
					returnType : RETURN_TYPE_ARRAY
				}
			data && $.extend( _data, data );

			/* Public of HookSchema */
			return {
				getReturnType : function (){
					return _data.returnType;
				}
			}
		},

		/**
		 * Hook model
		 */
			Hook = function ( data ){
			var
				_data = {
					f : function (){
					}
				}
			if ( $.isFunction( data ) ){
				_data.f = data
			}
			else if ( data ){
				$.extend( _data, data );
			}
			return {
				run : _data.f
			}
		},

		providers = {},

		getProvider = function ( id ){
			return id in providers
				? providers[ id ]
				: undefined;
		},

		obj = {
			RETURN_TYPE_ARRAY       : RETURN_TYPE_ARRAY,
			RETURN_TYPE_BOOLEAN_AND : RETURN_TYPE_BOOLEAN_AND,
			RETURN_TYPE_BOOLEAN_OR  : RETURN_TYPE_BOOLEAN_OR,
			Provider                : Provider,
			Set                     : Set,
			HookSchema              : HookSchema,
			Hook                    : Hook,
			/**
			 * Registers new provider with given id
			 *
			 * @param {String} id Provider unique identifier
			 * @param {HooksController.Provider()} provider
			 */
			registerProvider        : function ( id, provider ){
				if ( id in providers ){
					throw new Error( 'Hook provider ' + id + ' is already registered' );
				}
				providers[ id ] = provider;
			},
			/**
			 * Registers new hooks set with given id
			 *
			 * @param {String} id Set identifier
			 * @param {HooksController.Set()} sset Hooks set to register
			 */
			registerSet             : function ( id, sset ){
				var
					/** @type {Provider} */
						provider;

				provider = getProvider( sset.getProviderId() );
				if ( provider ){
					provider.linkSet( id, sset );
				}
			},
			/**
			 * Runs hook
			 */
			hook                    : function (){
				if ( ! arguments.length ){
					throw new Error( 'Cannot run unknown hook' );
				}
				var
					args = Array.prototype.slice.call( arguments ),
					name = String( args.shift() ),
					np = name.split( '.' ),
					providerId = GLOBAL_PROVIDER_ID,
					/** @type {HooksController.Provider()} */
						provider,
					/** @type {HooksController.HookSchema()} */
						hookSchema,
					/** @type {Object} */
						sets,
					/** @type {Array} */
						resArray = [],
					/** @type {Boolean} */
						resBoolean;

				if ( np.length > 1 ){
					providerId = np.shift();
					name = np.join( '.' );
				}
				provider = getProvider( providerId );
				if ( ! provider ){
					// Cannot run hook of unknown provider
					return;
				}
				hookSchema = provider.getHookSchema( name );

				sets = provider.getLinkedSets();
				if ( sets ){
					$.each( sets, function (){
						var
							/**
							 * @type {HooksController.Hook())
							 */
								hook = this.getHook( name ),
							res;

						if ( hook ){
							res = hook.run.apply( hook.run, args );
							resArray.push( res );
							switch ( hookSchema.getReturnType() ){
								case RETURN_TYPE_BOOLEAN_AND :
									if ( typeof resBoolean == 'undefined' ){
										resBoolean = true;
									}
									resBoolean = ! ! ( resBoolean && res );
									break;
								case RETURN_TYPE_BOOLEAN_OR :
									if ( typeof resBoolean == 'undefined' ){
										resBoolean = false;
									}
									resBoolean = ! ! ( resBoolean || res );
									break;
								case RETURN_TYPE_ARRAY :
								default :
									resArray.push( res )
							}
						}

					} );
				}
				switch ( hookSchema.getReturnType() ){
					case RETURN_TYPE_BOOLEAN_AND :
					case RETURN_TYPE_BOOLEAN_OR :
						return resBoolean;
					case RETURN_TYPE_ARRAY :
					default :
						return resArray;
				}
				return resArray;
			}
		}

	obj.registerProvider( GLOBAL_PROVIDER_ID, Provider( {} ) );

	return obj;
})();