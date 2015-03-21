(function( GridEditor ){

	/* Catalog Block  */
	GridEditor.HandlersRegistry.register( {type : 'catalog' }, {
		/** @type {jQuery} */
		$addItemArea         : undefined,
		/** @type {jQuery} */
		$addGroupBtn         : undefined,
		/** @type {jQuery} */
		$addItemBtn          : undefined,
		/** @type {jQuery} */
		$catalogControlsWrap : undefined,
		/** @type {jQuery} */
		$catalogCollection   : undefined,

		/**
		 * @return {jQuery}
		 */
		_getAllItemsContainers : function(){
			return this.$catalogCollection.find( 'div.catalog-collection-item' );
		},

		afterInitialize : function(){
			var
				$this = this;

			$.extend( this.settings, {
				addBusyClass    : 'feed-items-add-item-busy',
				itemIdBaseClass : 'catalog-collection-item-id-'
			} );


			this.setState( 'editable', false );

			this.$catalogCollection = this.$block.find( 'div.catalog-collection' );
			this.$catalogControlsWrap = $( '<div class="feed-items-controls cleared"/>' )
				.prependTo( this.$block );
			this.$addItemArea = $( '<div class="feed-items-add-item feed-items-add-item-split"/>' )
				.appendTo( this.$catalogControlsWrap );

			this.$addGroupBtn = $( [
				'<span class="feed-items-add-item-btn feed-items-add-item-btn-split  feed-items-add-item-btn-split-l">' ,
				_( 'editor:block.catalog.add_group' ),
				'<span class="feed-items-add-item-btn-r"></span></span>'
			].join( '' ) )
				.click( function( /* Event */e ){
					e.preventDefault();
					$this.addItem( {
						type  : CATALOG_TYPE_FOLDER,
						title : _( 'editor:block.catalog.new_group_title' )
					} );
				} )
				.appendTo( this.$addItemArea );
			this.$addItemBtn = $( [
				'<span class="feed-items-add-item-btn feed-items-add-item-btn-split  feed-items-add-item-btn-split-r">' ,
				_( 'editor:block.catalog.add_item' ),
				'<span class="feed-items-add-item-btn-r"></span></span>'
			].join( '' )
			)
				.click( function( /* Event */e ){
					e.preventDefault();
					$this.addItem( {
						type  : CATALOG_TYPE_ITEM,
						title : _( 'editor:block.catalog.new_item_title' )
					} );
				} )
				.appendTo( this.$addItemArea );


			/* XXX Do not handle blocks in list, only on ending pages because of smart server-side sorting  */
//			this._getAllItemsContainers().each(function(){
//				$this.handleFeedItemBlock($(this));
//				});

			/* ...and therefore force clean content of all items */
			this.cleanUpContent( this.$catalogCollection );
		},

		handleFeedItemBlock : function( $item ){
			var
				$this = this,
				engine,
				type = $item.searchInClass( 'catalog-collection-item-type-' );
			$item.addClass( 'block block-type-' + ( type == 'folder' ? 'catalogfolder' : 'catalogitem' ) );
			$item
				.find( '.catalog-collection-item-title' ).addClass( 'block-title' ).end()
				.find( '.catalog-collection-item-content' ).addClass( 'block-content' ).end()
				.find( '.catalog-collection-item-description' ).addClass( 'block-text' );
			engine = GridEditor.handleBlock( $item, {
				settings : {
					id         : $this.settings.id,
					feedItemId : $item.searchInClass( 'catalog-collection-item-id-' )
				}
			} );
			engine.feedItems = this;
			return engine;
		},

		saveOrder : function(){
			var
				$this = this,
				ordering = [],
				data = $this.getSaveRequestData();
			this._getAllItemsContainers().each( function(){
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
		addItem   : function( params ){
			var
				$this = this,
				data = this.getSaveRequestData(),
				_params = {
					title      : _( 'editor:block.catalog.new_item_title' ),
					text       : '',
					type       : CATALOG_TYPE_ITEM,
					autocreate : 1,
					parent_id  : $this.settings.catalogId
				};
			params && $.extend( _params, params );
			data.data = $.toJSON( _params );
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
					if( res && res.uri ){
						Editor.moveTo( res.uri );
						return;
					}
				},
				complete : function(){
					$this.$addItemArea.removeClass( $this.settings.addBusyClass );
				}
			} );
		}
	} );
})( this.GridEditor );