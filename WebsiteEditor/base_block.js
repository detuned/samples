(function( GridEditor ){
	var
		baseHandlerSettings = {
			maxCheckpoints              : 1,
			titleFieldType              : 'input',
			titleFieldUseWysiwyg        : false,
			titleFieldWysiwygSettings   : {},
			titleFieldRequired          : false,
			textFieldType               : 'textarea',
			textFieldUseWysiwyg         : true,
			textFieldWysiwygSettings    : {},
			textFieldRequired           : false,
			wysiwygPreservedClass       : 'wysiwyg-preserved',
			loadUrl                     : '/block/get/',
			saveUrl                     : '/block/set/',
			saveOrderUrl                : '/block/ordering-set',
			rotateUrl                   : '/block/rotate',
			id                          : undefined,
			displayInEditStateOnlyClass : 'display-when-block-has-state-edit',
			editBtnRequired             : true,
			cleanBtnRequired            : false,
			cleanUndoRequired           : true,
			cleanUndoTimeout            : 15000,
			overrideLinks               : true,
			ignoreBlockClickContainers  : [
				'a',
				'a *',
				'span.link',
				'.block-delete-btn',
				'.block-clean-btn',
				'.undo-block',
				'.undo-block *',
				'object',
				'embed'
			]
		};
	/**
	 * Constructor of base handler class
	 */
	function BaseBlockHandler( $block ){
		this.initialize.apply( this, arguments );
	};
	/**
	 * Body of base handler class
	 */
	BaseBlockHandler.prototype = {
		/**
		 * Block id in global registry of all initialized engines
		 * @type {Number}
		 */
		_globalId    : undefined,
		/**
		 *    Block type
		 *  @type {String}
		 */
		_type        : undefined,
		/** @type {Object} */
		data         : {
			/** @type {String} */
			title : undefined,
			/** @type {String} */
			text  : undefined,
			/** @type {String} */
			img   : undefined,
			/** @type {String} */
			uri   : undefined
		},
		/** @type {Object} */
		settings     : baseHandlerSettings,
		/**
		 * Hash of all block states at the moment
		 * @type {Object} */
		states       : {},
		/**
		 * Saved datas of block
		 * @type {Array} */
		checkPoints  : [],
		/** @type {jQuery} */
		$block       : undefined,
		/** @type {jQuery} */
		$title       : undefined,
		/** @type {jQuery} */
		$content     : undefined,
		/** @type {jQuery} */
		$text        : undefined,
		/** @type {jQuery} */
		$textField   : undefined,
		/** @type {jQuery} */
		$titleField  : undefined,
		/** @type {jQuery} */
		$form        : undefined,
		/** @type {jQuery} */
		$submitBlock : undefined,

		/** @type {jQuery} */
		$editBtn      : undefined,
		/** @type {jQuery} */
		$cleanBtn     : undefined,
		/** @type {jQuery} */
		$cleanUndoMsg : undefined,

		/** @type {jQuery} */
		$overlay : undefined,

		/** @type {jQuery} */
		$loader : undefined,

		/**
		 * Runs at start of any handler
		 * @param {jQuery} Block container
		 */
		initialize : function( $block, _params ){
			var
				$this = this,
				params = {
					/** @type {Number} */
					globalId : undefined,
					/** @type {String} */
					type     : undefined,
					/** @type {Object} */
					settings : {}
				};
			_params && $.extend( params, _params );

			if( ! isNaN( params.globalId ) ){
				this._globalId = params.globalId;
			}
			if( params.type ){
				this._type = params.type;
			}

			this.states = {};
			this.data = {};
			this.checkPoints = [];
			this.settings = $.extend( {}, baseHandlerSettings, params.settings );

			this.preInitialize();

			this.handleBlockContainer( $block );

			this.afterInitialize();
		},

		handleBlockContainer : function( $block ){
			var $this = this;
			this.$block = $block;
			this.$title = this.$block.find( '.block-title:first' );
			this.$content = this.$block.find( '.block-content:first' );
			this.$text = this.$block.find( '.block-text:first' ).addClass( 'block-type-' + this._type + '-text' );

			/* Reading settings & states from class */
			;
			(function(){
				var
					parts = $this.$block.attr( 'class' ).toString().split( ' ' ),
					/** @type {Array} */
						_p, _name, _val;
				for( var i = 0, l = parts.length; i < l; i ++ ){
					_p = parts[i].split( '-' );
					if( _p.length > 1 && _p[0] == 'block' ){
						_name = _p[1];
						_val = _p.slice( 2, _p.length ).join( '-' );
						if( _name == 'state' ){
							$this.setState( _val, true );
						}
						else {
							$this.settings[_name] = _val;
						}
					}
				}
			})();

			if( ! this.hasState( 'readonly' ) ){
				this.setState( 'editable' );
				this.settings.editBtnRequired
				&& ( this.$editBtn = $( [
					'<span class="block-edit-btn">' ,
					_( 'editor:block_button.edit' ),
					'</span>'
				].join( '' ) ).appendTo( this.$block ) );

				if( this.settings.cleanBtnRequired ){
					this.setState( 'cleanable' );
					this.$cleanBtn = $( [
						'<span class="block-clean-btn">' ,
						_( 'editor:block_button.clean' ),
						'</span>'
					].join( '' ) )
						.bind( 'click', function(){
							$this.clean();
						} )
						.appendTo( this.$block );
				}
			}

			this.cleanUpContent();
			this.bindEvents();
		},


		/**
		 * Binds extendable methods to base events
		 */
		bindEvents : function(){
			var $this = this;
			if( this.hasState( 'editable' ) ){
				this.$block.bind( 'click', function( /* Event */e ){
					$this.onBlockClick( e );
				} );
			}
		},

		/**
		 * Handles event click anywhere on block
		 * @param {Event}
		 */
		onBlockClick : function( /* Event */e ){
			var
				$target = $( e.target );
			if( $target.is( this.settings.ignoreBlockClickContainers.join( ',' ) ) ){
				return false;
			}
			else if( ! this.hasState( 'edit' ) && this.hasState( 'editable' ) ){
				this.toggleEditMode( true );
			}
		},

		/**
		 * Binds any free event(s) to block
		 * Using jQuery's <code>bind</code> function syntax
		 */
		bind : function(){
			this.$block.bind.apply( this.$block, arguments );
		},

		/**
		 * Unbinds any free event(s) to block
		 * Using jQuery's <code>unbind</code> function syntax
		 */
		unbind : function(){
			this.$block.unbind.apply( this.$block, arguments );
		},

		/**
		 * Sends any free event(s) to all listeners
		 */
		triggerEvent : function( event, eventData ){
			this.$block.triggerHandler( event, [eventData] );
		},

		/**
		 * Main method for composing block view
		 * Renders required areas based on current state values
		 */
		render      : function(){
			if( this.hasState( 'edit' ) ){
				this.render_edit();
			}
			else {
				this.render_view();
			}
		},
		/**
		 * Renders block at 'view' state
		 */
		render_view : function(){
			/* Switching OFF edit mode */
			this.$title.html(
				this.data.uri && this.data.title
					? '<a href="' + this.data.uri + '">' + this.data.title + '</a>'
					: this.data.title || ''
			);
			this.$text.html( this.data.body );
			if( this.$form ){
				this.$form.contents().unwrap( 'form' );
				this.$form = undefined;
			}
			this.$block.find( '.' + this.settings.displayInEditStateOnlyClass ).remove();
			if( this.$submitBlock ){
				this.$submitBlock.remove();
				this.$submitBlock = undefined;
			}
			this.cleanUpContent();
		},

		/**
		 * Renders block at 'edit' state
		 */
		render_edit : function(){
			var
				$this = this,
				titleCss,
				textCss;

			/* Switching ON edit mode */
			if( this.settings.titleFieldRequired && (! this.$title || ! this.$title.length) ){
				this.$title = $( '<h2 class="block-title"/>' )
					.prependTo( this.$block );
			}
			if( this.settings.textFieldRequired && (! this.$text || ! this.$text.length) ){
				this.$text = $( '<div class="block-text block-type-' + this._type + '-text"/>' )
					.prependTo( this.$content );
			}
			if( ! this.$form || ! this.$form.length ){
				this.$block.wrapInner( '<form class="block-form" method="post" action="" />' );
				this.$form = this.$block.find( '>form' );
				this.$form
					.delegate( 'span.link-cancel', 'click', function( e ){
						$this.toggleEditMode( false );
						e.stopPropagation();
					} )

					.validate( {
						updateFieldsOnSubmit : true,
						onsubmit             : function( res, form, validator ){
							$this.onEditFormSubmit( res, form, validator );
							return false;
						}
					} );
			}

			if( this.settings.textFieldType ){
				$this.showLoader();
				this.setTextField();
			}
			if( this.settings.titleFieldType ){
				this.$titleField = editField( this.$title, {
					name            : 'title',
					placeholder     : _( 'editor:block_title_placeholder' ),
					type            : $this.settings.titleFieldType,
					content         : $this.data.title,
					useWysiwyg      : $this.settings.titleFieldUseWysiwyg,
					wysiwygSettings : $this.settings.titleFieldWysiwygSettings
				} );
			}

			if( ! this.$submitBlock || ! this.$submitBlock.length ){
				this.$submitBlock = $( [
					'<div class="edit-submit">',
					'<button type="submit">' ,
					_( 'editor:action_save' ) ,
					'</button>',
					'<span class="link pseudo-link link-cancel">' ,
					_( 'editor:action_cancel' ) ,
					'</span>',
					'</div>'
				].join( '' ) ).appendTo( this.$form );
			}
			/* Dont know why but this is broking correct focus setting in Chrome:   */
//			(this.$titleField && this.$titleField.focus().length)
//				|| (this.$textField && this.$textField.focus());
			if( ! this.$textField && this.$titleField && this.$titleField.length ){
				this.$titleField.focus();
			}

		},

		setTextField : function( _params ){
			var $this = this;

			$this.$textField = editField( $this.$text, $.extend( {}, {
				name            : 'body',
				type            : $this.settings.textFieldType,
				content         : $this.data.body,
				useWysiwyg      : $this.settings.textFieldUseWysiwyg,
				wysiwygSettings : $this.settings.textFieldWysiwygSettings,
				onInit          : function( editor ){
					if( $this.$titleField ){
						$this.$titleField.focus();
					}
					else if( editor && editor.focus ){
						editor.focus();
					}
					else if( $this.$textField ){
						$this.$textField.focus();
					}
					$this.hideLoader();
				}
			}, _params || {} ) );
		},

		/**
		 * @param {jQuery} Container to clean its content. Uses this.$content as default
		 */
		cleanUpContent : function( $c ){
			var
				$this = this,
				baseHost = Editor.getDomain(),
				publishedHost = Editor.getSiteUrl();

			if( ! $c ){
				$c = this.$content;
			}
			/* Overriding links */
			if( this.settings.overrideLinks ){
				$c.find( 'a' ).each( function(){
					var
						href = $( this ).attr( 'href' ),
						v, vp;
					if( ! href || href.indexOf( '/file/link/' ) + 1 || href.indexOf( 'javascript:' ) + 1 || href.indexOf( 'mailto:' ) + 1 ){
						return;
					}
					v = href.match( new RegExp( '^(' + [ '/', baseHost , publishedHost ].join( '|' ) + ')(.+)?$' ), '' );
					if( v && v[1] ){
						vp = String( v[2] || '' ).split( '#' );
						href = [ baseHost , (
							! vp[0] && vp[1]
								? vp[1]
								: vp[0]
							) ].join( '#' );
						$( this ).attr( 'href', href );
					}
				} )
			}
		},

		getCleanedData : function(){
			return {
				body  : '',
				title : ''
			}
		},

		clean : function(){
			var $this = this;
			this.load( {
				success : function(){
					var
						cleanedData = $this.getCleanedData(),
						removeUndoMsg = function(){
							if( $this.$cleanUndoMsg ){
								$this.$cleanUndoMsg.remove()
								$this.$cleanUndoMsg = undefined;
								$undoProgressBar.stop();
							}
							$this.setState( 'undomsg', false );
							Editor.InfoMessage.hide( { clear : true } );
							return false;
						},
						undo = function(){
							$this.undo();
							removeUndoMsg();
							return false;
						},
						/** @type {jQuery} */
							$undoProgressBar,
						/** @type {Number} */
							timer;
					if( ! $this.isDataEqual( cleanedData ) ){
						$this.save( {
							data          : {
								data : cleanedData
							},
							newCheckpoint : true,
							updateData    : true,
							success       : function( saveRes ){
								Editor.InfoMessage.show( {
									html    : $this.getSuccessCleanMessage( saveRes ),
									time    : true,
									clear   : true,
									actions : {
										undo : undo
									}
								} );
								$this.render();
								if( $this.settings.cleanUndoRequired ){
									$this.setState( 'undomsg', true );
									$this.$cleanUndoMsg = $( [
										'<div class="undo-block">',
										'<p class="undo-block-header">Содержимое блока удалено</p>',
										'<p class="undo-block-submit">',
										'<button class="action-undoClean">Вернуть</button>',
										'<span class="pseudo-link action-cancelUndo">Не возвращать</span>',
										'</p>',
										'<div class="undo-block-progress"><span class="undo-block-progress-bar"></span></div>',
										'</div>' ].join( '' ) )
										.find( '.action-undoClean' ).click( undo )
										.end()
										.find( '.action-cancelUndo' ).click( removeUndoMsg )
										.end()
										.appendTo( $this.$block )
									$undoProgressBar = $this.$cleanUndoMsg.find( 'span.undo-block-progress-bar' )
										.animate( {
											width : '0'
										}, {
											duration : $this.settings.cleanUndoTimeout,
											complete : removeUndoMsg
										} );
								}
							}
						} );
					}
					else {
					}
				},
				error   : function(){
					/* Roll back 'edit' state */
				}
			} );
		},

		onEditFormSubmit       : function( res, form, validator ){
			var $this = this;
			res = $this.processFormData( res );
			if( ! $this.isDataEqual( res ) ){
				$this.save( {
					data          : {
						data : res
					},
					newCheckpoint : true,
					updateData    : true,
					success       : function( saveRes ){
						Editor.InfoMessage.show( {
							html    : $this.getSuccessSaveMessage( saveRes ),
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
		},
		getSuccessSaveMessage  : function( saveRes ){
			return [
				'<p>',
				this.data.title
					? _( 'editor:block_save_success', this.data.title )
					: _( 'editor:block_save_success.unknown' ),
				'</p>',
				'<a class="action action-undo">' , _( 'editor:action_cancel' ) , '</a>'
			].join( '' )
		},
		getSuccessCleanMessage : function( saveRes ){
			return [
				'<p>',
				this.data.title
					? _( 'editor:block_clean_success', this.data.title )
					: _( 'editor:block_clean_success.unknown' ),
				'</p>',
				'<a class="action action-undo">' , _( 'editor:action_cancel' ) , '</a>'
			].join( '' )
		},

		onSubmitWithNoChanges : function(){},
		/**
		 * Does neede transform of raw form data composed after submit
		 * Method must be redefined if there are some fields to ignore or smth
		 */
		processFormData       : function( data ){
			return data;
		},
		/**
		 * Checks if given object equal to block data
		 * Method must be redefined if data has special structure
		 * @return {Boolean}
		 */
		isDataEqual           : function( data ){
			return ! ! (data.body == this.data.body && data.title == this.data.title);
		},

		setData : function( data ){
			data && $.extend( this.data, data );
		},

		getData : function(){
			return $.extend( {}, this.data );
		},

		load : function( _params ){
			this.showLoader();
			var
				$this = this,
				params = (function(){
					var
						_p = {
							url           : $this.settings.loadUrl,
							data          : $this.getLoadRequestData(),
							success       : function(){},
							handleSuccess : function( res ){
								if( $.isPlainObject( res ) ){
									$.extend( $this.data, res );
								}
							},
							error         : function(){},
							handleError   : function( res ){

							}
						};
					_params && $.extend( true, _p, _params );
					return _p;
				})();
			$.request( {
				url      : params.url,
				data     : params.data,
				dataType : 'json',
				type     : 'GET',
				success  : function( res ){
					$this.hideLoader();
					res = $this.processLoadedData( res );
					params.handleSuccess( res );
					params.success( res );
				},
				error    : function( res ){
					$this.hideLoader();
					params.handleError( res );
					params.error( res );
					$this.displayErrorMessage();
				}
			} );
		},

		refresh : function(){
			var $this = this;
			this.load( {
				success : function( res ){
					$this.render();
				}
			} )
		},

		/**
		 * @param {params} Editor.InfoMessage params
		 * @return {Editor.InfoMessage}
		 */
		displayErrorMessage : function( params ){
			var
				p = {
					type : 'error',
					html : _( 'editor:block_error_default' ),
					time : 7000
				};
			params && $.extend( p, params );
			return Editor.InfoMessage.show( p );
		},

		getLoadRequestData : function(){
			return {
				block_id : this.settings.id,
				location : Editor.getPageUri()
			};
		},

		processLoadedData : function( res ){
			if( res.body === null ){
				res.body = '';
			}
			return res;
		},

		save : function( _params ){
			var
				$this = this,
				params = (function(){
					var
						_p = {
							newCheckpoint : true,
							updateData    : true,
							url           : $this.settings.saveUrl,
							data          : $this.getSaveRequestData(),
							success       : function( res ){},
							handleSuccess : function( res ){
								if( params.newCheckpoint ){
									$this.setCheckpoint();
								}
								if(
									res
										&& ! isNaN( + res.all_pages )
										&& ! isNaN( + res.nonempty_pages )
										&& ! isNaN( + res.next_level_pages )
										&& Editor.NotEmptyPagesIndicator
									){
									Editor.NotEmptyPagesIndicator.update( {
										totalPages     : + res.all_pages,
										pages          : + res.nonempty_pages,
										nextLevelPages : + res.next_level_pages
									} );
								}
								if( res && res.m_button ){
									Editor.setModerationStatus( res.m_button );
								}
								if( params.updateData && $.isPlainObject( res ) ){
									$.extend( $this.data, res );
								}
								$this.onSave( res, $this.getCheckpoint() );
							}
						};
					_params && $.extend( true, _p, _params );
					if( ! _p.data.data ){
						_p.data.data = $.extend( {}, $this.data );
					}
					return _p;
				})();
			(function(){
				var
					attrs = {},
					hasAttrs = $.isPlainObject( params.data.data.attrs );
				$.each( params.data.data, function( name ){
					var argName;
					if( name.indexOf( 'attrs--' ) == 0 && ( argName = name.split( '--' ).pop() ) ){
						attrs[ argName ] = params.data.data[ name ];
						delete params.data.data[ name ];
						hasAttrs = true;
					}
				} );
				if( hasAttrs ){
					params.data.data.attrs = $.isPlainObject( params.data.data.attrs )
						? $.extend( {}, params.data.data.attrs, attrs )
						: attrs;
				}
				else {
					delete params.data.data.attrs;
				}
			})();

			params.data.data = $.toJSON( this.processSaveRequestData( params.data.data ) );

			$.request( {
				url      : params.url,
				data     : params.data,
				dataType : 'json',
				type     : 'POST',
				success  : function( res ){
					params.handleSuccess( res );
					params.success( res );
					$this.triggerEvent( BLOCK_EVENT_SAVE, $this.data );
				}
			} );
		},

		getSaveRequestData : function(){
			var $this = this;
			return  {
				block_id : $this.settings.id,
				location : Editor.getPageUri(),
				data     : undefined
			};
		},

		/**
		 * Extend saving data before send if needed
		 */
		processSaveRequestData : function( data ){
			return data;
		},

		onSave : function( res ){},

		/**
		 * Toggles current edit/view state to another
		 */
		toggleEditMode : function( isEdit ){
			var
				$this = this,
				complete = function(){
					$this.setState( 'edit', isEdit );
					$this.render();
				}
			isEdit = ! ! isEdit;
			if( isEdit === this.hasState( 'edit' ) ){
				/* State has no changes, nothing to do */
				return;
			}
			if( this.$block.closest( '#footer' ).length ){
				if( GridEditor.isFooterDown() ){
					GridEditor.toggleFooterDown( ! isEdit && ($( '#footer div.block-state-edit' ).length <= 1) )
				}
				if( isEdit ){
					setTimeout( function(){
						$( 'html' ).scrollTop( 10000 );
					}, 300 )
				}
			}
			if( isEdit ){
				/* Need to set edit state before loading to avoid next fast click */
				$this.setState( 'edit', true );
				this.load( {
					success : complete,
					error   : function(){
						/* Roll back 'edit' state */
						$this.setState( 'edit', false );
					}
				} );
			}
			else {
				complete();
			}
		},

		/**
		 * Abstract method to redefine by extending classes
		 * Runs before super initialize
		 */
		preInitialize : function(){},

		/**
		 * Abstract method to redefine by extending classes
		 * Runs after super initialize
		 */
		afterInitialize : function(){},

		/**
		 * Toggles given state for block
		 * Switches off if <code>bool</code> is <code>false</code>
		 * and switches on in all other cases
		 *
		 * @param {String} <code>state</code> State name
		 * @param {Bool} <code>bool</code> False to switch state off and all other cases to switch on
		 */
		setState : function( state, bool ){
			if( bool !== false ){
				bool = true;
			}
			this.states[state] = bool;
			this.$block.toggleClass( 'block-state-' + state, bool );
		},

		/**
		 * Checks if block now have specified state true or false
		 * @return {Boolean}
		 */
		hasState : function( state ){
			return ! ! this.states[state];
		},

		toggleState : function( state ){
			this.setState( state, ! this.states[state] );
		},

		/**
		 * Saves current block data as new checkpoints
		 * Later it may be used to undo
		 */
		setCheckpoint : function(){
			var
				checkpoint = $.extend( {}, this.data );
			this.checkPoints.push( checkpoint );
			if( this.settings.maxCheckpoints && this.checkPoints.length > this.settings.maxCheckpoints ){
				this.checkPoints.splice( 0, this.settings.maxCheckpoints - this.checkPoints.length );
			}
		},
		/**
		 * Returns previously saved checkpoint by its id
		 * @param {Number}
		 * @return {BaseBlockHandler.prototype.data}
		 */
		getCheckpoint : function( id ){
			if( isNaN( id ) ){
				id = this.checkPoints.length - 1;
			}
			return this.checkPoints[id];
		},

		/**
		 * Gets checkpoint by its id, applies to the block and re-render it
		 * @param {Number} Checkpoint id
		 */
		applyCheckpoint : function( id ){
			var
				$this = this,
				checkpoint = this.getCheckpoint( id );
			if( checkpoint ){
				this.save( {
					newCheckpoint : false,
					updateData    : true,
					data          : {
						data : checkpoint
					},
					success       : function( res ){
						/* Forcing unset edit state to avoid strange view */
						$this.toggleEditMode( false );
						$this.render();
					}
				} );
			}
		},

		/**
		 * Applies last saved checkpoint
		 */
		undo : function(){
			this.applyCheckpoint();
		},

		/**
		 * Makes needed actions before main container moved to another DOM place
		 * (Uses before parent level moved)
		 */
		prepareToMove : function(){
			var $this = this;

			//Trying to find active tinymce in block and remove it, preserve content as html
			this.$block.find( 'span.mceEditor' ).each( function(){
				var
					t = $( this ).prev( 'textarea#mce_' + $( this ).attr( 'id' ).split( '_' )[1] ).tinymce(),
					content;
				if( t ){
					content = t.getContent();
					$this.$text.html( content ).addClass( $this.settings.wysiwygPreservedClass );
				}
			} );
		},
		/**
		 * Makes needed actions after container moved to another DOM place
		 * (Uses after parent level moved)
		 */
		afterMove     : function(){
			var $this = this;
			if( this.$text.hasClass( $this.settings.wysiwygPreservedClass ) ){
				this.$text.removeClass( $this.settings.wysiwygPreservedClass );
				$this.showLoader();
				$this.setTextField( {
					content : $this.$text.html()
				} );
			}
		},

		showLoader : function( _params ){
			var
				params = {
					msg    : _( 'editor:loading' ),
					fadeIn : true
				};
			_params && $.extend( params, _params );
			if( ! this.$overlay || ! this.$loader.length ){
				this.$overlay = $( '<div class="block-overlay" />' )
					.hide()
					.click( function( /* Event */e ){
						e.stopPropagation();
						return false;
					} )
					.appendTo( this.$block )
			}
			if( ! this.$loader || ! this.$loader.length ){
				this.$loader = $( '<div class="block-loader" />' )
					.hide()
					.click( function( /* Event */e ){
						e.stopPropagation();
						return false;
					} )
					.appendTo( this.$block )
			}
			if( this.$loader.is( ':visible' ) || this.$overlay.is( ':visible' ) ){
				return;
			}
			if( params.msg ){
				this.$loader.html( params.msg );
				params.fadeIn
					&& this.$loader.stop( true, true ).fadeIn( params.fadeIn === true ? 500 : params.fadeIn )
				|| this.$loader.show();
			}
			else {
				this.$loader.empty().stop().hide();
			}
			params.fadeIn
				&& this.$overlay.stop( true, true ).fadeIn( params.fadeIn === true ? 500 : params.fadeIn )
			|| this.$overlay.show();
		},

		hideLoader : function( _params ){
			var
				$this = this,
				params = {
					fadeOut : false
				};
			_params && $.extend( params, _params );
			if( params.fadeOut ){
				$this.$loader.fadeOut( params.fadeOut === true ? 500 : params.fadeOut );
				this.$overlay.fadeOut( params.fadeOut === true ? 500 : params.fadeOut );
			}
			else {
				this.$loader.hide();
				this.$overlay.hide();
			}
		}
	};

	GridEditor.BaseBlockHandler = BaseBlockHandler;

})( this.GridEditor );