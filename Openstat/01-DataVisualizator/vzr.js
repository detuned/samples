/**
 * Vzr is a tool for data visualization.
 * It can be extended by any number of engines,
 * each of which provides one of visualization types
 *
 * @link find demo at http://tldstat.com/tld/lv/report/domainsdynamic/#9:date=20120731-20130210&by=week
 * @author Maxim Smirnov <detunedtv@gmail.com>
 */


/**
 * Base Vzr namespace
 * It's single item placed in the global scope
 *
 * @type {Object}
 */
var Vzr = (function (){
	var
		/**
		 * Main lib path
		 * XXX Here and below need to use full paths cause of
		 * deployment system specific
		 *
		 * @type {String}
		 */
			enginesPath = '/a/tracker/report/vzr/engines',
		/**
		 * Config of usable visualization engines
		 * XXX It's simple to not hardcode them and make dynamical,
		 * if deployment system will change
		 *
		 * @type {Object}
		 */
			enginesConfig = {
			'histogram' : {
				path : '/a/tracker/report/vzr/engines/histogram/histogram.js'
			},
			'linechart' : {
				path : '/a/tracker/report/vzr/engines/linechart/linechart.js'
			},
			'geomap'    : {
				path : '/a/tracker/report/vzr/engines/geomap/geomap.js'
			}
		},

		/**
		 * The number of initialized engines
		 *
		 * @type {Number}
		 */
			globalEnginesNum = 0,


		/**
		 * Base 'class' describing any data set
		 * It could be inherited by endpoint classes,
		 * each of which describing one type of values: numeric, date etc
		 *
		 * @type {Object}
		 */
			DataSet = (function (){
			var

				/**
				 * Constructor of base engine
				 */
					DataSetBaseEngine = function ( p ){
					this.initialize.apply( this, arguments );
				},

				/**
				 * Storage for all engines
				 */
					dataSetEngines = {},

				/**
				 * Number of all initialized engines
				 *
				 * @type {Number}
				 */
					_dataSetNum = 0,

				/**
				 * Analyzes given params and selects most appropriate
				 * DataSet's inheritor and returns it as constructor
				 */
					getAppropriateEngine = function ( params ){
					if ( ! params ){
						return DataSetBaseEngine;
					}
					var
						type = params.type,
						/** @type {Array} */
							values,
						value;


					if (
						! type
							&& (values = $.isArray( params )
							? params
							: (params.values || []))
							&& (value = values[0])
						){
						/*
						 * If type was not set explicitly
						 * just trying to autodetect type by analyze first value
						 */
						if ( ! isNaN( + value ) ){
							type = dataSetObj.TYPE_NUMERIC;
						}
						else if ( is_date( value ) || String( value ).isDate() ){
							type = dataSetObj.TYPE_DATE;
						}
						// Add support of more value types here
					}
					if ( type && dataSetEngines[type] ){
						return dataSetEngines[type];
					}
					return DataSetBaseEngine;
				},

				/**
				 * Public of DataSet namespace
				 */
					dataSetObj = {
					TYPE_NUMERIC : 'numeric',
					TYPE_DATE    : 'date',
					BaseEngine   : DataSetBaseEngine,

					/**
					 * DataSet Instance
					 *
					 * @return {new Vzr.DataSet.BaseEngine}
					 */
					Instance : function ( setData ){
						var
							Engine = getAppropriateEngine( setData ),
							/** @type {new DataSet.BaseEngine} */
								instance = new Engine( { meta : {_id : _dataSetNum ++ } } );
						if ( setData ){
							if ( setData.length ){
								instance.setValues( setData )
							}
							else {
								if ( setData.values ){
									instance.setValues( setData.values );
								}
								if ( setData.meta ){
									instance.setMeta( $.extend( {}, setData.meta ) );
								}
							}
						}
						return instance;
					}
				};

			DataSetBaseEngine.EVENT_CHANGE_DATA = 'change_data';
			DataSetBaseEngine.prototype = {
				_meta : {
					/**
					 * Global unique id of dataset
					 * @type {Number} */
					_id   : undefined,
					/**
					 * Title of valueset
					 * @type {String}
					 */
					title : undefined,

					/**
					 * Flag means this dataset contains arguments (must be placed at X-Axis}
					 * @type {Boolean}
					 */
					arguments : false,

					/**
					 * Flag means this dataset contains values that can be summed with other
					 * @type {Boolean}
					 */
					additive    : true,
					/** @type {String} */
					caption     : undefined,
					/** @type {String} */
					unitCaption : undefined
					//TODO 'isArgumented' flag here
				},

				/**
				 * Data set type
				 * @type {String}
				 */
				_type : undefined,

				_maxValue : undefined,
				_minValue : undefined,

				/**
				 * @type {Array}
				 */
				_values : [],

				_rawValues : [],


				/** @type {String[]} */
				_captions : [],

				_reset : function (){
					this._maxValue = undefined;
					this._minValue = undefined;
					this._rawValues = [];
				},

				_actualize : function (){
				},

				initialize : function ( _params ){
					if ( _params && _params.meta ){
						this.setMeta( _params.meta );
					}
				},

				/**
				 * @param {Array}
				 */
				setValues : function ( v ){
					var $this = this;
					this._reset();
					this._values = [].concat( v );
					this._actualize();
					this.triggerEvent( DataSetBaseEngine.EVENT_CHANGE_DATA, {sets : $this._sets} );
				},

				setMeta : function ( m, v ){
					if ( $.isPlainObject( m ) ){
						this._meta = $.extend( {}, this._meta, m );
						$.extend( this._meta, m );
					}
					else if ( m ){
						this._meta[m] = v;
					}
				},

				/**
				 * @return {Array}
				 */
				getValues : function (){
					return this._values;
				},

				getValuesLength : function (){
					return this._values.length;
				},

				/**
				 * @param {Number}
				 * @return {Number}
				 */
				getValue : function ( index ){
					return this._values[index];
				},

				getFormattedValue : function ( index ){
					return this._values[index];
				},

				getGridCaption : function ( index ){
					return this._values[index];
				},

				getMaxValue : function (){
					if ( typeof this._maxValue == 'undefined' ){
						this._actualize();
					}
					return this._maxValue;
				},

				getMinValue : function (){
					if ( typeof this._minValue == 'undefined' ){
						this._actualize();
					}
					return this._minValue;
				},

				/**
				 * @return {String}
				 */
				getTitle : function (){
					return this._meta.title;
				},
				getMeta  : function ( v ){
					return v
						? this._meta[v]
						: this._meta;
				},
				getType  : function (){
					return this._type;
				},

				isArguments : function (){
					return ! ! this._meta.arguments
				},

				/**
				 * Checks if given dataSet is the same
				 *
				 * @param {new DataSetBaseEngine}
				 */
				isEqual : function ( dataSet ){
					return this._meta._id == dataSet._meta._id;
				},

				bind         : function (){
					var d = $( this );
					d.bind.apply( d, arguments );
				},
				triggerEvent : function ( event, eventData ){
					$( this ).triggerHandler( event, [eventData] );
				}
			};


			/**
			 * DataSetEngine type:numeric
			 */
			dataSetEngines[dataSetObj.TYPE_NUMERIC] = (function (){
				DataSetBaseEngine.apply( this, arguments );
			}).inheritsFrom( DataSetBaseEngine, {

					_type      : dataSetObj.TYPE_NUMERIC,
					_actualize : function (){
						if ( this._values.length ){
							/* Updating extremes */
							for ( var i = 0, l = this._values.length; i < l; i ++ ){
								if ( ! isNaN( this._values[i] ) ){
									/* Yes, numeric datasets may consists of not-numbers too */
									this._maxValue = this._maxValue
										? Math.max( this._values[i] || 0, this._maxValue )
										: this._values[i] || 0;
									this._minValue = this._minValue
										? Math.min( this._values[i] || 0, this._minValue )
										: this._values[i] || 0;
								}
							}
						}
					}
				} );

			/**
			 * DataSetEngine type:date
			 */
			(function (){

				var
					STEP_DAY = 'day',
					STEP_MONTH = 'month';

				dataSetEngines[dataSetObj.TYPE_DATE] = (function (){
					DataSetBaseEngine.apply( this, arguments );
				}).inheritsFrom( DataSetBaseEngine, {

						_type             : dataSetObj.TYPE_DATE,
						_actualize        : function (){
							var
								isConverted,
								diff;
							if ( this._values.length ){
								if ( ! (isConverted = is_date( this._values[0] )) ){
									this._rawValues = [];
								}
								for ( var i = 0, l = this._values.length; i < l; i ++ ){
									if ( ! isConverted ){
										this._rawValues = this._values[i];
										this._values[i] = this.convertToDate( this._values[i] );
									}

									this._maxValue = this._maxValue && this._values[i].getTime() < this._maxValue.getTime()
										? this._maxValue
										: this._values[i];
									this._minValue = this._minValue && this._values[i].getTime() > this._minValue.getTime()
										? this._minValue
										: this._values[i];
								}

								/* Trying to autodetect step */
								if ( ! this._meta.step && this._values[0] && this._values[1] ){
									diff = Math.abs( this._values[1].getTime() - this._values[0].getTime() );
									if ( diff = 3600 * 24 * 1000 ){
										/* Step : day */
										this._step = STEP_DAY;
									}
									else if ( this._values[0].duplicate().offsetMonth( 1 ).getTime() == this._values[1].getTime() ){
										/* Step : month */
										this._step = STEP_MONTH;
									}
								}
							}
						},
						convertToDate     : function ( v ){
							return String( v ).dateFromDt();
						},
						getFormattedValue : function ( index ){
							return this._values[index].format(
								this._meta.step == STEP_MONTH
									? 'G Y'
									: 'd M Y'
							);
						}
					} );
			})();


			return dataSetObj;
		})(),
		/**
		 * Base Class of Visualization Engine
		 * It could be inherited by endpoint classes,
		 * each of which describing with one type of values: numeric, date etc
		 */
			BaseEngine = function (){
			this.initialize.apply( this, arguments );
		},

		Engines = {},

		vzrObj;

	BaseEngine.prototype = {
		_type : undefined,

		/**
		 * Path of engine source files
		 * @type {String}
		 */
		_path : '',

		_globalId : undefined,

		_requiredCss : [],

		/** @type {jQuery} */
		$container : undefined,

		/** @type {jQuery} */
		$progressBar : undefined,

		/** @type {jQuery} */
		$legendContainer : undefined,

		_sets : [],

		/**
		 * Data set which using for X-Axis
		 * @type {DataSet.Instance()}
		 */
		_argSet : undefined,


		_valuesSets : [],

		_settings : {
			/**
			 * Is need to load data by vzr?
			 * @type {Boolean}
			 */
			load : false,
			/**
			 * Url to load data
			 * @type {String}
			 */
			url  : undefined,

			onValuesLoad : function ( values, engine ){
			},

			progressBarText : 'Loading...',


			legendTitle : 'On chart',

			legendClass           : 'vzr-legend',
			legendTypeBaseClass   : 'vzr-legend-type-',
			legendTitleClass      : 'vzr-legend-title',
			legendItemClass       : 'vzr-legend-item',
			legendItemDeleteClass : 'vzr-legend-item-delete',
			legendItemSpacerClass : 'vzr-legend-item-spacer',

			/** @type {Array} */
			legendItems : undefined,

			renderLegend    : true,
			allowDeleteSets : true,
			onSetDelete     : function ( setData, engine ){
			},
			onRender        : function (){
			}
		},

		/**
		 * Prev state of settings
		 * Some engines uses this
		 *
		 * @type {Object} */
		_prevSettings : {},

		_loadingCache : {},

		/**
		 * Max value from all values datasets (not arguments)
		 *
		 * @type {Number}
		 */
		_maxValue : undefined,

		/**
		 * Min value from all values datasets (not arguments)
		 *
		 * @type {Number}
		 */
		_minValue : undefined,

		/**
		 * Set of sum all datasets values in each position
		 *
		 * @type {Number}
		 */
		_sumValues : [],

		/**
		 * Max value of sum all values dataset at each position
		 *
		 * @type {Number}
		 */
		_maxSumValue : undefined,

		/**
		 * Min value of sum all values dataset at each position
		 *
		 * @type {Number}
		 */
		_minSumValue : undefined,


		/**
		 * Set of sum all positive datasets values in each position
		 *
		 * @type {Number}
		 */
		_positiveSumValues : [],

		/**
		 * Set of sum all negative datasets values in each position
		 *
		 * @type {Number}
		 */
		_negativeSumValues : [],

		/**
		 * Max value of sum all positive values dataset at each position
		 *
		 * @type {Number}
		 */
		_maxPositiveSumValue : undefined,

		/**
		 * Max value of sum all negative values dataset at each position
		 *
		 * @type {Number}
		 */
		_maxNegativeSumValue : undefined,


		actualize : function (){
			var
				/** @type {DataSet.Instance()} */
					_set;
			this._argSet = undefined;
			this._valuesSets = [];
			this._minValue = undefined;
			this._maxValue = undefined;
			this._sumValues = [];
			/* Counting extremes of all values (not arguments) sets */
			if ( this._sets.length ){
				for ( var i = 0, l = this._sets.length; i < l; i ++ ){
					_set = this._sets[i];
					if ( ! _set.isArguments() ){
						this._minValue = (typeof this._minValue == 'undefined')
							? _set.getMinValue()
							: Math.min( _set.getMinValue(), this._minValue );
						this._maxValue = (typeof this._maxValue == 'undefined')
							? _set.getMaxValue()
							: Math.max( _set.getMaxValue(), this._maxValue );
						this._valuesSets.push( _set );
					}
					else if ( ! this._argSet ){
						this._argSet = _set;
					}
				}
			}
		},

		getSumValues : function (){
			if ( typeof this._sumValues == 'undefined' || ! this._sumValues.length ){
				this._countSumExtremes();
			}
			return this._sumValues;
		},

		getMinSumValue : function (){
			if ( typeof this._minSumValue == 'undefined' ){
				this._countSumExtremes();
			}
			return this._minSumValue;
		},

		getMaxSumValue : function (){
			if ( typeof this._maxSumValue == 'undefined' ){
				this._countSumExtremes();
			}
			return this._maxSumValue;
		},

		getPositiveSumValues : function (){
			if ( typeof this._positiveSumValues == 'undefined' || ! this._positiveSumValues.length ){
				this._countSumExtremes();
			}
			return this._positiveSumValues;
		},

		getNegativeSumValues : function (){
			if ( typeof this._negativeSumValues == 'undefined' || ! this._negativeSumValues.length ){
				this._countSumExtremes();
			}
			return this._negativeSumValues;
		},

		getMaxPositiveSumValue : function (){
			if ( typeof this._maxPositiveSumValue == 'undefined' ){
				this._countSumExtremes();
			}
			return this._maxPositiveSumValue;
		},

		getMaxNegativeSumValue : function (){
			if ( typeof this._maxNegativeSumValue == 'undefined' ){
				this._countSumExtremes();
			}
			return this._maxNegativeSumValue;
		},

		_countSumExtremes : function (){
			var
				length = this._argSet
					? this._argSet.getValuesLength()
					: this._valuesSets[0]
					? this._valuesSets[0].getValuesLength()
					: 0,
				_sum = 0,
				_positiveSum = 0,
				_negativeSum = 0,
				_v;
			this._minSumValue = undefined;
			this._maxSumValue = undefined;
			this._sumValues = [];
			this._maxPositiveSumValue = undefined;
			this._maxNegativeSumValue = undefined;
			this._positiveSumValues = [];
			this._negativeSumValues = [];
			if ( length && this._valuesSets.length ){
				for ( var i = 0; i < length; i ++ ){
					_sum = 0;
					_positiveSum = 0;
					_negativeSum = 0;
					for ( var j = 0, k = this._valuesSets.length; j < k; j ++ ){
						if ( this._valuesSets[j].getMeta( 'additive' ) ){
							if ( _v = + this._valuesSets[j].getValue( i ) ){
								_sum += _v;
								if ( _v >= 0 ){
									_positiveSum += _v;
								}
								else {
									_negativeSum += Math.abs( _v );
								}
							}
						}
					}

					this._sumValues[i] = _sum;
					this._positiveSumValues[i] = _positiveSum;
					this._negativeSumValues[i] = _negativeSum;
					this._minSumValue = (typeof this._minSumValue == 'undefined')
						? _sum
						: Math.min( _sum, this._minSumValue );
					this._maxSumValue = (typeof this._maxSumValue == 'undefined')
						? _sum
						: Math.max( _sum, this._maxSumValue );

					this._maxPositiveSumValue = (typeof this._maxPositiveSumValue == 'undefined')
						? _positiveSum
						: Math.max( _positiveSum, this._maxPositiveSumValue );
					this._maxNegativeSumValue = (typeof this._maxNegativeSumValue == 'undefined')
						? _negativeSum
						: Math.max( _negativeSum, this._maxNegativeSumValue );
				}
			}
		},

		initialize         : function (){
			var _src;
			if ( this._requiredCss.length ){
				this.loadCss( this._requiredCss );
			}
			this.afterInitialize();
		},

		/**
		 * Loads CSS-file
		 *
		 * @param css
		 */
		loadCss            : function ( css ){
			var _src;
			if ( $.isArray( css ) ){
				for ( var i = 0, l = css.length; i < l; i ++ ){
					this.loadCss( css[i] );
				}
				return;
			}
			if ( css ){
				if (
					css.search( /https?:\/\// ) !== 0 &&
						css.charAt( 0 ) != '/'
					){
					/* Converting relative urls to absolute using global url value */
					css = [this._path, css].join( '/' );
				}
				SitePage.loadCss( css );
			}
		},
		afterInitialize    : function (){
		},
		reset              : function (){
			this._sets = [];
			this._valuesSets = [];
			this._argSet = undefined;
			this._minValue = undefined;
			this._maxValue = undefined;
			this._minSumValue = undefined;
			this._maxSumValue = undefined;
			this._sumValues = [];
			this._positiveSumValues = [];
			this._negativeSumValues = [];
			this._maxPositiveSumValue = undefined;
			this._maxNegativeSumValue = undefined;
		},
		/**
		 * @param {Array}
		 */
		setData            : function ( sets ){
			var
				$this = this,
				/** @type {DataSet.Instance()} */
					_set;
			// TODO here must be binding events of new dataset changes
			// and unbinding datasets not using any more
			// (Idea is to autoupdate rendering when dataset's data changes )
			this.reset();
			if ( sets && sets.length ){
				for ( var i = 0, l = sets.length; i < l; i ++ ){
					_set = sets[i];
					this._sets.push( _set );
				}
			}
			this.actualize();
		},
		settings           : function ( a, b ){
			this._prevSettings = $.extend( {}, this._settings );
			return storage( this._settings, a, b );
		},
		setContainer       : function ( c ){
			if ( this.$container && this.$container.data( '_vzr_container_id' ) == this._globalId ){
				/* Skiping try to set the same continer */
				return;
			}
			if ( this.$container = c
				? $( c ).css( 'position', 'relative' )
				: undefined ){
				/* Marking container as used */
				this.$container.data( '_vzr_container_id', this._globalId );

				/* Notifying container as used */
				this.onSetContainer( this.$container );
			}
		},
		setLegendContainer : function ( c ){
			var $this = this;
			this.$legendContainer = $( c )
				.undelegate( 'click' )
				.delegate( 'span.' + this._settings.legendItemDeleteClass, 'click', function (){
					var
						itemNum = $( this ).closest( '.' + $this._settings.legendItemClass ).prevAll( '.' + $this._settings.legendItemClass ).length,
						setData = {
							num     : itemNum,
							dataSet : $this._valuesSets && $this._valuesSets[itemNum],
							data    : $this._settings.legendItems && $this._settings.legendItems[itemNum]
								? $this._settings.legendItems[itemNum].data
								: undefined
						};
					$this._settings.onSetDelete( setData, $this );
				} );

		},
		onSetContainer     : function (){
		},
		render             : function (){
		},


		_loadUrl : function ( _params ){
			var
				$this = this,
				params = {
					url      : undefined,
					force    : false,
					complete : function (){
					}
				},
				_done = function ( res ){
					params.complete( res );
				};
			_params && $.extend( params, _params );
			if ( ! params.url ){
				/* Nothing to load */
				_done();
				return;
			}
			if ( this._loadingCache[params.url] && ! params.force ){
				/* Using found in cache */
				_done( this._loadingCache[params.url] );
				return;
			}
			$.request( {
				url     : params.url,
				quite   : true,
				type    : 'GET',
				success : function ( res ){
					res = $this.purgeValues( res );
					$this._loadingCache[params.url] = res;
					_done( res );
				},
				error   : function ( res ){
					_done();
				}
			} );


		},

		load         : function ( _params ){
			var
				$this = this,
				params = {
					/**
					 * Flag means is really need to load from server even if has cache
					 *
					 * @type {Boolean}
					 */
					force    : false,
					complete : function (){
					}
				},
				_done = function ( res ){
					params.complete( res );
				};
			_params && $.extend( params, _params );
			if ( ! this._settings.url ){
				/* Nothing to load */
				_done();
				return;
			}
			if ( $.isArray( this._settings.url ) ){
				if ( ! this._settings.url.length ){
					_done();
					return;
				}
				this.drawProgressBar( true );
				/*
				 * If there is array of urls, loading all and return common array wih results
				 * where each res on the same place that url was
				 */
				(function (){
					var
						res = [],
						resNum = 0,
						/**
						 * Puts loaded values set strictly to its real place
						 * Checks if all sets loaded and fires 'complete'
						 */
							_handle = function ( _res, index ){
							res[index] = _res;
							if ( ++ resNum >= $this._settings.url.length ){
								$this.drawProgressBar( false );
								_done( res );
							}
						};
					for ( var i = 0, l = $this._settings.url.length; i < l; i ++ ){
						(function (){
							var _index = i;
							$this._loadUrl( {
								url      : $this._settings.url[i],
								complete : function ( _res ){
									_handle( _res, _index );
								},
								force    : params.force
							} )
						})();
					}
				})();
			}
			else {
				this.drawProgressBar( true );
				this._loadUrl( {
					url      : $this._settings.url,
					complete : function ( res ){
						$this.drawProgressBar( false );
						params.complete( res );
					}
				} )

			}
		},

		/**
		 * Runs when values just has loaded to make needed transforms on it
		 * Could be overriden in inheritors
		 *
		 * @param {Array} values
		 * @return {Array}
		 */
		purgeValues  : function ( values ){
			return values;
		},

		/**
		 * Callback runs when values just has loaded
		 * Could be overriden in inheritors
		 *
		 * @param values
		 */
		onValuesLoad : function ( values ){
			this._settings.onValuesLoad( values, this );
		},

		/**
		 * Renders animated progress-bar in the main container
		 * or disables it
		 *
		 * @param {Boolean} state If defined, progress-bar will be activated
		 */
		drawProgressBar : function ( state ){
			var
				$this = this,
				interval,
				bgpos = 0,
				actualizeProgressBar = function (){
					if ( bgpos ++ >= 18 ){
						bgpos = 0;
					}
					$this.$progressBarBar[0].style.backgroundPosition = bgpos + 'px -600px';
				};
			if ( state ){
				if ( ! this.$progressBar ){
					this.$progressBar = $( [
						'<div class="vzr-progressbar">',
						'<span class="vzr-progressbar-overlay"></span>',
						'</div>'].join( '' ) )
						.appendTo( this.$container ).css( {
							position : 'absolute',
							left     : 0,
							top      : 0,
							zIndex   : 10,
							display  : 'none'
						} );
					this.$progressBarCore = $( [
						'<div class="vzr-progressbar-core">',
						'<span class="vzr-progressbar-text">', this._settings.progressBarText , '</span>',
						'<span class="vzr-progressbar-bar">',
						'<span class="vzr-progressbar-light"></span>',
						'</span>',
						'</div>'
					].join( '' ) ).appendTo( this.$progressBar ).css( {
							position : 'absolute'
						} );
					this.$progressBarBar = this.$progressBarCore.find( '.vzr-progressbar-bar' );
				}
				if ( ! this.$progressBar.is( ':visible' ) ){
					actualizeProgressBar();
					this.$progressBar.show();
					this.$progressBar.find( '>.vzr-progressbar-overlay' ).hide().fadeIn( 800 );
					this.$progressBar.data( 'interval', setInterval( actualizeProgressBar, 30 ) );
				}
			}
			else if ( this.$progressBar ){
				this.$progressBar.hide();
				clearInterval( this.$progressBar.data( 'interval' ) );
			}


		},
		/**
		 * Loads values from server if necessary and then starts render
		 */
		refresh         : function (){
			var $this = this;
			this.actualize();
			if ( this._settings.load ){
				this.load( {
					complete : function ( res ){
						$this.onValuesLoad( res );
						$this.render();
					}
				} )
			}
			else {
				this.render();
			}
		},
		getType         : function (){
			return this._type;
		}
	}

	/**
	 * Public of main Vzr namespace
	 *
	 * @type {Object}
	 */
	vzrObj = {

		Instance : function ( _settings ){
			var
				/** @type {jQuery} */
					$container,
				/** @type {jQuery} */
					$legendContainer,
				settings = {
					/**
					 * Current visualization type
					 * @type {String}
					 */
					type : undefined,
					/**
					 * Visualization settings
					 * Will be tralsated to visualization engine
					 * @type {Object}
					 */
					view : {}
				},
				/** @type {(DataSet.Instance())[]} */
					dataSets = [],

				vzSettings = {},

				reset = function (){
					dataSets = [];
				},

				actualize = function (){
					/* Throwing needed data to engine */
					if ( engine ){
						engine.setContainer( $container );
						engine.setLegendContainer( $legendContainer );
						engine.setData( dataSets );
						engine.settings( vzSettings );
					}
				},
				/**
				 * @return {Vzr.DataSet.Instance()}
				 */
					_appendDataSet = function ( setData ){
					var
						ds = DataSet.Instance( setData );

					if ( ds ){
						dataSets.push( ds );
					}

					return ds;
				},

				initialize = function (){
				},
				/** @type {new BaseEngine()} */
					engine,

				/**
				 * @return {new BaseEngine()}
				 */
					initEngine = function ( _params ){
					var
						params = {
							type    : settings.type,
							success : function (){
							},
							error   : function (){
								error( 'unknown visualization type : ' + params.type );
							}
						},
						Engine,
						/** @type {new BaseEngine()} */
							eng,
						_done = function (){
							eng = new Engines[params.type];
							eng._globalId = globalEnginesNum ++;
							params.success( eng );
						};
					_params && $.extend( params, _params );

					if ( Engine = Engines[params.type] ){
						_done();
					}
					else {
						SitePage.loadJs(
							enginesConfig[params.type]
								&& enginesConfig[params.type].path
								? enginesConfig[params.type].path
								: [
								enginesPath,
								params.type,
								params.type + '.js'
							].join( '/' ),
							function (){
								if ( Engines[params.type] ){
									_done();
								}
								else {
									params.error();
								}
							},
							function (){
								params.error();
							} );
					}

				},

				error = function ( msg ){
					throw new Error( '[VZR] Error: ' + msg );
				},

				instance = {
					/**
					 * @return {new Vzr.DataSet.BaseEngine}
					 */
					appendDataSet : function ( setData ){
						var
							ds = _appendDataSet( setData );
						actualize();
						return ds;
					},

					setData : function ( d ){
						if ( d && d.length ){
							reset();
							for ( var i = 0, l = d.length; i < l; i ++ ){
								_appendDataSet( d[i] );
							}
							actualize();
						}
						return this;
					},

					/**
					 * Set visualization settings
					 */
					vzSettings : function ( a, b ){
						storage( vzSettings, a, b, true );
						actualize();
					},


					refresh : function (){
						if ( ! settings.type ){
							error( 'type of visualization is not set' );
							return;
						}
						var
							update = function (){
								engine.refresh();
							};
						if ( engine && engine.getType() == settings.type ){
							/*
							 * Engine already initialized
							 * Just update it
							 */
							update();
						}
						else {
							initEngine( {
								/**
								 * @param {new BaseEngine()}
								 */
								success : function ( eng ){
									engine = eng;
									actualize();
									update();
								}
							} );
						}
					},

					settings : function ( a, b ){
						var res = storage( settings, a, b, true );
						if ( settings.container ){
							$container = $( settings.container );
							delete settings.container;
						}
						if ( settings.height ){
							$container.height( Number( settings.height ) );
						}
						if ( settings.legendContainer ){
							$legendContainer = $( settings.legendContainer );
							delete settings.legendContainer;
						}
						return res;
					}
				};
			instance.settings( _settings );
			initialize();
			return instance;
		},


		/**
		 * Registers engine of the new unique type
		 *
		 * @param {String} type
		 * @param {Object} proto
		 */
		registerEngine : function ( type, proto ){
			var
				/**
				 * Engine's constructor
				 */
					Engine = Engines[type] = function (){
					Engine.prototype._type = type;
					Engine.prototype._path = [enginesPath, type].join( '/' );
					Engine.superClass.apply( this, arguments );
				},
				_engineSettings,
				_protoSettings;

			/* Making inheritance */
			Engine.inheritsFrom( BaseEngine );
			_engineSettings = $.extend( {}, Engine.prototype._settings || {} );
			_protoSettings = $.extend( {}, proto._settings || {} );
			proto && $.extend( Engine.prototype, proto );
			Engine.prototype._settings = $.extend( _engineSettings, _protoSettings );
		},
		BaseEngine     : BaseEngine,
		DataSet        : DataSet
	}

	return vzrObj;
})();

