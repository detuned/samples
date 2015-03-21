define( 'vz/counter/counter', [ 'jquery', 'underscore', 'xcore', 'css!vz/counter/counter.css?' + Math.round( Math.random()*10E8 ) ], function( $, _, xcore ){
	function Widget( settings ){
		var
			element = settings.element,
			minErr = xcore.minErr( 'vz-counter' ),
			widget = {},
			subAttributes = [],
			dom, data, coreElement, valueElement, captionElement, subsElement;

		if( ! element ){
			throw minErr( 'no element specified' );
		}

		settings = _.defaults( settings, {
			height        : 300,
			attribute     : 0,
			subAttributes : '1,2',
			caption       : '',
			skin          : '',

			animate : true
		} );

		element.height( settings.height );
		dom = xcore.Dom( 'vz-counter', element );
		if( settings.skin ){
			dom.mod( 'skin-' + settings.skin, true );
		}


		valueElement = dom.appendTo( 'core', 'value' );
		captionElement = dom.appendTo( 'core', 'caption' );
		subsElement = dom.append( 'subs' );

		if( settings.subAttributes ){
			subAttributes = _.map( xcore.utils.parseCsvString( settings.subAttributes ), function( index ){
					var
						element = dom.appendTo( 'subs', 'sub-' + index ).addClass( dom.childClass( 'sub' ) ),
						caption = xcore.utils.parseCsvString(
							( 'caption_' + index ) in settings
								? settings[ 'caption_' + index ]
								: settings.caption
						);
					if( caption && caption.length == 1 ){
						caption = caption[0];
					}
					return {
						index          : index,
						valueElement   : dom.appendTo( 'sub-' + index, 'value-' + index ).addClass( dom.childClass( 'subvalue' ) ),
						captionElement : dom.appendTo( 'sub-' + index, 'caption-' + index ).addClass( dom.childClass( 'subcaption' ) ),
						caption        : caption
					}
				}
			);
		}

		widget.setData = function( newData ){
			if( newData && newData[0] && newData[0].Rs ){
				data = {
					time   : newData[0].Ts,
					value  : newData[0].Rs[ + settings.attribute ].Count,
					values : _.pluck( newData[0].Rs, 'Count' )
				}
			}
			return widget;
		};

		widget.render = function(){
			var
				prevValue = Number( valueElement.text().replace( /[^0-9]+/, '' ) ) || 0,
				value = data.value;
			if( + settings.animate ){
				countTo( valueElement, {
					from      : prevValue,
					to        : value,
					formatter : _.partial( xcore.utils.numberFormat, _, ' ' )
				} );
			}
			else {
				valueElement.html( xcore.utils.numberFormat( v ) );
			}
			captionElement.html(
				xcore.utils.plural(
					value,
					xcore.utils.parseCsvString( settings['caption_' + settings.attribute] || settings.caption ),
					true
				)
			);

			if( subAttributes.length ){
				_.each( subAttributes, function( attr ){
					var
						value = data.values[ attr.index ];

					attr.valueElement.html( xcore.utils.numberFormat( value ) );

					if( attr.caption ){
						attr.captionElement.html(
							_.isArray( attr.caption )
								? xcore.utils.plural( value, attr.caption, true )
								: attr.caption
						);
					}
				} );
			}
			return widget;
		};


		return widget;
	}

	function countTo( el, options ){
		options = _.defaults( options || {}, {
			from            : 0,  // the number the element should start at
			to              : 1,  // the number the element should end at
			speed           : 500,  // how long it should take to count between the target numbers
			refreshInterval : 50,  // how often the element should be updated
			decimals        : 0,  // the number of decimal places to show
			formatter       : function( v ){ return v },
			onUpdate        : function(){},  // callback method for every time the element is updated,
			onComplete      : function(){}  // callback method for when the element finishes updating
		} );

		// how many times to update the value, and how much to increment the value on each update
		var
			loops = Math.ceil( options.speed / options.refreshInterval ),
			increment = (options.to - options.from) / loops;

		el.each( function(){
			var
				that = this,
				loopCount = 0,
				value = options.from,
				interval = setInterval( updateTimer, options.refreshInterval );

			function updateTimer(){
				value += increment;
				loopCount ++;
				$( that ).html( options.formatter( value.toFixed( options.decimals ) ) );
				options.onUpdate.call( that, value );
				if( loopCount >= loops ){
					clearInterval( interval );
					value = options.to;
					options.onComplete.call( that, value );
				}
			}
		} );
	}

	return {
		create : Widget
	}
} );