angular.module( 'index' )
	.service( 'socialService', [ '$window', '$timeout', function( $window, $timeout ){
		var
			socialService = {},
			registry = [
				{
					id    : 'fb',
					title : 'Facebook',
					popup : {
						url    : 'http://www.facebook.com/sharer/sharer.php?u={url}',
						width  : 600,
						height : 500
					}
				},
				{
					id    : 'vk',
					title : 'VK',
					popup : {
						url    : 'http://vk.com/share.php?url={url}&title={title}',
						width  : 550,
						height : 330
					}
				},
				{
					id    : 'twitter',
					title : 'Twitter',
					popup : {
						url    : 'http://twitter.com/intent/tweet?url={url}&text={title}',
						width  : 600,
						height : 450
					}
				},
				{
					id    : 'gplus',
					title : 'Google+',
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
			popupUrl = _.template( network.popup.url, options, {interpolate: /\{(.+?)\}/g} );
			$timeout(function (){
				win = $window.open(
					popupUrl,
					'sl_' + network.id,
					'left=' + left + ',top=' + top + ',' +
						'width=' + network.popup.width + ',height=' + network.popup.height +
						',personalbar=0,toolbar=0,scrollbars=1,resizable=1'
				);
				if (win) {
					win.focus();
				}
			});
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