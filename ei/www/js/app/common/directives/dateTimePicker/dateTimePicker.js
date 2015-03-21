angular.module( 'index' )
	.directive( 'dateTimePicker', [ '$rootScope', '$log', '$timeout', function( $rootScope, $log, $timeout ){
		return {
			scope    : {
				model    : '=ngModel',
				min      : '@',
				onChange : '&'
			},
			require  : 'ngModel',
			template : '<div class="date-picker" data-ng-class="{\'date-picker_active\': isActive}">' +
				'<input type="text"  class="date-picker__field" data-date-format="{{format}}"/>' +
				'<span class="icon icon_calend date-picker__toggler" role="date-picker-toggler"></span>' +
				'</div>',
			replace  : true,
			link     : function( scope, element, attrs, modelCtrl ){
				var
					inputElement = element.find( '>input' ),
					togglerElement = element.find( '>[role="date-picker-toggler"]' ),
					initPicker = _.once( function(){
						inputElement.datetimepicker( {
							language   : 'ru',
							useCurrent : true,
							minDate    : moment( scope.min ).format(),
							maxDate    : moment()
						} );
						picker = inputElement.data( 'DateTimePicker' );

						scope.$watch( 'model', function( v ){
							var
								newModel, currentDate;
							if( angular.isDate( v ) || moment.isMoment( v ) ){
								newModel = moment( v );
								currentDate = picker.getDate();
								if( ! currentDate || ! newModel.isSame( currentDate ) ){
									picker.setDate( newModel );
								}
							}
						} );
						scope.$on( 'contentUpdated', function (){
							inputElement.blur();
						});
					} ),
					picker;

				scope.isActive = false;
				scope.format = attrs.format || 'DD.MM.YYYY, HH:mm';

				togglerElement.on( 'click', function(){
					inputElement.focus();
				} );

				$timeout( initPicker );


				inputElement
					.on( 'dp.change', function( event ){
						var
							newModel = event.date;
						if( newModel && newModel.isValid() && ( ! scope.model || ! newModel.isSame( scope.model ) ) ){
							modelCtrl.$setViewValue( newModel );
							scope.onChange( newModel );
							scope.$apply();
						}
					} )
					.on( 'dp.show', function( event ){
						scope.isActive = true;
						scope.$apply();
					} )
					.on( 'dp.hide', function( event ){
						scope.isActive = false;
					} );

			}
		};

	}] );