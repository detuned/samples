angular.module( 'plugin.panel' )
	.service( 'panelSectionsService', [
		'$log',
		'$timeout',
		'utilsService',
		'dispatchService',
		'configService',
		'userService',
		'eventsFabricService',
		function( $log, $timeout, utilsService, dispatchService, configService, userService, eventsFabricService ){
			var
				timers = utilsService.timersManager(),
				events = eventsFabricService.getInstance({ name : 'sectionsService' } ),
				panelSectionsService = {},
				registry = {
				},
				aliases = {
				},
				disabled = {},
				/**
				 * Currently displayed sections status
				 */
					sections = {};

			panelSectionsService.disabled = disabled;

			panelSectionsService.getSectionConfig = function( name ){
				var section = registry[ name ];
				if( section ){
					section.name = name;
				}
				return section;
			};

			panelSectionsService.isSectionDisabled = function ( name ){
				return disabled[ name ];
			};

			panelSectionsService.Section = Section;

			function Section( name ){
				if( sections[name] ){
					return sections[name];
				}
				var
					data = {
						marked  : false,
						warned  : false,
						updates : 0
					},
					section = {},
					isMarkedFn = function(){
						return data.marked;
					},
					isWarnedFn = function(){
						return ! getUpdatesFn() && data.warned;
					},
					getUpdatesFn = function(){
						return data.updates;
					};

				section.isMarked = function(){
					return isMarkedFn();
				};
				section.setMarked = function( state ){
					if( _.isFunction( state ) ){
						isMarkedFn = state;
					}
					else {
						data.marked = ! ! state;
					}
				};
				section.setMarkedFunction = function( fn ){
					data.marked = ! ! state;
				};

				section.isWarned = function(){
					return isWarnedFn();
				};

				section.setWarned = function( state ){
					if( _.isFunction( state ) ){
						isWarnedFn = state;
					}
					else {
						data.warned = ! ! state;
					}
				};

				section.setUpdates = function( num ){
					if( _.isFunction( num ) ){
						getUpdatesFn = num;
					}
					else {
						data.updates = + num;
					}
				};
				section.getUpdates = function(){
					return getUpdatesFn();
				};

				section.activate = function(){
					section.setWarned( false );
				};

				section.deactivate = function(){
				};

				sections[name] = section;

				return section;
			}

			function actualizeDisabled( newDisabled ){
				utilsService.updateObject( disabled, newDisabled );
			}

			userService.on( 'updateInitData', function ( initData ){
				if( initData.disabledSections ){
					actualizeDisabled( initData.disabledSections );
				}
			} );

			if ( userService.initData.disabledSections ){
				actualizeDisabled( userService.initData.disabledSections );
			}

			dispatchService
				.listen( 'sys::warningShow', function( data ){
					if( ! data.section || ! registry[data.section] ){
						$log.warn( 'panelSectionsService: got signal to show warning but have to ignore because of bad data', data );
					}
					timers.resetTimer( data.section + '_warn' );
					Section( data.section ).setWarned( true );
					if( data.ttl ){
						timers.setTimer( data.section + '_warn', function(){
							Section( data.section ).setWarned( false );
						}, data.ttl * 1000 );
					}
				} )
				.listen( 'sys::warningHide', function( data ){
					if( ! data.section || ! registry[data.section] ){
						$log.warn( 'panelSectionsService: got signal to hide warning but have to ignore because of bad data', data );
					}
					timers.resetTimer( data.section + '_warn' );
					Section( data.section ).setWarned( false );
				} );

			_.each( registry, function ( item, id ){
				dispatchService
					.listen( 'sectionToggle::' + id, function( data ){
						if ( data.disable ){
							$log.log( 'section', id, 'disabled' );
							events.trigger( 'sectionDisable', { sectionId : id } )();
							disabled[id] = true;
						}
						else{
							$log.log( 'section', id, 'enabled' );
							events.trigger( 'sectionEnable', { sectionId : id } )();
							delete disabled[id];
						}
					} );
			});

			panelSectionsService.on = events.on();


			return panelSectionsService;
		}] );