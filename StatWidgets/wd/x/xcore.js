define( 'xcore', [ 'jquery', 'underscore', 'core/utils', 'core/broadcaster' ], function( $, _, utils, broadcaster ){
	var
		widgets = [],
		element = $( '<div/>' ),
		coreError = minErr( 'core' );

	function Dom( widgetName, element, options ){
		var
			prefix = 'osb-wx-' + widgetName;

		if( ! element ){
			throw coreError( 'no DOM element specified for widget ' + widgetName );
		}
		function childClass(){
			var
				args = _.toArray( arguments ),
				baseClass = prefix + '-e-' + args.shift(),
				classes = [ baseClass ];
			_.map( args, function( m ){
				if( m ){
					classes.push( baseClass + '-m-' + m );
				}
			} );
			return classes.join( ' ' );
		}

		function append(){
			return $( '<div class="' + childClass.apply( childClass, arguments ) + '"></div>' ).appendTo( element );
		}

		function appendTo(){
			var
				args = _.toArray( arguments ),
				childName = args.shift(),
				childElement = child( childName );
			if ( ! childElement.length ){
				childElement = append( childName );
			}
			return $( '<div class="' + childClass.apply( childClass, args ) + '"></div>' ).appendTo( childElement );
		}

		function modClass(){
			var str = arguments.length > 1
				? [ arguments[0], arguments[1] ].join( '-' )
				: arguments[0];
			return prefix + '-m-' + str;
		}

		function mod(){
			var
				arg = _.toArray( arguments ),
				state;
			if( _.isBoolean( _.last( arg ) ) ){
				state = arg.pop();
			}
			return element.toggleClass( modClass.apply( modClass, arg ), state );
		}

		function child( name ){
			return element.find( '.' + childClass( name ) );
		}

		element.addClass( prefix );

		return {
			modClass   : modClass,
			mod        : mod,
			childClass : childClass,
			append     : append,
			appendTo   : appendTo,
			child      : child
		}
	}

	function minErr( widgetName ){
		return function(){
			var prefix = '[' + (widgetName ? widgetName : '') + '] ',
				template = arguments[0],
				templateArgs = arguments,
				message, i;

			message = prefix + template.replace( /\{\d+\}/g, function( match ){
				var index = + match.slice( 1, - 1 ), arg;

				if( index + 2 < templateArgs.length ){
					arg = templateArgs[index + 2];
					if( typeof arg === 'function' ){
						return arg.toString().replace( / ?\{[\s\S]*$/, '' );
					} else if( typeof arg === 'undefined' ){
						return 'undefined';
					} else if( typeof arg !== 'string' ){
						return JSON.stringify( arg );
					}
					return arg;
				}
				return match;
			} );

			return new Error( message );
		};
	}

	$( document ).trigger( 'xCoreReady' );
	return {
		registerWidget : function( name, instance ){
			widgets.push( {
				name     : name,
				instance : instance
			} );
		},
		minErr         : minErr,
		utils          : utils,
		broadcaster    : broadcaster,
		Dom            : Dom,
		on             : function(){
			element.on.apply( element, arguments );
		},
		off            : function(){
			element.off.apply( element, arguments );
		},
		trigger        : function(){
			element.trigger.apply( element, arguments );
		}
	};
} );