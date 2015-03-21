(function( GridEditor ){
	/* Gallery Item block (album on gallery title page) */
	GridEditor.HandlersRegistry.register( {type : 'galleryitem' }, {

		afterInitialize : function(){
			var $this = this;
			$.extend( this.settings, {
				titleFieldRequired : true
			} );
			this.$deleteBtn = $( [
				'<span class="block-delete-btn">' ,
				_( 'editor:action_delete' ) ,
				'</span>'
			].join( '' ) )
				.click( function(){
					$this.deleteBlock();
				} )
				.appendTo( this.$block );
		},

		getLoadRequestData : function(){
			var
				$this = this,
				data = this._superMethod( 'getLoadRequestData' );
			data.data = $.toJSON(
				$this.settings.galleryItemId
					? { id : $this.settings.galleryItemId }
					: {}
			);
			return data;
		},

		deleteBlock : function( _params ){
			//TODO

			return false;
			var
				$this = this,
				params = (function(){
					var
						_p = {
							newCheckpoint : true,
							updateData    : true,
							url           : $this.settings.saveUrl,
							data          : {
								block_id : $this.settings.id,
								location : Editor.getPageUri(),
								data     : undefined
							},
							success       : function( res ){}
						};
					_params && $.extend( true, _p, _params );
					if( ! _p.data.data ){
						_p.data.data = $.extend( {}, $this.data );
					}
					return _p;
				})();
			if( this.settings.feedItemId ){
				params.data.data.id = this.settings.feedItemId;
			}
			params.data.data.action = 'delete';
			params.data.data = $.toJSON( params.data.data );
			$.ajax( {
				url      : params.url,
				data     : params.data,
				dataType : 'json',
				type     : 'POST',
				success  : function( res ){
					var
						showMessage = function(){
							Editor.InfoMessage.show( {
								html    : _( 'editor:block_was_removed',
									$this.data.title
										? '&laquo;' + $this.data.title + '&raquo;'
										: ''
								),
								time    : true,
								clear   : true,
								actions : {
									undo : function( /* Editor.InfoMessage */im ){
										//								$this.undo();
										im.hide( {
											clear : true
										} );
										return false;
									}
								}
							} );
						}
					if( $this.hasState( 'standalone' ) ){
						Editor.moveTo( GridEditor.getParentPage() );
					}
					else {
						$this.$block.slideUp( 500, function(){
							$( this ).remove();
						} );
					}
					showMessage();
					params.success( res );
				}
			} );
		}

	} );
})( this.GridEditor );