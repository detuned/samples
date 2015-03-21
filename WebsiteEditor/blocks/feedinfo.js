(function( GridEditor ){
	/* Feedinfo Block  */
	GridEditor.HandlersRegistry.register({type	: 'feedinfo' }, {
		/** @type {jQuery} */
		$showDatesField : undefined,

		/** @type {new BaseBlockHandler()} */
		feedItemsBlock : undefined,
		render_view : function(){
			this._superMethod('render_view');
			/* this.setState('hide_dates', ! ! this.data.hide_dates) */
			if ( ! this.feedItemsBlock ){
				var blocks = GridEditor.searchBlocks( { type : 'feeditems' } );
				if ( blocks && blocks[0] ){
					this.feedItemsBlock = blocks[0];
				}
			}
			if ( this.feedItemsBlock ){
				this.feedItemsBlock.setState( 'hide_dates', this.data.attrs && ! ! this.data.attrs.hide_dates );
			}

		},

		preInitialize : function(){
			this.settings.cleanBtnRequired = true;
		},

		afterInitialize : function(){
			this.settings.titleFieldRequired = true;
			if ( ! this.data.attrs ){
				this.data.attrs = {};
			}
			this.data.attrs.hide_dates = this.hasState('hide_dates');
		},

		render_edit : function(){
			this._superMethod('render_edit');
			if (this.$submitBlock){
				this.$showDatesField = $([
					'<div class="feed-items-show-dates ' , this.settings.displayInEditStateOnlyClass , '">',
					'<label>',
					'<input type="checkbox" name="attrs--show_dates" />',
					'<span>' , _( 'editor:block.feedinfo.show_dates' ) , '</span>',
					'</label>',
					'<em class="feed-items-show-dates-hint">',
					_( 'editor:block.feedinfo.show_dates.hint' ),
					'</em>',
					'</div>'
				].join('')).insertBefore(this.$submitBlock)
					.find('input');
				if ( this.data.attrs && this.data.attrs.hide_dates ){
					this.$showDatesField.removeAttr('checked');
				}
				else {
					this.$showDatesField.attr('checked', 'checked');
				}
			}
		},
		isDataEqual : function(data){
			return !! (data.body == this.data.body
				&& data.title == this.data.title
				&& (
				( this.data.attrs && data.attrs && data.attrs.show_dates == ! this.data.attrs.hide_dates )
					||
					( ! this.data.attrs && ! data.attrs )
				)
				);
		} ,
		processSaveRequestData : function(data){
			if ( data.attrs && typeof data.attrs.show_dates != 'undefined' ){
				data.attrs.hide_dates = !  data.attrs.show_dates;
				delete data.attrs.show_dates;
			}
			return data;
		}
	});
})( this.GridEditor );