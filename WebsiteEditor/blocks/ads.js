(function( GridEditor ){
	/* Adv blocks: links, context, siteinfo */
	var
		advBlockPrototype = {

			/** @type {jQuery} */
			$deleteBtn : undefined,

			afterInitialize : function(){
				var $this = this;
				this.setState( 'deletable' , true );
				this.$deleteBtn = $(['<span class="block-delete-btn">' , _( 'editor:action_delete' ) , '</span>'].join(''))
					.click(function(){
						$this._showMessage();
					})
					.appendTo(this.$block);
				this.$block.bind('click', function(/* Event */e){
					$this.onBlockClick(e);
				});
			},
			onBlockClick : function( /* Event */e ){
				var
					$target = $(e.target);
				if ($target.is('a, a *, span.link, .block-delete-btn')){
					return false;
				}
				this._showMessage();
			},
			_showMessage : function(){
				var
					url = Editor.getSiteTariffUrl();
				Editor.InfoMessage.show({
					html 	: [
						'<h2>' , _( 'editor:hide_ad_message.title' ) , '</h2>',
						url
							? _( 'editor:hide_ad_message.text_clickable' , htmlspecialchars(url) )
							: _( 'editor:hide_ad_message.text' )
					].join(''),
					type 	: 'info',
					time	: true,
					clear	: true
				})
			}
		};
	GridEditor.HandlersRegistry.register( { type : 'links' } , $.extend( {} , advBlockPrototype ) );

	GridEditor.HandlersRegistry.register( { type : 'context' } , $.extend( {} , advBlockPrototype ) );

	GridEditor.HandlersRegistry.register( { type : 'siteinfo' } , $.extend( {} , advBlockPrototype ) );

})( this.GridEditor );