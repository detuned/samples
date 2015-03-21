angular.module( 'index' )
	.service( 'mailService', [ '$window', '$document', function( $window, $document ){
		var mailService = {};

		/**
		 * Composes and returns mailto-url
		 * @param options
		 * @param {string} options.to - recipient
		 * @param {string} options.cc - copies
		 * @param {string} options.bcc - hidden copies
		 * @param {string} options.subject - mail's subject
		 * @param {string} options.body - mail's body
		 * @return {string} url
		 */
		mailService.getMailToUrl = function( options ){
			var
				link = [ 'mailto:' ],
				params = [];
			if( options.to ){
				link.push( $window.encodeURIComponent( options.to ) );
			}
			angular.forEach( _.omit( options, 'to' ), function( val, key ){
				params.push( key.toLocaleLowerCase() + '=' + $window.encodeURIComponent( val ) );
			} );
			if( params.length ){
				link.push( '?', params.join( '&' ) );
			}
			return link.join( '' );
		};

		mailService.mailTo = function( options ){
			var url = mailService.getMailToUrl( options );
			$window.location.href = url;
		};

		return mailService;
	}] );