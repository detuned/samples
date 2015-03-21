(function( GridEditor ){
	/* Feed block (feed presentation on other pages) */
	GridEditor.HandlersRegistry.register( {type : 'feedimg' }, {
		/** @type {Object} */
		data            : {
			/** @type {String} */
			title         : undefined,
			/** @type {String} */
			text          : undefined,
			/** @type {String} */
			view_variant  : undefined,
			/** @type {String[]} */
			view_variants : [],
			/** @type {String[]} */
			feed_entity   : undefined,
			/** @type {Object[]} */
			feed_entities : []
		},
		/**
		 * Container to view feed
		 * @type {jQuery}
		 */
		$feedItems      : undefined,
		/**
		 * Container to setup feed
		 * @type {jQuery}
		 */
		$feedEdit       : undefined,
		preInitialize   : function(){
			this.settings.titleFieldRequired = true;
			this.settings.textFieldRequired = true;
			this.settings.cleanBtnRequired = true;
		},
		afterInitialize : function(){
			this.$feedItems = this.$content.find( '>.feed-items' );
		},
		isDataEqual     : function( data ){
			return ! ! (
				data.body == this.data.body
					&& data.title != this.data.title
					&& data.view_variant != this.data.view_variant
					&& data.feed_entity != this.data.feed_entity
				);
		},

		processFormData : function( data ){
			var
				res = $.extend( {}, data );
			delete
				res.feed_entities,
				res.view_variants;
			return res;
		},
		render_edit     : function(){
			var
				$this = this,
				fieldPostfix = '-' + this._globalId;
			;
			this._superMethod( 'render_edit' );
			this.$feedItems.hide();
			this.$feedEdit = $( '<div class="feed-edit"/>' )
				.html( [
					'<h3 class="feed-edit-title">',
					_( 'editor:block.feedimg.setup_title' ),
					'</h3>',
					'<dl class="form-field form-field-inline">',
					(function(){
						return $.isArray( $this.data.feed_entities ) && $this.data.feed_entities.length
							? ['<dt>',
							'<label for="feed-edit-content_type' , fieldPostfix  , '"> ',
							_( 'editor:block.feedimg.content_type' ),
							'</label>',
							'</dt>',
							'<dd>',
							'<select name="feed_entity" id="feed-edit-feed_entity' , fieldPostfix , '"' , $this.data.feed_entities.length == 1 ? ' disabled="disabled"' : '' , '>',
							(function(){
								var
									res = [],
									_entity;
								for( var i = 0, l = $this.data.feed_entities.length; i < l; i ++ ){
									_entity = $this.data.feed_entities[i];
									res.push(
										'<option value="', htmlspecialchars( _entity.id ), '"',
										(
											_entity.id == $this.data.feed_entity
												? ' selected="selected"'
												: ''
											)
										, '>',
										_entity.title || '&mdash;',
										'</option>' );
								}
								return res.join( '' );
							})(),
							'</select>',
							'</dd>'].join( '' )
							: '';
					})(),
					'</dl>',
					'<dl class="form-field form-field-inline">',
					(function(){
						return $.isArray( $this.data.view_variants ) && $this.data.view_variants.length
							? ['<dt>',
							'<label for="feed-edit-view-variant' , fieldPostfix  , '">',
							_( 'editor:block.feedimg.view_variant' ),
							'</label>',
							'</dt>',
							'<dd>',
							'<ul class="feed-view-types-list">',
							(function(){
								var
									res = [],
									_variant;
								for( var i = 0, l = $this.data.view_variants.length; i < l; i ++ ){
									_variant = $this.data.view_variants[i];
									res.push(
										'<li class="feed-view-types-list-item-', _variant, '">',
										'<input type="radio" name="view_variant" id="feed-view-variant-', htmlspecialchars( _variant ), fieldPostfix, '" value="', _variant, '"',
										(_variant == $this.data.view_variant
											? ' checked="checked"'
											: ''), ' />',
										'<label for="feed-view-variant-', htmlspecialchars( _variant ), fieldPostfix, '">',
										'<span class="textual-label">',
										_variant,
										'</span>',
										'<span class="visual-label"></span>',
										'</label>',
										'</li>' );
								}
								return res.join( '' );
							})(),
							'</ul>',
							'</dd>'].join( '' )
							: ''
					})(),
					'</dl>'
				].join( '' ) )
				.appendTo( this.$content );
		},
		render_view     : function(){
			this._superMethod( 'render_view' );
			this.$feedEdit.remove();
			this.$feedItems.show();
			if( this.data.view_variants && this.data.view_variants.length ){
				for( var i = 0, l = this.data.view_variants.length; i < l; i ++ ){
					this.$block.toggleClass(
						'block-feed-view-variant-' + this.data.view_variants[i],
						this.data.view_variants[i] == this.data.view_variant
					);
				}
			}
		},
		onSave          : function( res ){
			var
				$this = this,
				/** @type {jQuery} */
					$el;
			if( res.html && ( $el = $( res.html ).find( '.feed-items' ) ) && $el.length ){
				$this.$feedItems.html( $el.html() );
				$el.remove();
			}
		}
	} );
})( this.GridEditor );