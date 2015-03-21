define( 'vz/table/table', [ 'jquery', 'underscore', 'xcore', 'handlebars', 'text!vz/table/table.html?' + Math.round( Math.random()*10E8 ), 'css!vz/table/table.css?' + Math.round( Math.random()*10E8 ) ], function( $, _, xcore, handlebars, html ){

	function Widget( settings ){
		var
			element = settings.element,
			minErr = xcore.minErr( 'vz-table' ),
			widget = {},
			template,
			dom, data, coreElement, tableElement, captionElement;

		if( ! element ){
			throw minErr( 'no element specified' );
		}

		settings = _.defaults( settings, {
			height    : 300,
			limit     : 10,
			attribute : 0,
			caption   : '',
			skin      : '',

			animate : true
		} );

		element.css( 'minHeight', settings.height );
		dom = xcore.Dom( 'vz-table', element );
		if( settings.skin ){
			dom.mod( 'skin-' + settings.skin, true );
		}

		tableElement = dom.appendTo( 'core', 'table-wrap' );

		handlebars.registerHelper( 'handleUrl', function ( value ){
			var url = xcore.utils.makeUrlClickable( value );

			return new handlebars.SafeString(
				xcore.utils.isClickableUrl( url )
					?  '<a href="' + xcore.utils.makeUrlClickable( value ) + '" target="_blank">' + xcore.utils.normalizeUrl( value ) + '</a>'
					: '<span>' + value + '</span>'
			);
		} );

		handlebars.registerHelper( 'numberFormat', function ( value ){
			return xcore.utils.numberFormat( value );
		} );

		widget.setData = function( newData ){
			if( newData && newData[0] && newData[0].Rs ){
				data = {
					time  : newData[0].Ts,
					items : newData[0].Rs
				}
				if ( settings.limit ){
					data.items = data.items.slice( 0, + settings.limit );
				}
			}
			return widget;
		};

		widget.render = function(){
			if( ! template ){
				template = handlebars.compile( html );
			}

			tableElement.html( template( data ) );
			return widget;
		};


		return widget;
	}


	return {
		create : Widget
	}
} );