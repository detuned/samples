define( 'report/report', [ 'jquery', 'underscore', 'xcore', 'report/reportsRegistry', 'report/dataLoader', 'css!report/report.css' ], function( $, _, xcore, reportsRegistry, dataLoader ){

	function Widget( settings ){
		var
			element = settings.element,
			minErr = xcore.minErr( 'report' ),
			dataListener;
		if( ! element ){
			throw minErr( 'no element specified' );
		}

		settings = _.defaults(
			settings,
			_.omit( element.data(), 'widget' ),
			{
				showTitle : true
			}
		);

		var
			dom = xcore.Dom( 'report', element ),
			titleElement, vzElement, report, vz;

		if( ! settings.vz ){
			throw minErr( 'no vz specified' );
		}
		if( ! settings.counter && String( settings.counter ) !== '0' ){
			throw minErr( 'no counter specified' );
		}
		if( ! settings.report ){
			throw minErr( 'no report specified' );
		}
		if( ! ( report = reportsRegistry.getReport( settings.report ) ) ){
			throw minErr( 'unknown report ' + settings.report );
		}

		if( + settings.showTitle && report.showTitle !== false ){
			titleElement = dom
				.append( 'title' )
				.html( settings.title || report.title );
		}

		dom.mod( 'vz-' + settings.vz );
		vzElement = dom.append( 'vz', settings.vz );


		require(
			[ ['vz', settings.vz, settings.vz].join( '/' )  ], function( vzFabric ){
				var
					vzSettings = {},
					vzAttrs = _.omit( xcore.utils.getElementData( element, { namespace : 'vz' } ) );
				if( ! vzFabric.create ){
					throw minErr( 'vz has no create method' );
				}
				if( vzAttrs.settings ){
					try{
						eval( 'vzSettings=' + vzAttrs.settings );
					} catch( e ) {
						throw minErr( 'vz settings incorrect:' + vzAttrs.settings )
					}
				}
				vz = vzFabric.create( $.extend(
					{
						element : vzElement,
						skin    : settings.skin,
						title   : report.title
					},
					report.vz,
					vzSettings,
					_.omit( vzAttrs, 'settings' )
				) );
				init();
			},
			function(){
				throw minErr( 'vz ' + settings.vz + ' loading failed' );
			}
		);

		function render(){
			if( dataListener ){
				dataListener.unListen();
			}
			dataListener = dataLoader.listen(
				_.clone( settings ),
				function( data ){
					vz
						.setData( data )
						.render();
				} );
		}

		function init(){
			var update = _.debounce( function(){
				if( vz.resetData ){
					vz.resetData();
				}
				render();
			}, 200 );
			xcore.broadcaster.parseNotation( 'counter', settings.counter, function( value ){
				settings.counter = value;
				update();
			} );
		}

	}

	return {
		create : Widget
	};
} );