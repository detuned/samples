angular.module( 'index' )
	.directive( 'asideFeed', [
		'$compile',
		'configService',
		function( $compile, configService ){
			return {
				templateUrl : configService._getUrl( '//APP/aside/directives/asideFeed/asideFeed.html' ),
				replace     : true,
				link        : function( scope, element, attrs ){
					var
						blocksElement = element.find( '[role="blocks"]' ),

						blocks = [
							{
								type : 'domain-chart',
								data : {}
							},
							{
								type : 'partners',
								data : {}
							}
						];

					function renderBlocks(){
						$compile( blocksElement.html( _.map( blocks,function( block ){
							return '<div' +
								' data-aside-block-' + block.type + '' +
								( block.data
									? ( ' data-aside-block-data=\'' + angular.toJson( block.data ) + '\'' )
									: '' ) +
								'></div>';
						} ).join( '' ) ).contents() )( scope );

					}

					renderBlocks();

				}
			}
		}] );