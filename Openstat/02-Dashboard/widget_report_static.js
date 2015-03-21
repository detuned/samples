/** 
 * @include "./widget_core.js"
 * @include "./widget_report.js"
 */

(function(){
	
	WidgetCore.registerEngine({
		'rpr'		: 'static',
		'class'		: 'text'
		},
		{
		text : '',
		run : function(){
			this.getText();
			this.render();
			},
		render_text : function(){
			this.$content.html(this.text);
			},
		render 		: function(){
			this.$header.html([
				'<a href="' , this.data.widget.url , '">',
					this.data.widget.title,
				'</a>'
				].join(''));
			this.render_text();
			},
		getText		: function(){}
		});
		
	/** 
	 * Research
	 */
	WidgetCore.registerEngine({
		'rpr'		: 'static',
		'class'		: 'text',
		'report'	: '_research'
		},
		{
		getText : function(){
			var 
				doc = window['RESEARCH_DOC'];
			if (!doc){
				return;
				}
			this.text = [
				'<div class="widget-research-text">',
					'<div class="widget-research-text-content">',
						window.LANG != 'ru'
							? ['<div class="lang-msg">' , _('-research-docs-available-only-in-russian')  , '</div>'].join('')
							: '',
						'<h3 class="widget-research-text-title">' ,
							'<a href="/research/doc/' , htmlspecialchars(doc.file) , '">',
								doc.title,
							'</a>',
						'</h3>',
						'<div class="widget-research-text-dsc">',
							doc.dsc,
						'</div>',
						'<div class="widget-research-text-download">',
							'<a href="/research/doc/' , htmlspecialchars(doc.file) , '" class="widget-research-download-button">', 
								_('-research-download-pdf') , 
							'</a>',
						'</div>',
					'</div>',
					'<div class="widget-research-text-more">',
						'<a href="/research">',
							_('-research-all-docs'),
						'</a>',
					'</div>',
				'</div>'
				].join('');
			}
		});
		
		
	/** 
	 * Glossary
	 */
	WidgetCore.registerEngine({
		'rpr'		: 'static',
		'class'		: 'text',
		'report'	: '_glossary'
		},
		{
			
		getText : function(){
			var 
				term = array_rand(window['GLOSSARY_TERMS'] || []);
			if (!term){
				return;
				}
			this.text = [
				'<div class="widget-glossary-text">',
					'<h3 class="widget-glossary-text-title">' ,
						'<a href="/about/glossary#term-' , htmlspecialchars(term.id) , '">',
							term.term ,
						'</a>',
					'</h3>',
					'<div class="widget-glossary-text-dsc">',
						typo(term.dsc),
					'</div>',
				'</div>'
				].join('');
			}
		});
	})();
WidgetCore.loadedFiles['static'] = true;