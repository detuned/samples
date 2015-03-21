/**
 * Eases works with classes, using them as advanced state indicators
 * @param settings
 * @returns {{c: Function, cl: Function, _cl: Function, _clp: Function, _d: Function, _v: Function, _vv: Function, vv: Function, _s: Function, setContainer: Function, reset: Function}}
 */
function Insulator( settings ){
	var
		_settings = {
			prefix : 'c',
			sprt   : '--'
		},
		$container,
		/**
		 * Inner storage for jQuery containers keyed by theirs unprefixed class names
		 */
			innerContainers = {};
	settings && $.extend( _settings, settings );

	$container = _settings.container
		? $( _settings.container )
		: $( document.body );

	/**
	 * Composes and returns class expression with prefix
	 * @param {String} class base name
	 */
	function _ic( c ){
		return c
			? j( _settings.prefix, _settings.sprt, String( c ).split( '.' ).join( _settings.sprt ) )
			: _settings.prefix;
	}

	/**
	 * Composes and returns class expression with prefix
	 * The same as _ic but previously parses given class base name
	 * and replace all dots to separators
	 * @param {String} class base name
	 */
	function _icp( c ){
		return c
			? j( _settings.prefix, _settings.sprt, String( c ).split( '.' ).join( _settings.sprt ) )
			: _settings.prefix;
	}

	/**
	 * Serializes data in element class uses given class prefix
	 * @param {String} c class base name
	 * @param {Object} d data to serialize
	 * @return {String} class name
	 */
	function _icd( c, d ){
		var
			p = c
				? j( _settings.prefix, _settings.sprt, c )
				: _settings.prefix,
			res = [ p ];
		for( var i in d ){
			if( d.hasOwnProperty( i ) ){
				res.push( j( p, _settings.sprt, i, _settings.sprt, d[ i ] ) );
			}
		}
		return res.join( ' ' )
	}

	function _icvv( c, key, value ){
		var
			p = c
				? j( _settings.prefix, _settings.sprt, String( c ).split( '.' ).join( _settings.sprt ) )
				: _settings.prefix;
		return j( p, _settings.sprt, key, _settings.sprt, value );
	}

	function icvv( c, key, value ){
		return j( '.', _icvv( c, key, value ) );
	}

	function _icv( c, key, value ){
		var
			_c = String( c ).split( '.' ).join( _settings.sprt ),
			p = c
				? j( _settings.prefix, _settings.sprt, _c )
				: _settings.prefix;
		return [ p , _icvv( _c, key, value ) ].join( ' ' );
	}


	function _icvSearch( $c, c, key ){
		var
			p = c
				? j( _settings.prefix, _settings.sprt, c )
				: _settings.prefix;
		return $( $c ).searchInClass( j( p, _settings.sprt, key, _settings.sprt ) );
	}

	/**
	 * Composes and returns item jQuery class expression with prefix
	 */
	function ic( c ){
		return c
			? j( '.', _settings.prefix, _settings.sprt, String( c ).split( '.' ).join( _settings.sprt ) )
			: j( '.', _settings.prefix )
	}


	/**
	 * Gets inner container by its class (without prefix)
	 * Caches results in <code>innerContainers</code>, so each container searched at once only.
	 * If given second <code>elem</code> param container will be created on fly (with prefixed class)
	 * And if given third <code>parent</code> it will be appended to it
	 * @param {String} c class name
	 * @param optional {element}
	 * @param optional {String} parent unprefixed class of parent element to append new one to
	 * @return {jQuery}
	 */
	function $ic(){
		var
			args = Array.prototype.slice.call( arguments ),
			force = false,
			c,
			elem,
			parent;
		if( args[0] === true ){
			force = true;
			args.shift();
		}
		c = args.shift();
		elem = args.shift();
		parent = args.shift();


		if( typeof elem != 'undefined' ){
			/* Creating */
			innerContainers[ c ] = $( elem ).addClass( _ic( c ) );
			if( parent ){
				innerContainers[ c ].appendTo( $ic( parent ).eq( 0 ) );
			}
			else {
				innerContainers[ c ].appendTo( $container );
			}
		}
		else if( ! ( c in innerContainers ) || force ){
			innerContainers[ c ] = $container.find( ic( c ) );
		}
		return innerContainers[ c ];
	}

	function setContainer( c ){
		$container = $( c );
	}

	function reset(){
		innerContainers = [];
	}

	return {
		/**
		 *
		 * @type {Function}
		 * @return {jQuery}
		 */
		c            : $ic,
		cl           : ic,
		_cl          : _ic,
		_clp         : _icp,
		_d           : _icd,
		_v           : _icv,
		_vv          : _icvv,
		vv           : icvv,
		_s           : _icvSearch,
		setContainer : setContainer,
		reset        : reset
	}
};