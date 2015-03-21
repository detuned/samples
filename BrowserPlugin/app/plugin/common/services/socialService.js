angular.module( 'plugin' )
	.service( 'socialService', [
		'$window',
		'$timeout',
		'utilsService',
		function( $window, $timeout, utilsService ){
			var
				socialService = {},
				registry = [
					{
						id    : 'fb',
						title : utilsService.l10n( 'facebook' ),
						popup : {
							url    : 'http://www.facebook.com/sharer/sharer.php?u={url}',
							width  : 600,
							height : 500
						}
					},
					{
						id    : 'vk',
						title : utilsService.l10n( 'vkontakte' ),
						popup : {
							url    : 'http://vk.com/share.php?url={url}&title={title}',
							width  : 550,
							height : 330
						}
					},
					{
						id    : 'twitter',
						title : utilsService.l10n( 'twitter' ),
						popup : {
							url    : 'http://twitter.com/intent/tweet?url={url}&text={title}',
							width  : 600,
							height : 450
						}
					},
					{
						id    : 'gplus',
						title : utilsService.l10n( 'google_plus' ),
						popup : {
							url    : 'https://plus.google.com/share?url={url}',
							width  : 700,
							height : 500
						}
					},
					{
						id    : 'google',
						title : utilsService.l10n( 'google' ),
						popup : {
							url    : 'https://plus.google.com/share?url={url}',
							width  : 700,
							height : 500
						}
					}
				],
				registryById = _.indexBy( registry, 'id' );

			socialService.share = function( options ){
				var left, top, network, win, popupUrl;

				options = _.defaults( options, {
					networkId : null,
					url       : null,
					title     : null
				} );
				if( ! options.networkId
					|| ! ( network = socialService.getNetwork( options.networkId ))
					|| ! options.url
					){
					return;
				}
				left = Math.round( $window.screen.width / 2 - network.popup.width / 2 );
				top = $window.screen.height > network.popup.height
					? Math.round( $window.screen.height / 3 - network.popup.height / 2 )
					: 0;
				popupUrl = _.template( network.popup.url, {interpolate : /\{(.+?)\}/g} )( options );
				console.info( options, popupUrl );
				$timeout( function(){
					win = $window.open(
						popupUrl,
						'sl_' + network.id,
						'left=' + left + ',top=' + top + ',' +
							'width=' + network.popup.width + ',height=' + network.popup.height +
							',personalbar=0,toolbar=0,scrollbars=1,resizable=1'
					);
					if( win ){
						win.focus();
					}
				} );
			};

			socialService.getAllNetworks = function(){
				return angular.copy( registry );
			};

			socialService.getNetwork = function( id ){
				return id && registryById[id]
					? angular.copy( registryById[id] )
					: null;
			};

			return socialService;
		}] );