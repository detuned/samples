(function( GridEditor ){
	/* Gallery Block  */
	GridEditor.HandlersRegistry.register( {type : 'gallery' }, {
		/** @type {jQuery} */
		$addItemArea         : undefined,
		/** @type {jQuery} */
		$addItemBtn          : undefined,
		/** @type {jQuery} */
		$galleryControlsWrap : undefined,
		/** @type {jQuery} */
		$galleryCollection   : undefined,

		/**
		 * @return {jQuery}
		 */
		_getAllAlbumsContainers : function(){
			return this.$galleryCollection.find( 'div.gallery-collection-item' );
		},

		afterInitialize : function(){
			var
				$this = this;

			$.extend( this.settings, {
				addBusyClass    : 'feed-items-add-item-busy',
				itemIdBaseClass : 'gallery-collection-item-id-'
			} );


			this.setState( 'editable', false );

			this.$galleryCollection = this.$block.find( 'div.gallery-collection' );
			this.$galleryControlsWrap = $( '<div class="feed-items-controls cleared"/>' )
				.prependTo( this.$block );
			this.$addItemArea = $( '<div class="feed-items-add-item"/>' )
				.appendTo( this.$galleryControlsWrap );

			this.$addItemBtn = $( [
				'<span class="feed-items-add-item-btn">' ,
				_( 'editor:block.gallery.add_album' ),
				'<span class="feed-items-add-item-btn-r"></span></span>'
			].join( '' ) )
				.click( function( /* Event */e ){
					e.preventDefault();
					$this.addItem();
				} )
				.appendTo( this.$addItemArea );

			this._getAllAlbumsContainers().each( function(){
				var
					$block = $( this ).addClass( 'block block-type-galleryitem' ),
					/** @type {jQuery} */
						$dragger = $( [
						'<span class="block-dragger" title="' ,
						_( 'editor:block.gallery.drag_hint' )
						, '"></span>'
					].join( '' ) )
						.appendTo( $block );
				/* Allowing item drag */
				$block.allowDrag( {
					useClone   : true,
					dragger    : 'span.block-dragger',
					onbegin    : function( clone ){
						var dragControl = $.data( $block, '_dragControl' );
						$block.addClass( 'projection' );
						$( clone ).addClass( 'banner-edit-item-dragging' );
						if( dragControl ){
							dragControl.setTrackAreas( [
								$block
									.siblings( 'div.block-type-galleryitem:visible:not(.projection)' ),
								function( /* jQuery */$area, /* Boolean */state, targetOffset, areaInfo ){
									var
										offset = $block.offset();
									if( state ){
										if(
											( areaInfo.offset.top > offset.top )
												|| ( areaInfo.offset.top == offset.top && areaInfo.offset.left > offset.left ) ){
											$area.after( $block );
										}
										else {
											$area.before( $block );
										}
									}
								}
							] );
						}
					},
					oncomplete : function(){
						$this.saveOrder();
						$block.removeClass( 'projection' );
					}
				} );
			} )
		},
		saveOrder       : function(){
			var
				$this = this,
				ordering = [],
				data = $this.getSaveRequestData();
			this._getAllAlbumsContainers().each( function(){
				var id = $( this ).searchInClass( $this.settings.itemIdBaseClass );
				if( id ){
					ordering.push( id );
				}
			} );
			data.data = $.toJSON( { ordering : ordering } );
			$.request( {
				type : 'POST',
				url  : $this.settings.saveOrderUrl,
				data : data
			} );
		},
		addItem         : function(){
			var
				$this = this,
				data = this.getSaveRequestData();
			data.data = $.toJSON( {
				title      : _( 'editor:block.gallery.new_album_title' ),
				text       : '',
				autocreate : 1
			} );
			if( $this.$addItemArea.hasClass( this.settings.addBusyClass ) ){
				/* Have started adding another item already */
				return;
			}
			this.$addItemArea.addClass( this.settings.addBusyClass );
			$.request( {
				url      : $this.settings.saveUrl,
				data     : data,
				dataType : 'json',
				type     : 'POST',
				success  : function( res ){
					if( ! res || ! res.id ){
						$this.displayErrorMessage();
						return;
					}
					Editor.moveTo( res.uri );
				},
				complete : function(){
					$this.$addItemArea.removeClass( $this.settings.addBusyClass );
				}
			} );
		}
	} );
})( this.GridEditor );