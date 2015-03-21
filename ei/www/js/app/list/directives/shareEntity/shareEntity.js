angular.module( 'index' )
	.directive( 'shareEntity', [
		'configService',
		'listService',
		'socialService',
		'utilsService',
		function( configService, listService, socialService, utilsService ){
			return {
				scope       : {
					entity : '='
				},
				replace     : true,
				templateUrl : function( tElement, tAttrs ){
					return configService.enableSharing
						? configService._getUrl( '//APP/list/directives/shareEntity/shareEntity.html' )
						: configService._getUrl( '//APP/list/directives/shareEntity/shareEntityEmpty.html' )
				},
				link        : function( scope, element, attrs ){
					if( ! configService.enableSharing ){
						return;
					}

					scope.shareNetworks = _.chain( utilsService.parseCsvString( configService.shareNetworks ) )
						.map( function( id ){
							return socialService.getNetwork( id );
						} )
						.compact()
						.value();

					scope.entityShareSocial = function( entity, networkId ){
						socialService.share( {
							networkId : networkId,
							url       : listService.getShareUrl( entity ),
							title     : listService.getShareTitle( entity )
						} );
					};

					scope.entityShareMail = function( entity, $event ){
						if( $event ){
							$event.stopPropagation();
							$event.preventDefault();
						}
						listService.mailShare( entity );
					};

					scope.entityShareLink = function( entity, $event ){
						if( $event ){
							$event.stopPropagation();
							$event.preventDefault();
						}
						var
							entityActiveClass = 'entity_linkable',
							targetElement = angular.element( $event.target ),
							entityElement = targetElement.closest( '[role="list-entity"]' ),
							holderElement = entityElement.find( '[role="link-field-holder"]' ),
							fieldElement = entityElement.find( '[role="link-field"]' );
					};
				}
			}

		}] );