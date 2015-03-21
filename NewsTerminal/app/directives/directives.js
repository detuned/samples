/* Directives */
;(function(){
	var
		myAppDirectives = angular.module( 'myApp.directives', [] ),
		commonDirectives = angular.module( 'commonDirectives', [] );
	myAppDirectives.directive( 'whenScrolled', function (){
		return function ( scope, elm, attr ){
			var raw = elm[0];

			elm.bind( 'scroll', function (){
				if ( raw.scrollTop + raw.offsetHeight >= raw.scrollHeight ){
					console.log( 'want scroll' );
					scope.$apply( attr.whenScrolled );
				}
			} );
		};
	} );


	myAppDirectives.directive( 'onKeyenter', function (){
		return function ( scope, elm, attrs ){
			function applyKeyenter(){
				scope.$apply( attrs.onKeyenter );
			};

			elm.on( 'keypress', function ( evt ){
				if ( 13 == evt.which ){
					applyKeyenter();
				}
			} );
		};
	} );

	myAppDirectives.directive( 'onKeyesc', function (){
		return function ( scope, elm, attrs ){
			function applyKeyesc(){
				scope.$apply( attrs.onKeyesc );
			};

			elm.bind( 'keyup', function ( evt ){
				if ( 27 == evt.which ){
					applyKeyesc();
				}
			} );
		};
	} );

	myAppDirectives.directive( 'onKeyup', function (){
		return function ( scope, elm, attrs ){
			function applyKeyup(){
				scope.$apply( attrs.onKeyup );
			};

			elm.bind( 'keyup', function ( evt ){
				if ( 38 == evt.which ){
					applyKeyup();
				}
			} );
		};
	} );

	myAppDirectives.directive( 'onKeydown', function (){
		return function ( scope, elm, attrs ){
			function applyKeydown(){
				scope.$apply( attrs.onKeydown );
			};

			elm.bind( 'keyup', function ( evt ){
				if ( 40 == evt.which ){
					applyKeydown();
				}
			} );
		};
	} );

	myAppDirectives.directive( 'onFocusout', function (){
		return function ( scope, elm, attrs ){
			function applyFocus(){
				scope.$apply( attrs.onFocusout );
			};

			elm.on( 'focusout', function ( event ){
				applyFocus();
			} );
		};
	} );

	myAppDirectives.directive( 'onFocus', function (){
		return function ( scope, elm, attrs ){
			function applyFocus(){
				scope.$apply( attrs.onFocus );
			};

			elm.on( 'focus', function ( event ){
				applyFocus();
			} );
		};
	} );

	myAppDirectives.directive( 'setFocus', [ '$timeout', function ( $timeout ){
		return function ( scope, elem, attrs ){
			var isFocus;
			scope.$watch( attrs.setFocus, function ( v ){
				isFocus = v;
			    if ( v ){
				    $timeout(function (){
				        if ( v == isFocus && elem.is( ':visible' ) ){
				            elem.focus();
				        }
				    },100)
			    }
			})
		};
	} ] );

	myAppDirectives.directive( 'invisible', [ '$timeout', function ( $timeout ){
		return {
			restrict : 'A',
			link : function ( scope, elem, attrs ){
			   scope.$watch( attrs.invisible, function ( v ){
			      elem.css( 'visibility', v ? 'hidden' : '' );
			   });
			}
		}
	} ] );

	myAppDirectives.directive( 'preventSubmit', function (){
		return function ( scope, elem, attrs ){
			elem.on( 'submit', function(){
				return false;
			})
		};
	} );

	myAppDirectives.directive( 'updateAvg', function (){
		return function ( scope, elm, attrs ){
			if ( attrs.updateAvg ){
				/*
				* If value of update-avg attr is not empty
				* we believe that it means name of field need to be listening for updating
				*/
				scope.$watch( attrs.updateAvg, scope.updateAvg );
			}
			else if ( attrs.ngModel ){
				/*
				* If target field has model it's better to listen to its changes not HTML value
				* There is little delay between update HTML value and angular's model, e. g. in webkit-browsers
				*/
				scope.$watch( attrs.ngModel, scope.updateAvg );
			}
			else {
				/*
				* By default listening element changes
				*/
				elm.on( 'change', scope.updateAvg );
			}
		};
	} );

	myAppDirectives.directive( 'updateAvgDelayed', function ( $timeout ){
		return function ( scope, elm, attrs ){
			var searchFieldUpdated = false;
			elm.on( 'keyup', function ( evt ){
				if ( searchFieldUpdated ) $timeout.cancel( searchFieldUpdated );
				searchFieldUpdated = $timeout( scope.updateAvg, 2000 );
			} );
		};
	} );

	myAppDirectives.directive( 'errorFeedback', function (){
		return function ( scope, elm, attrs ){
			elm.on( 'keyup', function ( evt ){
				if ( evt.ctrlKey && evt.which == 13 ) {
					var sel;
					if ( window.getSelection ) sel = window.getSelection();
					else sel = document.getSelection ? document.getSelection() : document.selection;
					if ( !sel ) return;

					var
						before_selected = '',
						selected_text = sel.toString() || sel.text,
						after_selected = '',
						pos = -1,
						len = selected_text.length,
						tail = len < 140 ? (140 - len) / 2 : 0,
						nodeParent = $(sel.baseNode).closest('article, li.js-news-item'),
						articleID = nodeParent.attr('data-article-id'),
						nodeUrl = articleID ? location.protocol + '//' + location.hostname + '/#/news/' +  nodeParent.attr('data-article-id') : '';

					if ( len > 140 ) {
						selected_text = selected_text.substr(0, 140);
						before_selected = after_selected = '';
					} else {

						if ( sel.getRangeAt ){
							var r = sel.getRangeAt(0);
							selected_text = r.toString();
							var rng = document.createRange();
							rng.setStartBefore( r.startContainer.ownerDocument.body );
							rng.setEnd( r.startContainer,r.startOffset );
							before_selected = rng.toString();
							var rng2 = r.cloneRange();
							rng2.setStart( r.endContainer,r.endOffset );
							rng2.setEndAfter( r.endContainer.ownerDocument.body );
							after_selected	= rng2.toString();
						} else {
							if ( sel.createRange ){
								var
									r = sel.createRange(),
									rng = sel.createRange(),
									rng2 = sel.createRange();;
	
								selected_text = r.text;
								rng.moveStart( 'character', -20 );
								rng.moveEnd( 'character', -selected_text.length );
								before_selected = rng.text;
								rng2.moveEnd( 'character', 20 );
								rng2.moveStart( 'character', selected_text.length );
								after_selected = rng2.text;
							} else {
								selected_text = '' + sel;
							}
						}
						var
							p,
							s = (p = selected_text.match(/^(\s*)/)) && p[0].length,
							e = (p = selected_text.match(/(\s*)$/)) && p[0].length;
	
						before_selected = (before_selected + selected_text.substring( 0, s )).substr( -tail, tail ) ;
						after_selected = (selected_text.substring( selected_text.length-e, selected_text.length ) + after_selected).substr( 0, tail );
					}	
					scope[ attrs.errorFeedbackPopup ].opened = true;
					scope[ attrs.errorFeedback ].sel = {
						errorSelectedTextPre : '...' + before_selected,
						errorSelectedText : selected_text,
						errorSelectedTextPost : after_selected + '...',
						errorSelectedNodeUrl : nodeUrl ? nodeUrl : ''
					}

				}
			} );
		};
	} );

	myAppDirectives.directive( 'onWallclick', [ '$window', '$timeout', function ( $window, $timeout ){
		var
			updateWatcher,
			hideWatcher;

		return function ( scope, elem, attrs ){
			function applyFocus(){
				scope.$apply( attrs.onWallclick );
			};

			var
				windowElement = angular.element( $window ),
				popupElement = angular.element( '.window' ),
				pointerElement = popupElement.find( '.window__arr' ),
				pointerFloatingClass = 'is-floating',
				activeClass = 'is-active',
				fixedPointerTop = 21,
				windowHeight, pointerTop, pointerHeight, targetBottom, popupHeight, popupBottom;

			popupElement
				.on( 'click.wallPopup', '.btn-close', hidePopup )

			scope.$watch( 'wall.opened', function ( v, prev ){
			    if ( ! v && prev ){
				    hidePopup();
			    }
			});

			function actualizePopupPosition(){
				if ( ! elem.hasClass( activeClass ) ){
					return;
				}
				windowHeight = windowElement.height();
				pointerTop = elem.position().top;
				pointerHeight = pointerElement.outerHeight( true );
				targetBottom = pointerTop + elem.outerHeight();
				if ( targetBottom < 0 || pointerTop > windowHeight ){
					hidePopup();
					return;
				}
				popupHeight = popupElement.outerHeight();
				popupBottom = windowHeight - pointerTop - popupHeight;
				if ( popupBottom < 0 ){
					popupBottom = 0;
					pointerElement.addClass( pointerFloatingClass );
				}
				else if ( popupBottom > windowHeight - popupHeight){
					popupBottom = windowHeight - popupHeight;
				}
				else {
					pointerTop = fixedPointerTop;
					pointerElement.removeClass( pointerFloatingClass );
				}

				pointerTop = Math.min( windowHeight - pointerHeight, pointerTop )
				pointerElement
					.css( 'top', pointerTop );
				popupElement
					.css( 'bottom', popupBottom )
					.fadeIn();
			}

			function showPopup(){
				if ( updateWatcher ){
					updateWatcher();
					updateWatcher = null;
				}
				if ( hideWatcher ){
					hideWatcher();
					hideWatcher = null;
				}
				/* Showing popup */
				elem
					.addClass( activeClass )
						.siblings()
						.removeClass( activeClass )
					.end()
						.closest( '.scroller' )
						.off( '.wallPopup' )
						.on( 'scroll.wallPopup', showPopup );
				actualizePopupPosition();
				if ( attrs.wallUpdate ){
					updateWatcher = scope.$watch( attrs.wallUpdate, function ( v ){
						$timeout( actualizePopupPosition, 100 );
					} );
				}
				if ( attrs.wallHidePopup ){
					hideWatcher = scope.$watch( attrs.wallHidePopup, function ( v, prev ){
						if ( ! v && prev ){
							hidePopup()
						}
					} );
				}
			}

			function hidePopup(){
				elem
					.removeClass( activeClass )
					.siblings()
					.removeClass( activeClass );
				popupElement
					.fadeOut(function (){
						pointerElement
							.removeClass( pointerFloatingClass )
							.css( 'top', fixedPointerTop );
					});
				elem
					.closest( '.scroller' )
					.off( '.wallPopup' );
			}

			elem.on( 'click', function ( event ){
				if ( elem.hasClass( activeClass ) ){
					hidePopup();
				}
				else {
					applyFocus();
					showPopup();
				}
			} );
		};
	} ] );

	/**
	 * Uses to highlight favorites feeds in the sidebar when article(s) was added to them
	 * To trigger highlighting from controller just set feed's _highlight property true
	 */
	myAppDirectives.directive( 'highlightable', [ '$timeout', function ( $timeout ){
		var
			class1 = 'is-highlightable',
			class2 = 'is-highlighted',
			delay1 = 100,
			delay2 = 3000,
			delay3 = 400;
		return {
			restrict : 'A',
			link     : function ( scope, elem ){
				scope.$watch( 'feed._highlight', function ( v, prev ){
					if ( v && ! prev ){
						elem.addClass( class1 );
						$timeout( function (){
							elem.addClass( class2 );
							$timeout( function (){
								elem.removeClass( class2 );
								$timeout( function (){
									elem.removeClass( class1 );
									delete scope.feed._highlight;
								}, delay1 );
							}, delay2 );
						}, delay3 );
					}
				} )
			}
		}
	}] );

	myAppDirectives.directive( 'datepickerRange', [ '$timeout', function ( $timeout ){
		return {
			restrict : 'A',
			scope    : {
				open      : '=',
				valueFrom : '=',
				valueTo   : '='
			},
			link     : function ( scope, elem, attrs ){
				var
					panels,
					defaultDates = {
						from : new Date(),
						to   : new Date()
					},
					RangePanel = function ( params ){
						var
							_params = {
								id                : 'from',
								inline            : true,
								calendars         : 1,
								mode              : 'single',
								calendMode        : 'days',
								title             : '',
								current           : new Date(),
								date              : new Date(),
								cssClass          : 'datepicker-range-panel',
								localeMonthMode   : 'months',
								enableYearsSelect : false,
								onChange          : function (){
								},
								onReset           : function (){
								}
							},
							container,
							calendContainer,
							actions = {
								reset       : function (){
									_params.onReset();
									_params.onReset();
								},
								setToday    : function (){
									if ( 'months' == calendContainer.DatePickerGetMode() ){
										calendContainer.DatePickerSetMode( 'days' );
									}
									calendContainer.DatePickerSetDate( new Date(), true );
									triggerChange();
								},
								setDaysMode : function (){
									calendContainer.DatePickerSetMode( 'days' );
								}
							},
							instance = {
								getDate : function (){
									var dt = calendContainer.DatePickerGetDate();
									return dt
										? dt[0] || null
										: null;
								},
								setDate : function ( dt ){
									calendContainer.DatePickerSetDate( dt, true );
								}
							};
						params && _.extend( _params, params );

						function init(){
							container = $( _.template( [
								'<div class="<%=cssClass %> <%= cssClass %>__<%= id %> <%= cssClass %>__<%= calendMode %>">',
								'<div class="<%=cssClass %>_header">',
								'<% if( title ) {%>',
								'<h3 class="<%= cssClass %>_title"><%= title %></h3>',
								'<% } %>',
								'<span class="<%= cssClass %>_function" data-action="reset">' + GLOBAL.l10n('Сбросить') + '</span>',
								'</div>',
								'<div class="<%=cssClass %>_calend" />',
								'<div class="<%=cssClass %>_footer">',
								'<span class="<%= cssClass %>_function <%= cssClass %>__hide-when-months" data-action="setToday">' + GLOBAL.l10n('Сегодня') + '</span>',
								'<span class="<%= cssClass %>_function <%= cssClass %>__hide-when-days" data-action="setDaysMode">' + GLOBAL.l10n('Закрыть') + '</span>',
								'</div>',
								'</div>'
							].join( '' ), _params ) )
								.on( 'click', '.' + _params.cssClass + '_function', function ( event ){
									var action = $( this ).data( 'action' );
									if ( action in actions ){
										actions[ action ]( event );
									}
								} )
								.appendTo( elem );

							calendContainer = container.find( '.datepicker-range-panel_calend' );
							calendContainer.DatePicker( _.extend( _.pick( _params,
								'inline', 'calendars', 'mode',
								'current', 'date', 'onChange',
								'localeMonthMode', 'enableYearsSelect' ), {
								onModeChange : function ( newMode, prevMode ){
									container
										.removeClass( _params.cssClass + '__' + prevMode )
										.addClass( _params.cssClass + '__' + newMode );
								}
							} ) );
						}

						function triggerChange(){
							_params.onChange( calendContainer.DatePickerGetDate );
						}

						init();

						return instance;
					}

				function init(){
					var defaultInitDates = {
						from : scope.valueFrom || defaultDates.from,
						to   : scope.valueTo || defaultDates.to
					};
					window.searchDatepickerFrom = defaultInitDates.from;
					window.searchDatepickerTo = defaultInitDates.to;

					elem
						.addClass( 'datepicker-range' )
						.on( 'click', function ( event ){
							event.stopPropagation();
						} );

					panels = {
						from : RangePanel( {
							id       : 'from',
							title    : GLOBAL.l10n('Начало периода'),
							current  : defaultInitDates.from,
							date     : defaultInitDates.from,
							onChange : onRangeChange,
							onReset  : onRangeReset
						} ),
						to   : RangePanel( {
							id       : 'to',
							title    : GLOBAL.l10n('Конец периода'),
							current  : defaultInitDates.to,
							date     : defaultInitDates.to,
							onChange : onRangeChange,
							onReset  : onRangeReset
						} )
					};
				}

				function onRangeChange(){
					var
						dateFrom = panels.from.getDate() || new Date(),
						dateTo = panels.to.getDate(),
						tmp;
					if ( dateFrom.getTime() >= dateTo.getTime() ){
						tmp = dateFrom;
						dateFrom = dateTo;
						dateTo = tmp;
					}
					scope.$apply( function ( s ){
						s.valueFrom = dateFrom;
						s.valueTo = dateTo;
					} )
					window.searchDatepickerFrom = dateFrom;
					window.searchDatepickerTo = dateTo;
					$('.datepicker-range-panel__to .datepicker').length && $('.datepicker-range-panel__to .datepicker').DatePickerRedraw();
				}

				function onRangeReset(){
					panels.from.setDate( new Date() );
					panels.to.setDate( defaultDates.to );
					window.searchDatepickerFrom =  defaultDates.from;
					window.searchDatepickerTo = defaultDates.to;
					scope.$apply( function ( s ){
						s.open = false;
						s.valueFrom = null;
						s.valueTo = null;
					} );
				}

				scope.$watch( 'open', function ( v, prev ){
					if ( v ){
						elem.show();
						if ( ! panels ){
							init();
						}
					}
					else {
						elem.hide()
					}
				} );

				function onDateExtUpdate( panelId, date ){
					if ( ! _.isDate( date ) ){
						return;
					}
					if ( ! panels ){
						init();
					}
					panels[ panelId ].setDate( date );
				}

				scope.$watch( 'valueFrom', function ( v ){
					onDateExtUpdate( 'from', v );
				} );
				scope.$watch( 'valueTo', function ( v ){
					onDateExtUpdate( 'to', v );
				} );
			}
		}
	}] )

	myAppDirectives.directive( 'datepickerArchive', [ function (){
		return {
			restrict : 'A',
			link     : function ( scope, elem, attrs ){
				;(function () {
					var
						_params = {
							id                : 'archive',
							inline            : true,
							calendars         : 1,
							mode              : 'single',
							calendMode        : 'days',
							current           : new Date(),
							date              : new Date(),
							title             : '',
							cssClass          : 'datepicker-range-panel',
							localeMonthMode   : 'months',
							enableYearsSelect : false,
							onChange          : function (dates, el){
								$('.js-date-current').val(instance.getDate());
							},
							onReset           : function (){
							}
						},
						container,
						calendContainer,
						actions = {
							reset       : function (){
								_params.onReset();
							},
							setToday    : function (){
								if ( 'months' == calendContainer.DatePickerGetMode() ){
									calendContainer.DatePickerSetMode( 'days' );
								}
								calendContainer.DatePickerSetDate( new Date(), true );
								triggerChange();
							},
							setDaysMode : function (){
								calendContainer.DatePickerSetMode( 'days' );
							}
						},
						instance = {
							getDate : function (){
								var dt = calendContainer.DatePickerGetDate();
								return dt
									? dt[0] || null
									: null;
							},
							setDate : function ( dt ){
								calendContainer.DatePickerSetDate( dt, true );
							}
						};

					function init(){
						container = $( _.template( [
							'<div class="<%=cssClass %> <%= cssClass %>__<%= id %> <%= cssClass %>__<%= calendMode %>">',
							'<div class="<%=cssClass %>_calend" />',
							'<div class="<%=cssClass %>_footer">',
							'<span class="<%= cssClass %>_function <%= cssClass %>__hide-when-months" data-action="setToday">' + GLOBAL.l10n('Сегодня') + '</span>',
							'<span class="<%= cssClass %>_function <%= cssClass %>__hide-when-days" data-action="setDaysMode">' + GLOBAL.l10n('Закрыть') + '</span>',
							'</div>',
							'</div>'
						].join( '' ), _params ) )
							.on( 'click', '.' + _params.cssClass + '_function', function ( event ){
								var action = $( this ).data( 'action' );
								if ( action in actions ){
									actions[ action ]( event );
								}
							} )
							.appendTo( elem );
					}
					
					function triggerChange(){
						_params.onChange( calendContainer.DatePickerGetDate );
					}
					
					init();
					
					calendContainer = container.find( '.datepicker-range-panel_calend' );
					calendContainer.DatePicker( _.extend( _.pick( _params,
						'inline', 'calendars', 'mode',
						'current', 'date', 'onChange',
						'localeMonthMode', 'enableYearsSelect' ), {
						onModeChange : function ( newMode, prevMode ){
							container
								.removeClass( _params.cssClass + '__' + prevMode )
								.addClass( _params.cssClass + '__' + newMode );
						}
					} ) );
					
					return instance;
				}());
			}
		}
	}] )

	myAppDirectives.directive( 'rangeAsString', [ function (){
		return {
			restrict : 'A',
			scope    : {
				valueFrom : '=',
				valueTo   : '=',
				textEmpty : '@',
				format    : '@',
				separator : '@'
			},
			link     : function ( scope, elem, attrs ){
				var
					defaultTextEmpty = '',
					defaultSeparator = ' — ',
					defaultFormat = 'j f Y';

				scope.getString = function (){
					var format = scope.format || defaultFormat;
					if ( ! _.isDate( scope.valueFrom ) || ! _.isDate( scope.valueTo ) ){
						return scope.textEmpty || defaultTextEmpty;
					}
					return [
						scope.valueFrom.dateFormat( format ),
						scope.valueTo.dateFormat( format )
					].join( scope.separator || defaultSeparator );
				}

				scope.$watch( 'getString()', function ( v ){
					elem.val( v );
				} )

			}
		}
	}] )


	myAppDirectives.directive( 'simpleDropdown', [ '$document', function ( $document ){
		var id = 0;
		return {
			restrict : 'A',
			link     : function ( scope, elem, attrs ){
				elem
					.addClass( 'simple-dropdown simple-dropdown_' + ++ id )
					.on( 'click', function ( e ){
						e.stopPropagation();
					})
				var
					isOpen = false,
					enableClass = 'simple-dropdown_enable',
					titleElem = elem.find( 'h1,h2,h3,h4' ).addClass( 'simple-dropdown__title' ).on( 'click', function (){
					    if ( elem.hasClass( enableClass ) ){
						    if ( isOpen ){
							    close();
						    }
						    else{
							    open();
						    }
					    }
					}),
					listElem = elem.find( 'ul' ).addClass( 'simple-dropdown__list drop-list' ),
					hideFieldName = attrs.hideDropdown;
				scope.$watch( attrs.enableDropdown, function ( v ){
					elem.toggleClass( enableClass, ! ! v );
				} );
				scope.$watch( hideFieldName, function ( v ){
					if ( v ){
						close();
						scope[ hideFieldName ] = false;
					}
				} );
				function open(){
					if ( isOpen ){
						return;
					}
					listElem.show();
					isOpen = true;
					$document.on( 'click.simpleDropdown_' + id, ':not(.simple-dropdown_' + id + ' *)', close );
				}
				function close(){
					if ( ! isOpen ){
						return;
					}
					listElem.hide();
					$document.off( '.simpleDropdown_' + id );
					isOpen = false;
				}
			}
		}
	}] )


	myAppDirectives.directive( 'statChart', [ '$document', '$window', '$timeout', function ( $document, $window, $timeout ){
		return {
			scope : {
				data : '=statChartData'
			},
			restrict : 'A',
			link     : function ( scope, elem, attrs ){
				if ( ! $.fn.highcharts ){
					/* Seems like highcharts.js has not linked to page */
					return;
				}
				elem.addClass( 'stat-chart' );
				scope.$watch( 'data', function ( chartData ){
				    render( scope.data )
				}, true );

				function render( data ){
					var
						labels = [],
						values = [],
						chartData = [],
						maxValue = 0;
					angular.forEach( data, function ( item ){
						chartData.push({
							x : ( new Date ).fromString( item.date ),
							y : Number( item.value )
						});
						maxValue = Math.max( maxValue, Number( item.value ) );
					})
					if ( ! data || ! data[0] || ! data[0].date ){
						elem.addClass( 'stat-chart_empty' ).empty();
						return;
					}
					elem.removeClass( 'stat-chart_empty' ).highcharts({
						chart : {
							height : 160,
							spacingTop : 0,
							spacingBottom : 5,
							animation : false
						},
						colors : [
						],
						xAxis : {
							minPadding : 0,
							maxPadding : 0,
							title : {
								text : null
							},
							tickWidth : 0,
							tickInterval: 2*24*3600*1000,
							labels : {
								align : 'left',
								formatter : function (){
								    return new Date( this.value ).dateFormat( 'j' + ( this.isFirst ? ' M' : '' ) );
								},
								x : -12,
								style : {
									'font-family' : 'PT Sans regular'
								}
							}
						},
						yAxis : {
							title : {
								text : null
							},
							gridLineColor : '#E7E7E7',
							showLastLabel : false,
							showFirstLabel : false,
							tickPixelInterval : 100,
							maxPadding : 0.05,
							labels : {
								align : 'left',
								x : 0,
								y : -5,
								style : {
									color : '#CCC',
									'text-shadow' : '0 1px #FFF'
								},
								formatter : function (){
								    return this.value.numberFormat( ' ' );
								}
							},
							max : maxValue ? null : 2
						},
						legend : {
							enabled : false
						},
						title : {
							text : null
						},
						plotOptions : {
							area : {
								fillOpacity : 0.1
							},
							series : {
								marker : {
									fillColor : null,
									lineColor : '#FFF',
									lineWidth : 2,
									radius : 4
								},
								animation : false
							}
						},
						tooltip : {
							borderColor : '#B9B9B9',
							style : {
							},
							formatter : function (){
							    return '<span style="color:#666;font-family: \'PT Sans regular\'">' + this.x.dateFormat( 'j f' ) + '</span><br/>' +
							           '<span style="color:#333;font-family: \'PT Sans bold\'"">' + GLOBAL.l10n( '%d НОВОСТЬ', this.y, 'format' ).toLocaleLowerCase() + '</span>';
							}
						},
						series : [
							{
								type : 'area',
								data : chartData,
								color : '#006699'
							}
						],
						credits: {
							enabled: false
						}
					});

					$timeout(function (){
						elem.closest( '.scroller' ).trigger( 'sizeChange' );
					},100)

					function resize(){
						var
							chart = elem.highcharts(),
							width;
						if ( chart && chart.setSize && ( width = elem.width() ) ){
							chart.setSize( width, null, false );
						}
					}

					$document.off( 'panelsResize.statChart' ).on( 'panelsResize.statChart', resize );
					angular.element( $window ).off( 'resize.statChart' ).on( 'resize.statChart', resize );
				}
			}
		}
	}] )


	myAppDirectives.directive( 'dropdownPosition', [ '$timeout', function ( $timeout ){
		return {
			restrict : 'A',
			link     : function ( scope, elem, attrs ){
				var
					revertPositionClass = 'search-list_revert',
					showFieldName = attrs.dropdownPosition,
					heightHolder = elem.closest( '.' + ( attrs.heightHolder || 'dropdown-height-holder') );
				if ( ! heightHolder.length ){
					return;
				}
				function fixPosition(){
					if ( ! elem.is( ':visible' ) || elem.hasClass( revertPositionClass ) ){
						return;
					}

				    var
					    elemOffset = elem.offset(),
					    elemHeight = elem.outerHeight(),
					    elemBottom = elemOffset.top + elemHeight,
					    holderOffset = heightHolder.offset(),
					    holderHeight = heightHolder.outerHeight(),
					    holderBottom = holderOffset.top + holderHeight;
					elem.toggleClass( revertPositionClass, elemBottom >= holderBottom );
				}
				scope.$watch( showFieldName, function (){
				    $timeout( fixPosition, 50 );
				} );

			}
		}
	}] );

	/**
	 * Handles ext search form container allow open and close it
	 * when flag given in data-ext-search attribute switches
	 * @example <div data-ext-search="flagToOpenExtSearch"></div>
	 */
	myAppDirectives.directive( 'extSearch', [ '$document', '$window', '$timeout', function ( $document, $window, $timeout ){
		return {
			restrict : 'A',
			link     : function ( scope, elem, attrs ){
				var
					showFieldName = attrs.extSearch,
					isOpened = false,
					panelScrollerWrap = angular.element( '.feed-col' ),
					toolBar = angular.element( '.l-col-left .toolbar' ),
					openedClass = 'search-ext_opened';

				elem.css( 'top', - elem.outerHeight() );

				function toggle( newState ){
					if ( ! arguments.length ){
						newState = ! isOpened;
					}
					if ( ( newState && isOpened ) || ( ! newState && ! isOpened ) ){
						/* The same state, nothing to do */
						return;
					}

					if ( newState ){
						/* Opening search form */
						$timeout(function (){
							elem.css( { zIndex : 5 } );
						},300)
						elem
							.css( { top  : 0 } )
							.addClass( openedClass );
						panelScrollerWrap
							.css( {
								top : elem.outerHeight() + toolBar.outerHeight()
								})
								.find('.scroller')
								.trigger('updateScroll');
					}
					else {
						/* Closing search form */
						elem.css( {
								zIndex:- 1,
								top : - elem.outerHeight()
								} );
						$timeout(function (){
						    elem.removeClass( openedClass );
						}, 300)
					}
					scope.feedSelect.opened = false;
					isOpened = ! ! newState;
					scope[ showFieldName ] = isOpened;
					actualizeScrollerPosition()
				}

				function actualizeScrollerPosition(){
					if ( isOpened ){
						return;
					}
					panelScrollerWrap
						.css( {
							top : toolBar.outerHeight()
						} )
						.find('.scroller')
						.trigger('updateScroll');
				}


				scope.$watch( showFieldName, function ( v ){
					toggle( v );
				} );
				attrs.$observe( 'actualizePosition', actualizeScrollerPosition );

				$document
					.on( 'closeAdvancedSearchMenu', function (){
					    toggle( false );
					})
					.on( 'panelsResize', actualizeScrollerPosition );
				angular.element( $window ).on( 'resize', actualizeScrollerPosition );
			}
		}
	}] );


	/**
	 * Usable to fade some container in and out
	 * according to change value of expression specified in fadeIn attribute value
	 * @example <div data-fade-in="flagToFadeContainerIn"></div>
	 */
	myAppDirectives.directive( 'fadeIn', [ '$timeout', function ( $timeout ){
		return {
			restrict : 'A',
			link     : function ( scope, elem, attrs ){
				elem.hide();
				scope.$watch( attrs.fadeIn, function ( v ){
					if ( v ){
						elem.stop().fadeIn( 'fast' );
					}
					else {
						elem.stop().fadeOut( 'fast' );
					}
				} );

			}
		}
	}] );

	myAppDirectives.directive( 'stopPropagation', [ '$timeout', function ( $timeout ){
		return {
			restrict : 'A',
			link     : function ( scope, elem, attrs ){
				elem.on( 'click', function( e ){
					e.stopPropagation();
				});
			}
		}
	}] );

	myAppDirectives.directive( 'onSearchKeyenter', function (){
	    return function ( scope, elm, attrs ){
	        function applyKeyenter(){
	            scope.$apply( attrs.onSearchKeyenter );
	        };

	        elm.on( 'keypress', function ( evt ){
	            if ( 13 == evt.which ){
	                applyKeyenter();
	            }
	        } );
	    };
	} );

	myAppDirectives.directive( 'onClickHideFilterResult', [ '$document', function ( $document ){
	    return {
	        restrict : 'A',
	        link     : function ( scope, elem, attrs ){
	            elem.on( 'click', function( e ){
		            $document.trigger( 'closeAdvancedSearchMenu' );
	            });
	        }
	    }
	}]);

	commonDirectives.directive( 'popupShow', [ '$window', '$document', function ( $window, $document ){
	    return {
	        restrict : 'A',
	        link     : function ( scope, elem, attrs ){
		        var
			        isElastic = 'popupElastic' in attrs,
			        modelName = attrs.popupShow || 'popup',
			        model = scope[ modelName ] || { opened : false },
			        overlay = angular.element( '.overlay-popup' ),
			        scrollerPopup = getScrollerPopup(),
			        heightHolder = elem.find( '.scroller__container' ),
			        windowElem = angular.element( $window ),
			        bodyElem = $document.find( 'body' ),
			        isShown = false;

		        elem
			        .addClass( 'popup-handled' )
				        .find( '.popup-close' )
				        .on( 'click.popupShow', hide );

		        function getScrollerPopup(){
			        var scroller;
		            if ( ! arguments.callee.scrollerPopup ){
			            scroller = elem.find( '>.scroller-wrap>.scroller' );
			            if ( scroller.length ){
				            arguments.callee.scrollerPopup = scroller;
			            }
		            }
			        return arguments.callee.scrollerPopup || angular.element();
		        }

		        function show(){
			        if ( isShown ){
				        return;
			        }
					if ( attrs.popupOnShow ){
						scope.$eval( attrs.popupOnShow );
					}
			        overlay
				        .stop()
				        .fadeIn( 'fast', function (){
					        bodyElem.addClass( 'is-overlayed' );
				        } )
				        .on( 'click.popupShow', hide );
			        elem
				        .stop()
				        .fadeIn( 'fast', function(){
							if ( isElastic ){
								windowElem.on( 'resize.popupShow', actualizeHeight() );
								elem
									.addClass( 'elastic-height' )
									.on( 'elasticHeightChange', actualizeHeight );
							}
					        else{
								actualizeScrollers();
							}

					        /* Handling open popup */
					        (function(){
						        var
							        $fields = elem.find( 'input[type=text]:visible,textarea:visible' ),
							        $autofocus = $fields.filter( '.autofocus:first' );
						        if ( ! $autofocus.length ){
							        $autofocus = $fields.eq( 0 );
						        }
						        $autofocus.focus();
						        return this;
					        })();
				        } );


			        if ( scope.feedSelect ){
				        // TODO remove?
			            scope.feedSelect.opened = false;
			        }
			        isShown = true;
			        model.opened = true;
		        }

		        function hide(){
		            if ( ! isShown ){
				        return;
			        }
			        if ( attrs.popupOnHide ){
				        scope.$eval( attrs.popupOnHide );
			        }
			        elem
				        .stop()
				        .fadeOut( 'fast', function(){
			        } );

			        overlay
				        .stop()
				        .off( '.popupShow' )
				        .fadeOut( 'fast' );
			        bodyElem.removeClass( 'is-overlayed' );
			        windowElem.off( '.popupShow' );
			        if ( scope.feedSelect ){
				        // TODO remove?
			            scope.feedSelect.opened = false;
			        }
			        isShown = false;
			        model.opened = false;
		        }


		        function actualizeHeight(){
			        var
				        scrollerWrapHeight = getScrollerPopup().height(),
				        popupHeightDiff = scrollerWrapHeight
			                ? elem.outerHeight() - scrollerWrapHeight
					        : 0,
				        contentHeight = heightHolder.outerHeight( true ) + popupHeightDiff,
				        windowHeight = windowElem.height(),
				        offset = 120,
				        popupHeight = Math.min( contentHeight, windowHeight - offset );

			        elem
				        .height( popupHeight )
				        .css( 'marginTop', - popupHeight / 2 );
			        actualizeScrollers();
		            return arguments.callee;
		        }

		        function actualizeScrollers(){
			        getScrollerPopup()
				        .trigger( 'updateScroll' )
				        .trigger( 'sizeChange' );
		        }


		        scope.$watch( modelName + '.opened', function ( v ){
			        if ( v ){
						show();
			        }
			        else {
				        hide();
			        }
		        } );

		        scope.$watch( modelName + '.loading', function ( v ){
			        elem.toggleClass( 'popup_loading', ! ! v );
		        } );
	        }
	    }
	}]);

	myAppDirectives.directive( 'feedSelect', [ '$document', function ( $document ){
		return {
			template : '<div class="input-extend"> \
				<div class="input"> \
					<label for="input_s2">' + GLOBAL.l10n('По лентам') + '</label> \
					<input readonly type="text" id="input_s2" ng-model="advanced.feeds.listView" ng-click="SelectFeedShow($event)"> \
						<button ng-click="SelectFeedShow($event)" type="button"><i></i></button> \
					</div> \
					<div class="drop-list drop-list_fixed-height" ng-class="{\'drop-list_revert\' : isScrollReverted }" ng-show="feedSelect.opened" data-custom-scroll="{{feedSelect.opened.toString() + advanced.feeds.list.length.toString()}}"> \
						<ul> \
							<li ng-class="{\'is-selected\': advanced.feeds.isAll, \'is-disabled\': advanced.feeds.isAll}" ng-click="SelectAllFeeds( $event )">' + GLOBAL.l10n('Все ленты') + '</li> \
							<li ng-repeat="feedItem in advanced.feeds.list" ng-class="{\'is-selected\': feedItem.selected}" ng-click="AddFeedToSelected(feedItem.id, $event)">{{feedItem.title}}</li> \
						</ul> \
					</div> \
				</div>',
			replace : true,
			restrict : 'A',
			controller : [ '$scope', '$attrs', 'newsService', function ( $scope, $attrs, newsService ){

				$scope.isScrollReverted = 'scrollReverted' in $attrs;

				/* Overrides parent controllers method of the same name */
				$scope.AddFeedToSelected = function( feedId, $event ){
					$event.stopPropagation();
					newsService.updateFeedListForSearch( feedId, $scope.advanced );
				};
				$scope.SelectAllFeeds = function( $event ){
					$event.stopPropagation();
					if ( ! $scope.advanced.feeds.isAll ){
						newsService.updateFeedListForSearch( false, $scope.advanced );
					}
				};
			} ],
			link     : function ( scope, elem, attrs ){
			}
		}
	}]);

	myAppDirectives.directive( 'customScroll', [ '$timeout', '$document', function ( $timeout, $document ){
		return {
			restrict : 'A',
			link     : function ( scope, elem, attrs ){
				var
					scrollWrapper,
					scroller,
					scrollerContainer,
					isScrollable = true,
					/* Flag means elem wants to be scrollerWrapper itself */
					isSelf = 'customScrollSelf' in attrs,
					isWithFixedHeaders = 'customScrollWithFixedHeaders' in attrs,
					maxHeight = attrs.customScrollMaxHeight || null,
					onScroll = attrs.customScrollOnScroll,
					onHideScroll = attrs.customScrollOnHide,
					scrollerEngine,
					scrollTopOnUpdate = 'customScrollTopOnUpdate' in attrs,
					range = (
						'customScrollRange' in attrs
							? angular.fromJson( attrs.customScrollRange )
							: null
						);

				elem
					.wrapInner(
						isSelf
							? '<div class="scroller"><div class="scroller__container" /></div>'
							: '<div class="scroller-wrap"><div class="scroller"><div class="scroller__container" /></div></div>'
					);
				scrollWrapper = isSelf
					? elem.addClass( 'scroller-wrap' )
					: elem.find( '>.scroller-wrap' );
				scroller = scrollWrapper.find( '>.scroller' );
				scrollerContainer = scroller.find( '>.scroller__container' );
				angular.element( '<div class="scroller__bar"><span/></div>' ).appendTo( scrollerContainer );

				if ( maxHeight ){
					scrollWrapper.addClass( 'scroller-wrap_elastic' );
				}

				if ( onScroll ){
					scroller.on( 'scroll', function ( event ){
						if ( isScrollable
							&& ( scroller[0].scrollTop + scroller[0].offsetHeight >= 0.95 * scroller[0].scrollHeight )
							){
							console.log( 'want scroll' );
							scope.$apply( onScroll );
						}
					} );
				}

				if ( 'customScrollDisableOverlayed' in attrs ){
					scroller.addClass( 'scroller_disable-overlayed' )
				}

				if ( range && range.length ){
					scroller.on( 'scroll', function ( event ){
						var
							scrollTop = scroller.scrollTop(),
							appropriateRangeLevel = _.find( range, function( item, num ){
							    return (
								    ! range[ num + 1 ]
								    || Number( range[ num + 1 ][0] ) > scrollTop
								    );
							} );
						if ( appropriateRangeLevel && appropriateRangeLevel[1] ){
							scope.$apply( appropriateRangeLevel[1] );
						}
					} );
				}

				function actualizeScroll(){
					if ( elem.is( ':visible' ) ){
						if ( maxHeight ){
							(function(){
							    var
								    contentHeight = scrollerContainer.outerHeight(),
								    maxHeightClass = 'scroller-wrap_unlimited';
								if ( contentHeight > maxHeight ){
									scrollWrapper
										.height( maxHeight )
										.removeClass( maxHeightClass );
									isScrollable = true;
								} else {
									scrollWrapper
										.css( 'height', '' )
										.addClass( maxHeightClass );
									isScrollable = false;
								}
							})();
						}
						if ( ! scrollerEngine ){
							scrollerEngine = scroller.baron({
								barOnCls: "baron",
								bar: ">.scroller__container>.scroller__bar span"
							} );
							if ( isWithFixedHeaders ){
								scrollerEngine.fix({
									elements : '.js-scroller-head',
									outside: 'news-top__fixed',
									before: 'news-top__position-top',
									after: 'news-top__position-bottom'
								})
							}
							scrollTop();
						} else {
							scrollerEngine.update();
							scroller.trigger( 'sizeChange' );
						}

						$timeout(function (){
							scrollerEngine.update();
							scroller.trigger( 'sizeChange' );

							if ( onHideScroll && ! scroller.hasClass( 'baron' ) ){
								scope.$apply( onHideScroll );
							}

						}, 50 );

						if ( scrollTopOnUpdate ){
							scrollTop();
						}
					}
				}

				function scrollTop(){
				    scroller.scrollTop( 0 );
				}

				attrs.$observe( 'customScroll', function ( v ){
					$timeout( actualizeScroll, 100 );
				} );

				scroller.on( 'updateScroll', function (){
					$timeout( actualizeScroll, 100 );
				} );

				if ( 'customScrollTop' in attrs ){
					attrs.$observe( 'customScrollTop', function ( v ){
						$timeout( scrollTop, 100 );
					} );
				}

				$document.on( 'panelsResize', actualizeScroll );

			}
		}
	}] );

	myAppDirectives.directive( 'linksTarget', [ '$window', '$location', function ( $window, $location ){
		return {
			restrict : 'A',
			link     : function ( scope, elem, attrs ){
				var
					target = attrs.linksTarget;
				elem.on( 'click', 'a', function( e ){
					var href = angular.element( this ).attr( 'href' );
					if ( ! href.match( /^https?:\/\//) ){
						return true;
					}
					switch( target ){
						case '_blank':
							$window.open( href );
							break;
						case '_self':
						case '_top':
						default:
							$location.url( href );
							break;
					}
					e.preventDefault();
					return false;
				});
			}
		}
	}]);


	myAppDirectives.directive( 'keyboardNavigateAutocomplete', [ '$timeout', function ( $timeout ){
		return {
			restrict : 'A',
			link     : function ( scope, elem, attrs ){
				var
					data = angular.fromJson( attrs.keyboardNavigateAutocomplete ),
					autoCompleteData = scope.$eval( data.data ),
					onChange = scope.$eval( data.onChange ) || function(){},
					listClass = 'autocomplete_items',
					itemClass = 'autocomplete_item',
					fieldClass = 'autocomplete_field',
					itemHighlightedClass = 'is-selected',
					field = elem.find( '.' + fieldClass ),
					list = elem.find( '.' + listClass),
					scroller,
					scrollTimer;

				function actualizeScroll( diff ){
					if ( isNaN( autoCompleteData.highlightedIndex ) ){
						return;
					}
					if ( ! scroller ){
						scroller = elem.find( '.scroller' );
					}
					var
						highlightedItem = list.find( '.' + itemClass + ':visible' )
							.eq( autoCompleteData.highlightedIndex)
							.addClass( itemHighlightedClass);

					if ( ! highlightedItem.length ){
						return;
					}
					var
						viewportHeight = scroller.height(),
						viewportTop = scroller.scrollTop(),
						hiHeight = highlightedItem.height(),
						hiTop = highlightedItem.position().top,
						hiBottom = hiTop + hiHeight;
					highlightedItem.prev().removeClass( itemHighlightedClass );
					highlightedItem.next().removeClass( itemHighlightedClass );

					if ( hiBottom > viewportHeight ){
						scroller.scrollTop( hiTop + viewportTop );
						/* Using delayed update to ensure that spinner block is visible already */
						if ( scrollTimer ){
							$timeout.cancel( scrollTimer );
						}
						scrollTimer = $timeout(function (){
							scroller.scrollTop( hiTop + viewportTop );
						}, 50)
					}
					else if ( hiTop < 0 ){
						scroller.scrollTop( hiBottom + viewportTop - viewportHeight );
					}

				}
				function changeHighlightedIndex( diff ){
					autoCompleteData.highlightedIndex = isNaN( autoCompleteData.highlightedIndex )
						? 0
						: Math.min(
						autoCompleteData.items.length - 1,
						Math.max( 0,
							autoCompleteData.highlightedIndex + diff
						)
					);
					onChange();
					actualizeScroll();
				}
				field.on( 'keydown', function ( event ){
					switch ( event.which ){
						case 38:
							changeHighlightedIndex( -1 );
							event.preventDefault();
							break;
						case 40:
							changeHighlightedIndex( 1 );
							event.preventDefault();
							break;
					}
				});
			}
		}
	}]);


	myAppDirectives.directive( 'customSearch', [ '$document', function ( $document ){
		return {
			template : '<div>\
				<div class="search input" ng-class="{\'input__advanced-open\':advancedSearchOpened}" data-keyboard-navigate-autocomplete=\'{"data" : "autoCompleteData" }\'>\
				<button class="js-show-search" ng-click="! advancedSearchOpened && HideAutoComplete();advancedSearchOpened = ! advancedSearchOpened">\
					<i></i>\
				</button>\
				<div class="search-list search-list_free" ng-show="autoCompleteShow && autoCompleteData.items.length">\
					<div data-custom-scroll="{{autoCompleteData.items.length + autoCompleteData.query + autoCompleteShow.toString()}}" data-custom-scroll-top="{{autoCompleteData.query + autoCompleteShow.toString()}}" data-custom-scroll-self data-custom-scroll-max-height="190" data-custom-scroll-on-scroll="DoAutoComplete({more:true})">\
						<ul class="search-list__items autocomplete_items">\
							<li ng-repeat="autoItem in autoCompleteData.items" class="search-list__item autocomplete_item">\
								<a ng-click="ChooseItemAutoComplete(autoItem)" class="search-list__link">\
									<span class="search-list__img">\
										<i class="icon" ng-class="\'icon_type_\'+autoItem.group"></i>\
									</span>\
									<span class="search-list__text">\
										{{autoItem.title}}\
									</span>\
								</a>\
							</li>\
						</ul>\
						<div class="loader loader_list" ng-show="autoCompleteData.inProgress && ! autoCompleteData.isFull">\
							<img src="i/loader.gif" alt="">\
							<span>\
							' + GLOBAL.l10n( 'Загрузка...' ) + '\
							</span>\
						</div>\
					</div>\
					<div ng-show="selectedFeed.id && selectedFeed.id != CONST.FEED_COMMON_ID && selectedFeed.type != CONST.FEED_TYPE_FAV" class="search-list__item search-list__item_fixed">\
						<span ng-click="DoSearch( true )" class="search-list__link">\
							<span class="search-list__img">\
								<i class="icon icon_all"></i>\
							</span>\
							<span class="search-list__text">\
								' + GLOBAL.l10n('Искать во всех лентах') + '\
							</span>\
						</span>\
					</div>\
				</div>\
			</div>\
			<div class="search-objects" ng-show="advanced.advancedObjectsList.length">\
				<div class="tags-wrap">\
					<span ng-repeat="tagItem in advanced.advancedObjectsList" class="tag" ng-class="{\'tag_highlighted\':tagItem._highlighted}">\
						<b class="icon" ng-class="\'icon_tiny_type_\' + tagItem.group"></b>\
						{{tagItem.title}}<span class="tagitem-del" ng-click="RemoveSearchObject(tagItem.sid)"><i></i></span>\
					</span>\
				</div>\
			</div>\
		</div>',
			replace : true,
			restrict : 'A',
			compile : function compile( templateElement, templateAttrs ){
				var data = templateAttrs.customSearch
					? angular.fromJson( templateAttrs.customSearch )
					: {};
				templateElement.find( '.search' ).prepend( '<input type="text" class="autocomplete_field" placeholder="{{getSearchFieldPlaceholder()}}" ng-model="' + data.fieldModel + '" ng-change="DoAutoComplete()" on-focus="ShowAutoComplete()" on-focusout="HideAutoComplete()" on-keyesc="HideAutoComplete()" autocomplete="off"/>' );

				if ( ! data.advButton ){
					templateElement.find( '.js-show-search' ).remove();
				}

				return {
					post : function ( scope, elem, attrs ){
					    var fieldElement = elem.find( 'input:text:first' );
						if ( ! data.searchPlaceholder ){
							fieldElement.removeAttr( 'placeholder' );
						}
						fieldElement.on( 'keypress', function ( evt ){
							if ( 13 == evt.which ){
								scope.SearchSubmit();
								evt.preventDefault();
								evt.stopPropagation();
								return false;
							}
						} );

						scope.$watch( 'advanced.advancedObjectsList.length', function(){
							elem.closest( '.elastic-height' ).trigger( 'elasticHeightChange' );
						} )
					}
				}

			},
			controller : [ '$scope', '$rootScope', '$attrs', '$timeout', 'suggestService', function ( $scope, $rootScope, $attrs, $timeout, suggestService ){
				var data = $attrs.customSearch
					? angular.fromJson( $attrs.customSearch )
					: {};
				$scope.autoCompleteData = suggestService.initAutoCompleteData();
				$scope.autoCompleteShow = false;
				$scope.DoAutoComplete = function( options ){ //input
					var
						_options = angular.extend( {
							more : false
						}, options || {}),
						query = $scope.advanced.searchText;
					if ( ! _options.more ){
						/* Making new query */
						$scope.autoCompleteData.highlightedIndex = NaN;
					}
					console.log('try auto complete: '+query)
					if (query != ''){
						suggestService.getAutoComplete( query, _options );
						$scope.autoCompleteShow = true;
					}else{
						$scope.HideAutoComplete();
					}
				};

				$scope.removeWordFromSearchText = function ( word ){
					if ( ! word ){
						return;
					}
					var
						sprt = /[ \s\xA0]+/,
						pt = new RegExp( '(.?)' + word + '(.?)', 'g' );
					$scope.advanced.searchText = $scope.advanced.searchText.replace( pt, function ( m0, m1, m2 ){
						if (
							( ! m1 || m1.match( sprt ) )
								&& ( ! m2 || m2.match( sprt ) )
							){
							return m1 + m2;
						}
						return m0;
					} );
				}

				function getSelectedObjectBySid( sid ){
					return _.find( $scope.advanced.advancedObjectsList, function( item ){
						return item.sid == sid;
					} )
				}
				$scope.ChooseItemAutoComplete = function ( obj ){
					var
						prevAddedObject,
						newObject,
						highlightTime = 1000;
					if ( prevAddedObject = getSelectedObjectBySid( obj.sid ) ){
						/*
						* Seems like this object has added already
						* So skip adding and just highlighted added clone
						*/
						prevAddedObject._highlighted = true;
						$timeout(function(){
							prevAddedObject._highlighted = false;
						},highlightTime);
					}
					else{
						newObject = {
							title        : obj.title,
							sid          : obj.sid,
							type         : obj.type,
							group        : obj.group,
							_highlighted : true
						};
						$scope.advanced.advancedObjectsList.push( newObject );
						$timeout(function(){
							newObject._highlighted = false;
						},highlightTime);
					}
					$scope.removeWordFromSearchText( obj.suggest_string );
					$scope.HideAutoComplete();
				}

				$scope.ShowAutoComplete= function(){
					if ($scope.advanced.searchText != '' && !$scope.autoCompleteShow){
						$scope.autoCompleteShow = true;
						$scope.DoAutoComplete();
					}
				};

				$scope.HideAutoComplete= function(){
					$timeout(function(){
						if ($scope.autoCompleteShow){
							suggestService.clearAutoComplete();
							$scope.autoCompleteShow = false;
							$scope.autoCompleteData.highlightedIndex = NaN;
						}
					}, 200);
				};

				$scope.SearchSubmit = function (){
					if ( $scope.autoCompleteShow && ! isNaN( $scope.autoCompleteData.highlightedIndex ) && $scope.autoCompleteData.items[$scope.autoCompleteData.highlightedIndex] ){
						$scope.ChooseItemAutoComplete( $scope.autoCompleteData.items[$scope.autoCompleteData.highlightedIndex] );
					}
					else if ( data.onSubmit ){
						$scope.$eval( data.onSubmit );
					}
					return false;
				}

				$scope.RemoveSearchObject = function(sid){
					var res = [];
					_.each($scope.advanced.advancedObjectsList, function(o){
						if (o.sid != sid){
							res.push(o);
						}
					});
					$scope.advanced.advancedObjectsList = res;
				};
			} ]
		}
	}]);

	myAppDirectives.directive( 'checkbox', [ '$document', function ( $document ){
		return {
			template : '<label class="check">\
					<input type="checkbox" name="check" />\
					<span><i></i></span>\
				</label>',
			replace : true,
			restrict : 'A',
			compile : function compile( templateElement, templateAttrs ){
				var
					fieldAttrs,
					field = templateElement.find( '>input' );
				if ( templateAttrs.checkbox ){
					field
						.attr( 'ng-model', templateAttrs.checkbox )
						.next('span' ).attr('ng-class', '{\'is-checked\':' + templateAttrs.checkbox + '}' );
				}
				if ( templateAttrs.checkboxAttrs ){
					/*
					 * checkboxAttrs contains attributes need to be applied to checkbox field
					 * Point is to avoid duplicate these attributes at parent container
					 * Useful for directives
					 */
					fieldAttrs = angular.fromJson( templateAttrs.checkboxAttrs );
					angular.forEach( fieldAttrs, function ( val, attr ){
						field.attr( attr, val );
					})
				}
				if ( 'checkboxSmart' in templateAttrs ){
					templateElement.find( 'span' ).addClass( 'is-partly-selected' ).html( '<em></em>' );
				}
				if ( templateAttrs.checkboxLabel ){
					templateElement.append('<strong>'+ templateAttrs.checkboxLabel + '</strong>' );
				}

				return {
					post : function ( scope, elem, attrs ){
					    elem.children('input').on( 'click', function ( event ){
					        if ( attrs.checkboxClick ){
						        scope.$eval( attrs.checkboxClick );
					        }
						    event.stopPropagation();
					    })
					}
				}
			}
		}
	}]);

	myAppDirectives.directive( 'sidebar', [ '$window', '$document', '$timeout', function ( $window, $document, $timeout ){
		return {
			restrict : 'A',
			link     : function ( scope, elem, attrs ){
				var
					isOpen = false,
					overlay = angular.element( '.overlay' ),
					windowElement = angular.element( $window ),
					sidebar = elem,
					sidebarActiveClass = 'l-sidebar_active';

				function open(){
				    if ( isOpen ){
					    return;
				    }
					overlay
						.on( 'click.sidebar', close )
						.fadeIn();
					$document.find( 'body' ).addClass( 'is-overlayed' );
					windowElement
						.on( 'resize.sidebar', close );
					sidebar.addClass( sidebarActiveClass );
					isOpen = true;
					scope.$eval( attrs.sidebar + '=true' );
					$timeout(function (){
					    $document.trigger( 'layoutUpdate' );
					}, 200)
				}
				function close(){
				    if ( ! isOpen ){
					    return;
				    }
					overlay
						.off( '.sidebar' )
						.fadeOut();
					$document.find( 'body' ).removeClass( 'is-overlayed' );
					windowElement
						.off( '.sidebar' );
					sidebar.removeClass( sidebarActiveClass );
					isOpen = false;
					scope.$eval( attrs.sidebar + '=false' );
				}

				scope.$watch( attrs.sidebar, function ( v ){
					if ( v ){
						open();
					}
					else {
						close();
					}
				} );

			}
		}
	}] );


	myAppDirectives.directive( 'panelsLayout', [ '$document', '$window', '$timeout', function ( $document, $window, $timeout ){
		return {
			restrict : 'A',
			link     : function ( scope, elem, attrs ){
				var
					data = angular.fromJson( attrs.panelsLayout ),
					windowElement = angular.element( $window ),
					layoutElement = elem.find( '.l-layout' ),
					leftPanelElement = layoutElement.find( '.l-col-left' ),
					rightPanelElement = layoutElement.find( '.l-col-right' ),
					dragElement = layoutElement.find( '.drag span' ),
					panelsRatio = scope.$eval( data.leftWidth ),
					prevLeftWidth,
					panelsResizeTimer;


				function actualizeLayout(){
					if ( panelsRatio !== null && ! isNaN( panelsRatio ) && panelsRatio < 1 ){
						var
							layoutWidth = layoutElement.width(),
							leftWidth = layoutWidth * panelsRatio,
							rightWidth = layoutWidth - leftWidth;
						
						if ( leftWidth < 390 ) {
							leftWidth = 390;
							rightWidth = layoutWidth - leftWidth;
							panelsRatio = leftWidth / layoutWidth ;
							prevLeftWidth = undefined;
						}
						
						if ( rightWidth < 451 ) {
							rightWidth = 451;
							leftWidth = layoutWidth - rightWidth;
							panelsRatio = leftWidth / layoutWidth ;
							prevLeftWidth = undefined;
						}
						
						if ( prevLeftWidth != leftWidth ){
							dragElement.css('left', leftWidth);
							leftPanelElement
								.width( leftWidth );
							rightPanelElement
								.width( rightWidth  )
								.toggleClass( 'l-col-right_width', rightWidth >= 1280 )
								.toggleClass( 'is-min-width', rightWidth <= 451 )
								.toggleClass( 'is-middle-width', rightWidth <= 520 );

							prevLeftWidth = leftWidth;
							if ( panelsResizeTimer ){
								$timeout.cancel( panelsResizeTimer );
							}
							panelsResizeTimer = $timeout(function(){
								rightPanelElement
									.width( rightWidth  );
								$document.trigger( 'panelsResize' );
							},50)
						}
					}
				}

				if ( dragElement.length ){
					dragElement.draggable({
						axis:'x',
						containment:'parent',
						drag: function( event, ui ){
							panelsRatio = ui.position.left / layoutElement.width();
							actualizeLayout();
						},
						stop   : function ( event, ui ){
							panelsRatio = ui.position.left / layoutElement.width();
							actualizeLayout();
							$( document ).trigger( 'panelsResize', {
								panelsRatio : panelsRatio
							} );
						}
					});
				}

				$document.on( 'layoutUpdate', actualizeLayout );
				windowElement.on( 'resize', actualizeLayout );

				scope.$watch( data.leftWidth, function( v ){
					if ( v != panelsRatio ){
						panelsRatio = v;
						actualizeLayout();
					}
				} );

			}
		}
	}] )

	myAppDirectives.directive( 'wallToggle', [ '$window', '$document', '$timeout', 'userSettingsService', function ( $window, $document, $timeout, userSettingsService ){
		return {
			restrict : 'A',
			link     : function ( scope, elem, attrs ){
				var
					isOpen = false,
					overlay = angular.element( '.overlay' ),
					windowElement = angular.element( $window ),
					wallToggleElement = elem,
					layoutElement = angular.element( '.l-layout' ),
					wallElement = angular.element( '.l-wall-news' ),
					isSaveState = 'wallSaveState' in attrs,
					toggleActiveClass = 'is-active';

				function open( isUserAction ){
				    if ( isOpen ){
					    return;
				    }
					wallToggleElement.addClass( toggleActiveClass );
					isOpen = true;
					if ( isUserAction === true ){
						wallElement.animate({ 'right': 0 },{
							step: function( event, pos ){
								layoutElement.css( 'right', 210 + pos.now );
								onAnimationComplete();
							},
							complete : function(){
								layoutElement.css({ right: 210 });
								wallElement.css( 'right', 0 );
								onAnimationComplete();
							}
						});
						
					}
					else{
						layoutElement.css( 'right', 210 );
						wallElement.css( 'right', 0 );
						onAnimationComplete();
					}
					scope.$eval( attrs.wallToggle + '=true' );
					if ( isSaveState && isUserAction ){
						saveState();
					}
					if ( attrs.wallOnOpen ){
						scope.$eval( attrs.wallOnOpen );
					}
				}
				function close( isUserAction ){
				    if ( ! isOpen ){
					    return;
				    }
					isOpen = false;
					wallToggleElement.removeClass( toggleActiveClass );
					wallElement.animate({ right: -210 },
						{
							step: function( event, pos ){
								layoutElement.css({ right : 210 + pos.now });
								onAnimationComplete();
							},
							complete : function(){
								layoutElement.css({ right : 0 });
								onAnimationComplete()
							}
						}
					);
					scope.$eval( attrs.wallToggle + '=false' );
					if ( isSaveState && isUserAction ){
						saveState();
					}
				}

				wallToggleElement.on( 'click', function (){
					if ( isOpen ){
						close( true );
					}
					else{
						open( true );
					}
				});

				function onAnimationComplete(){
					$document.trigger( 'layoutUpdate' );
				}

				function saveState(){
					userSettingsService.setUserSettings( { 'wallOpened' : isOpen } );
				}

				scope.$watch( attrs.wallToggle, function ( v ){
					if ( v ){
						open( v == 'animate' );
					}
					else {
						close();
					}
				} );

			}
		}
	}] );

	myAppDirectives.directive( 'printWhenReady', [ '$window', '$timeout', function ( $window, $timeout ){
		return {
			restrict : 'A',
			link     : function ( scope, elem, attrs ){
				scope.$watch( attrs.printWhenReady, function ( v, prev ){
				    if ( v === true && prev === false ){
					    $timeout( $window.print, 200 );
					    console.log( 'print article' );
				    }
				} )
			}
		}
	} ] );

	/**
	 * Simple imitation of modernizr lib
	 * If there will be too much signs it's better to use lib
	 */
	myAppDirectives.directive( 'envClass', [ function (){
		return function ( scope, elem, attrs ){
			var signs = {
				'is-ios' : function (){
					return ! ! navigator.userAgent.match(/(iPhone|iPod|iPad)/i);
				},
				'is-touch' : function (){
					return ! ! (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
				}
			}
			angular.forEach( signs, function ( signFn, signClass ){
			   elem.toggleClass( signClass, ! ! signFn() );
			});
		}
	} ] );


	myAppDirectives.directive( 'allowPlaceholders', [ function (){
		return function ( scope, elem, attrs ){
			elem.find( 'input, textarea' ).placeholder();
		}
	} ] );

	myAppDirectives.directive( 'tooltip', [ '$document', '$timeout', function ( $document, $timeout ){
		return {
			restrict : 'A',
			link     : function ( scope, elem, attrs ){
				var
					tooltip = angular.element( '<span class="tooltip">' + attrs.tooltip + '</span>' );

				if ( 'tooltipInside' in attrs ){
					elem
						.append( tooltip )
						.addClass( 'tooltiped_inside' );
				}
				else{
					elem.after( tooltip );
				}
				attrs.$observe( 'tooltip', function ( v ){
					tooltip.html( v );
				});
				elem.addClass( 'tooltiped' );
			}
		}
	} ] );

	myAppDirectives.directive( 'tutorial', [ '$document', '$window', '$timeout', function ( $document, $window, $timeout ){
		var
			windowElem = angular.element( $window ),
			slidesData = [
			{
				hint : GLOBAL.l10n( 'Создавайте свои новостные потоки, фильтруя ленты по ключевым словам' ),
				beforePlace : function ( target ){
					var
						windowHeight = windowElem.height(),
						scroller = target.closest( '.scroller' ),
						top = scroller.scrollTop() + target.closest( '.nav' ).position().top,
						offsetTop = -50,
						newScrollTop = Math.max( 0, top + offsetTop - windowHeight );
					scroller.scrollTop( newScrollTop );
				}
			},
			{
				hint : GLOBAL.l10n( 'Меняйте  конфигурацию под себя — добавляйте и удаляйте ленты из списка оперативного доступа' ),
				beforePlace : function ( target ){
					target.closest( '.scroller' ).scrollTop( 0 );
				}
			},
			{
				hint : GLOBAL.l10n( 'Используйте быстрый фильтр по «молниям»' )
			},
			{
				hint : GLOBAL.l10n( 'Настройте удобный вид отображения лент — только заголовки, заголовки и указания на продукты, заголовки и лиды' )
			},
			{
				hint : GLOBAL.l10n( 'Просматривайте все новости и будьте в курсе событий дня даже в режиме оперативного поиска' )
			}
		];
		return {
			restrict : 'A',
			template : '<div class="tutorial">\
							<div class="tutorial__slide">\
								<div class="tutorial__slide-pos">\
									<span class="tutorial__bg-section tutorial__bg-section_t"></span>\
									<span class="tutorial__bg-section tutorial__bg-section_r"></span>\
									<span class="tutorial__bg-section tutorial__bg-section_b"></span>\
									<span class="tutorial__bg-section tutorial__bg-section_l"></span>\
									<span class="tutorial__bg-middle"></span>\
									<div class="tutorial__hint" ng-bind-html-unsafe="slides[num].hint"></div>\
								</div>\
							</div>\
							<div class="tutorial__toolbar">\
								<ul class="tutorial__pins">\
									<li ng-repeat="slide in slides" class="tutorial__pin" ng-click="showSlide( $index )" ng-class="{\'tutorial__pin_active\':$index == num}"><span class="tutorial__pin-core" ng-bind="$index + 1"></span></li>\
								</ul>\
								<span class="tutorial__jump tutorial__jump_prev" ng-bind="\'Назад\' | l10n" ng-click="showSlide( num - 1 )" ng-show="num > 0"></span>\
								<span class="tutorial__jump tutorial__jump_next" ng-bind="\'Далее\' | l10n" ng-click="showSlide( num + 1 )" ng-show="num < slides.length - 1"></span>\
								<span class="tutorial__jump tutorial__jump_finish" ng-bind="\'Начать работу\' | l10n" ng-click="model.opened = false" ng-show="num == slides.length - 1"></span>\
							</div>\
						</div>',
			replace : true,
			link : function ( scope, elem, attrs ){
				if ( ! ! navigator.userAgent.match(/(iPhone|iPod|iPad)/i) ){
					return;
				}
				var
					globalClassHolder = $document.find( 'body' ),
					hintElem = elem.find( '.tutorial__hint' ),
					slidePosElem = elem.find( '.tutorial__slide-pos' ),
					targetElem;
				scope.model = scope.$eval( attrs.tutorial );
				function openTutorial(){
					if ( ! elem.is( ':visible' ) ){
						scope.model.opened = true;
						elem.fadeIn();
						actualizeSlideLayout();
					}

					globalClassHolder.addClass( 'tutorial-on' );
					scope.showSlide( 0 );
					windowElem
						.off( '.tutorial' )
						.on( 'resize.tutorial', actualizeSlideLayout );
				}
				function closeTutorial(){
					elem.hide();
					scope.model.opened = false;
					globalClassHolder.removeClass( 'tutorial-on' );
					windowElem.off( '.tutorial' );
				}

				function actualizeSlideLayout(){
					if ( ! targetElem || ! targetElem.length ){
						targetElem = $document.find( '.tutorial-target_' + scope.num );
					}
					if ( ! targetElem.length ){
						return;
					}
					var
						slide = scope.slides[scope.num],
						windowHeight = windowElem.height(),
						targetWidth = targetElem.outerWidth(),
						targetHeight = targetElem.outerHeight(),
						targetOffsetLeft = targetElem.data( 'tutorialTargetOffsetLeft' ) || 0,
						targetOffsetTop = targetElem.data( 'tutorialTargetOffsetTop' ) || 0,
						pos,
						hintPosBottomRight,
						hintHeight;
					if ( slide.beforePlace ){
						slide.beforePlace( targetElem );
					}
					pos = targetElem.offset();
					pos.left = ( pos.left + targetWidth * 0.5 ) + targetOffsetLeft;
					pos.top = ( pos.top + targetHeight * 0.5 ) + targetOffsetTop;
					hintHeight = hintElem.outerHeight();
					hintPosBottomRight = ( pos.top + hintHeight < windowHeight );
					hintElem
						.toggleClass( 'tutorial__hint_tl', ! hintPosBottomRight )
						.toggleClass( 'tutorial__hint_br', hintPosBottomRight )
					slidePosElem
						.css( pos );

				}

				scope.$watch( attrs.tutorial + '.opened', function ( v ){
					if ( v ){
						openTutorial();
					}
					else{
						closeTutorial();
					}
				} );


				scope.$watch( 'num', function ( v, prev ){
				    globalClassHolder
					    .removeClass( 'tutorial-on_' + prev )
					    .addClass( 'tutorial-on_' + v );
					targetElem = $document.find( '.tutorial-target_' + v );
					if ( scope.model.opened ){
						$timeout( actualizeSlideLayout, 100 );
					}
				})
			},
			controller : [ '$scope', '$attrs', function ( $scope, $attrs ){
				$scope.num = null;
				$scope.prevNum = null;
				$scope.slides = slidesData;
				$scope.showSlide = function ( slideNum ){
					$scope.num = slideNum;
				}


			}]
		}
	} ] );

	myAppDirectives.directive( 'tutorialTarget', [ function (){
		return function ( scope, elem, attrs ){
			elem.addClass( 'tutorial-target_' + attrs.tutorialTarget );
		}
	} ] );


})();