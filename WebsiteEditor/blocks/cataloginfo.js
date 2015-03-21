(function( GridEditor ){
	/* Cataloginfo Block */
	GridEditor.HandlersRegistry.register( {type : 'cataloginfo'}, {

		/** @type {jQuery} */
		$sortFieldWrap : undefined,

		preInitialize : function(){
			this.settings.cleanBtnRequired = true;
		},

		afterInitialize : function(){
			this.settings._sortsAvailable = [
				{ title : _( 'editor:block.cataloginfo.sort_by_title' ), value : 'title'    },
				{ title : _( 'editor:block.cataloginfo.sort_by_price' ), value : 'price'    },
				{ title : _( 'editor:block.cataloginfo.sort_by_price_desc' ), value : '-price'    }
			]
		},

		render_edit : function(){
			var $this = this;
			this._superMethod( 'render_edit' );
			this.$sortFieldWrap = $( [
				'<div class="catalog-sort-field-wrap">',
				'<label>',
				'<span>' , _( 'editor:block.cataloginfo.sort' ) , '</span>',
				'<select name="attrs--sort" class="catalog-sort-field">',
				(function(){
					var
						html = [],
						_sort;

					for( var i = 0, l = $this.settings._sortsAvailable.length; i < l; i ++ ){
						_sort = $this.settings._sortsAvailable[ i ];
						html.push( '<option value="', _sort.value, '">', _sort.title, '</option>' );
					}

					return html.join( '' );
				})(),
				'</select>',
				'</label>',
				'</div>'].join( '' ) )
				.appendTo( $this.$content );
			if( this.data.attrs.sort ){
				this.$sortFieldWrap.find( 'select' ).val( this.data.attrs.sort );
			}
		},

		onSave : function( res, prevData ){
			if( ! prevData.attrs || prevData.attrs.sort != this.data.attrs.sort ){
				Editor.refresh();
			}
		},

		isDataEqual : function( data ){
			return ! ! (data.body == this.data.body
				&& data.title == this.data.title
				&& (
				( this.data.attrs && data['attrs--sort'] && data['attrs--sort'] == this.data.attrs.sort )
					||
					( ! this.data.attrs && ! data['attrs--sort'] )
				)
				);
		},

		getSuccessSaveMessage : function( saveRes ){
			var prevData = this.getCheckpoint();
			return [
				'<p>',
				this.data.title
					? _( 'editor:block_save_success', this.data.title )
					: _( 'editor:block_save_success.unknown' )
					( this.data.title
						? '&laquo;' + this.data.title + '&raquo;'
						: ''
					),
				'</p>',
				( ! prevData.attrs || prevData.attrs.sort != this.data.attrs.sort )
					? ''
					: [
					'<a class="action action-undo">' ,
					_( 'editor:action_cancel' ) ,
					'</a>'
				].join( '' )
			].join( '' )
		},

		render_view : function(){
			this._superMethod( 'render_view' );
			this.$sortFieldWrap && this.$sortFieldWrap.remove();
		}

	} )

})( this.GridEditor );