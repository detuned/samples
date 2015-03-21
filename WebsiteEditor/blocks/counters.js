(function( GridEditor ){
	/* Counters */
	GridEditor.HandlersRegistry.register( {type : 'counters' }, {
		afterInitialize : function(){
			this.settings.titleFieldType = '';
			this.settings.textFieldType = '';
			this.settings.itemsNum = 3;
			this.data.counters = [];
		},

		_isNotEmptyCounter : function( counter ){
			return ! ! ( counter && counter.code );
		},

		render_edit : function(){
			var
				$this = this,
				appendItem = function( item, index ){
					var
						$item = $( [
							'<div class="counter-edit-item">',
							'<label>',
							'<span class="label">' ,
							_( 'editor:block.counters.counter_title_num', index ) ,
							'</span>',
							'<textarea name="counter-' , index , '" rows="2" cols="10" spellcheck="false">',
							$this._isNotEmptyCounter( item )
								? htmlspecialchars( item.code )
								: '',
							'</textarea>',
							'<div class="form-error-msg form-error-msg-field-counter-' , index  , ' hidden"></div>',
							'</label>',
							'</div>'
						].join( '' ) ).appendTo( $this.$text );
				};
			this._superMethod( 'render_edit' );
			this.$text.html( [
				'<div class="counter-edit-hint">',
				_( 'editor:block.counters.counter_edit_hint' ),
				'</div>'
			].join( '' ) );
			for( var i = 0; i < this.settings.itemsNum; i ++ ){
				appendItem( this.data.counters[i], i + 1 );
			}
			this.$text.find( 'textarea:visible:first' ).select();
		},

		render_view : function(){
			var
				html = [],
				item;
			this._superMethod( 'render_view' );
			for( var i = 0; i < this.settings.itemsNum; i ++ ){
				if( this._isNotEmptyCounter( item = this.data.counters[i] ) ){
					html.push(
						'<div class="block-type-counters-counter block-type-counters-counter-imitation block-type-counters-counter-service-', item.service, '" title="', _( 'editor:block.counters.counter_title', item.service ), '"></div> '
					);
				}
			}
			if( ! html.length ){
				html.push(
					'<div class="block-type-counters-counter block-type-counters-counter-virtual"></div>'
				);
			}
			this.$text.html( html.join( '' ) );
		},

		processFormData : function( fields ){
			var
				$this = this,
				counters = [],
				_p = [],
				_notEmptyNum = 0;
			$.isPlainObject( fields ) && $.each( fields, function( /* String */name ){
				var
					ind,
					_code;
				_p = name.split( '-' );
				if( _p[0] == 'counter' ){
					ind = Number( _p[1] );
					counters[ind - 1] = {
						code : ( _code = trimStr( this.toString(), " \n\r" ) )
					};
					_notEmptyNum += _code ? 1 : 0;
				}
			} );
			if( ! _notEmptyNum ){
				counters = [];
			}
			return {counters : counters};
		},

		isDataEqual           : function( data ){
			var res = true;
			if( data.counters && this.data.counters.length == data.counters.length ){
				for( var i = 0, l = data.counters.length; i < l; i ++ ){
					if( data.counters[i].code != this.data.counters[i].code ){
						res = false;
						break;
					}
				}
			}
			else {
				res = false;
			}
			return res;
		},
		getSuccessSaveMessage : function(){
			return [
				_( 'editor:block.counters.success_saved' ),
				(
					this.data.counters && this.data.counters.length
						? _( 'editor:block.counters.success_saved.hint' )
						: ''
					),
				'<a class="action action-undo">' ,
				_( 'editor:action_cancel' ) ,
				'</a>'
			].join( '' )
		},
		/**
		 * @param {Object}
		 * @param {DOMElement}
		 * @param {new FormValidator}
		 */
		onEditFormSubmit      : function( res, form, validator ){
			var $this = this;
			res = $this.processFormData( res );
			if( ! $this.isDataEqual( res ) ){
				$this.save( {
					data          : {
						data : res
					},
					newCheckpoint : true,
					updateData    : true,
					handleSuccess : function( saveRes ){
						if( $.isPlainObject( saveRes ) && ( ! saveRes.errors || ! saveRes.errors.length ) ){
							$this.setCheckpoint();
							$.extend( $this.data, saveRes );
						}
					},
					success       : function( saveRes ){
						var
							toFocus;
						if( saveRes.errors && saveRes.errors.length ){
							for( var i = 0, l = saveRes.errors.length; i < l; i ++ ){
								if( saveRes.errors[i] && saveRes.errors[i] !== null ){
									validator.fieldError(
										'counter-' + ( i + 1 ),
										undefined,
										{ 'msg' : saveRes.errors[i] }
									);
									if( ! toFocus ){
										toFocus = i + 1;
									}
								}
							}
							if( toFocus ){
								$( validator.form ).find( 'textarea[name=counter-' + toFocus + ']:first' ).focus();
								return;
							}
						}
						Editor.InfoMessage.show( {
							html    : $this.getSuccessSaveMessage(),
							time    : true,
							clear   : true,
							actions : {
								undo : function( /* Editor.InfoMessage */im ){
									$this.undo();
									im.hide( {
										clear : true
									} );
									return false;
								}
							}
						} );
						$this.toggleEditMode( false );
					}
				} );
			}
			else {
				$this.onSubmitWithNoChanges();
				$this.toggleEditMode( false );
			}
			return false;
		}
	} );
})( this.GridEditor );