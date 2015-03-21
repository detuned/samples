(function( GridEditor ){
	/* Albuminfo Block  */
	GridEditor.HandlersRegistry.register({type	: 'albuminfo' }, {
		afterInitialize : function(){
			var $this = this;
			this.settings.titleFieldRequired = true;
			this.$deleteBtn = $( [
				'<span class="block-delete-btn">' ,
				_( 'editor:action_delete' ) ,
				'</span>'
			].join('') )
				.click(function(){
					$this.deleteBlock();
				})
				.appendTo(this.$block);
		},
		deleteBlock : function(_params){
			var
				$this = this,
				params = (function(){
					var
						_p = {
							newCheckpoint	: true,
							updateData		: true,
							url				: $this.settings.saveUrl,
							data 			: {
								block_id 	: $this.settings.id,
								location	: Editor.getPageUri(),
								data		: undefined
							},
							success : function(res){}
						};
					_params && $.extend(true, _p, _params);
					if (!_p.data.data){
						_p.data.data = {};
					}
					return _p;
				})();
			if (this.settings.feedItemId){
				params.data.data.id = this.settings.feedItemId;
			}
			params.data.data.action = 'delete';
			params.data.data = $.toJSON(params.data.data);
			$.request({
				url			: params.url,
				data		: params.data,
				dataType	: 'json',
				type		: 'POST',
				success		: function(res){
					var
						showMessage = function(){
							Editor.InfoMessage.show({
								html 	: _( 'editor:block_was_removed' ,
									$this.data.title
										? '&laquo;' + $this.data.title + '&raquo;'
										: ''
								),
								time	: true,
								clear	: true,
								actions : {
									undo : function(/* Editor.InfoMessage */im){
										im.hide({
											clear : true
										});
										return false;
									}
								}
							});
						}
					Editor.moveTo(GridEditor.getParentPage());
					showMessage();
					params.success(res);
				}
			});
		}
	});
})( this.GridEditor );