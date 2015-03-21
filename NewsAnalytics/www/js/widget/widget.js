;
(function( global ){
	var
		settings = {
			host                           : 'domain.tld',
			url                            : '/widget',
			widgetName                     : 'rating',
			widgetContainerClass           : 'index-widget',
			widgetContainerClassPrefix     : 'index-widget_',
			widgetRegisteredContainerClass : 'index-widget_registered',
			widgetIframeNameBase           : 'index-widget-iframe-',
			widgetDefaultWidth             : 250,
			widgetDefaultLimit             : 5
		},
		globalId = 0,
		isRuntime;

	global.IndexWidget = global.IndexWidget || {};
	global.IndexWidget[ settings.widgetName ] = global.IndexWidget[ settings.widgetName ] || {};


	/**
	 * Finds not registered yet widgets and register them
	 * Could be fired as many times as we need
	 */
	function initNewWidgets(){
		var
			elements = document.getElementsByClassName( settings.widgetContainerClass ),
			element,
			widgetData;
		for( var i = 0; i < elements.length; i ++ ){
			element = elements[i];
			if( hasClass( element, settings.widgetRegisteredContainerClass ) ){
				continue;
			}
			element.className += ' ' + settings.widgetRegisteredContainerClass;
			widgetData = {
				limit        : element.getAttribute( 'data-limit' ),
				host         : element.getAttribute( 'data-host' ) || settings.host,
				domain       : element.getAttribute( 'data-domain' ),
				title        : element.getAttribute( 'data-title' ),
				period       : element.getAttribute( 'data-period' ),
				categories   : element.getAttribute( 'data-categories' ),
				sources      : element.getAttribute( 'data-sources' ),
				width        : element.getAttribute( 'data-width' ) || settings.widgetDefaultWidth,
				height       : element.getAttribute( 'data-height' ),
				borderColor  : element.getAttribute( 'data-border-color' ),
				borderWidth  : element.getAttribute( 'data-border-width' ),
				borderRadius : element.getAttribute( 'data-border-radius' ),
				design       : element.getAttribute( 'data-design' ),
				hideHeader   : element.getAttribute( 'data-no-header' ),
				directUrl    : element.getAttribute( 'data-direct' )
			};
			if( ! widgetData.height && ! widgetData.limit ){
				widgetData.limit = settings.widgetDefaultLimit;
			}
			element.innerHTML = '<iframe frameborder="0"' +
				' name="' + settings.widgetIframeNameBase + ( ++ globalId ) + '"' +
				' src="' + getIframeUrl( widgetData ) + '"' +
				' style="' +
				'width:' + widgetData.width + 'px;' +
				'height:' + ( widgetData.height || getIframeHeight( widgetData.limit, widgetData.hideHeader ) ) + 'px;' +
				(
					widgetData.borderColor
						? 'border:' + ( widgetData.borderWidth || 1 ) + 'px solid ' + widgetData.borderColor + ';'
						: 'border:none;'
					) +
				(
					widgetData.borderRadius
						? 'border-radius:' + widgetData.borderRadius + 'px;'
						: 'border-radius:none;'
					) +
				'"' +
				'></iframe>';
		}
	}

	function getIframeUrl( widgetData ){
		var
			params = [],
			keys = ['limit', 'period', 'domain', 'title', 'categories', 'sources', 'height', 'design' ];
		for( var i = 0; i < keys.length; i ++ ){
			if( widgetData[keys[i]] ){
				params.push( keys[i] + '=' + widgetData[ keys[i] ] );
			}
		}
		params.r = Math.random();
		if( widgetData.hideHeader ){
			params.push( 'no_header=1' );
		}
		if( widgetData.directUrl ){
			params.push( 'direct=1' );
		}
		return (
			global.location && 'https:' == global.location.protocol
				? 'https:'
				: 'http:'
			)
			+ '//' + widgetData.host
			+ settings.url + '/'
			+ ( params.length
			? '?' + params.join( '&' )
			: ''
			)
	}

	function getIframeHeight( limit, hideHeader ){
		return Math.max( 200, limit * 60 ) + 88 - ( hideHeader ? 75 : 0 );
	}

	if( ! document.getElementsByClassName ){
		document.getElementsByClassName = function( classname ){
			var
				elArray = [],
				tmp = document.getElementsByTagName( '*' ),
				regex = new RegExp( "(^|\\s)" + classname + "(\\s|$)" );
			for( var i = 0; i < tmp.length; i ++ ){
				if( regex.test( tmp[i].className ) ){
					elArray.push( tmp[i] );
				}
			}
			return elArray;
		};
	}
	function hasClass( element, cls ){
		return (' ' + element.className + ' ').indexOf( ' ' + cls + ' ' ) > - 1;
	}

	function contentLoaded( win, fn ){

		var done = false, top = true,
			doc = win.document, root = doc.documentElement,
			add = doc.addEventListener ? 'addEventListener' : 'attachEvent',
			rem = doc.addEventListener ? 'removeEventListener' : 'detachEvent',
			pre = doc.addEventListener ? '' : 'on',
			init = function( e ){
				if( e.type == 'readystatechange' && doc.readyState != 'complete' ) return;
				(e.type == 'load' ? win : doc)[rem]( pre + e.type, init, false );
				if( ! done && (done = true) ) fn.call( win, e.type || e );
			},
			poll = function(){
				try{ root.doScroll( 'left' ); } catch( e ) {
					setTimeout( poll, 50 );
					return;
				}
				init( 'poll' );
			};
		if( doc.readyState == 'complete' ){
			fn.call( win, 'lazy' );
		}
		else {
			if( doc.createEventObject && root.doScroll ){
				try{ top = ! win.frameElement; } catch( e ) { }
				if( top ) poll();
			}
			doc[add]( pre + 'DOMContentLoaded', init, false );
			doc[add]( pre + 'readystatechange', init, false );
			win[add]( pre + 'load', init, false );
		}
	}

	contentLoaded( global, initNewWidgets );

})( this );