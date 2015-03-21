angular.module( 'plugin.panel' )
	.directive( 'menuItem', [
		'$compile',
		'panelSectionsService',
		'pluginService',
		function( $compile, panelSectionsService, pluginService ){
			return {
				templateUrl : pluginService.getTemplateUrl( '//panel/common/menuItem' ),
				replace     : true,
				scope       : true,
				link        : function( scope, element, attrs ){
					var
						name = attrs.menuItem,
						sectionConfig = panelSectionsService.getSectionConfig( name ),
						section = panelSectionsService.Section( name );
					if( ! sectionConfig ){
						//Unknown section
						return;
					}
					element.addClass( 'pn-menu__item_' + name );
					$compile(
						element.html( '' +
							'<div class="pn-menu__item__core" data-panel-menu-item-' + name + ' role="panel-menu-item-' + name + '">' +
							'<div class="pn-menu__img">' +
							'<div class="pn-menu__icon"></div>' +
							'<div class="pn-menu__mark"></div>' +
							'<div class="pn-menu__updates" data-ng-bind="getUpdates()"  data-ng-show="getUpdates()"></div>' +
							'<div class="pn-menu__warn">!</div>' +
							'</div>' +
							'<div class="pn-menu__title">' +
							sectionConfig.title +
							'</div>' +
							'</div>'
						).contents()
					)( scope );


					scope.getUpdates = section.getUpdates;
					scope.isMarked = section.isMarked;
					scope.isWarned = section.isWarned;
					scope.getUpdates = section.getUpdates;
					scope.isSupportOffline = sectionConfig.supportOffline;
					scope.isActive = function(){
						return scope.activeSection && name === scope.activeSection.name;
					};

					scope.toggle = function(){
						if( scope.isActive() ){
							scope.deactivateSection();
						}
						else {
							scope.activateSection( name );
						}
					};

				}
			}
		}] );