const test = require('tape');
const Mark = require('mark-js');
const Template = require('./../mark-template.js');

test('Basic template transform', function(assert) {
	var output = Template.apply(
		`{template 
			{component match:'msg' {p {span style:{float:'left'} {this.model.user}} {apply}}}
			{dialog {div {h1 'dialog'} {apply} {footer}}}
			{footer {div 'Copyright © 2017'}}
		}`,
		Mark("{dialog {msg user:'henry' 'hello'} {msg user:'peter' 'how are you?'} {msg user:'henry' 'I am fine'}}")
	);
	assert.equal(Mark.stringify(output), '{div {h1 "dialog"} {p {span style:{float:"left"} "henry"} "hello"} {p {span style:{float:"left"} "peter"} "how are you?"} {p {span style:{float:"left"} "henry"} "I am fine"} {div "Copyright © 2017"}}', 'Basic template matching');
	assert.end();
});

test('Special cases', function(assert) {
	var tmpl = Template.compile(
		`{template
			{item
				{div
					"content "
					{apply to:null}
					{apply to:{null}}
					{apply to:{this.context.pragma}}
					{apply to:123} ' '
					{apply to:true} ' '
					{apply to:false}
					{log msg:'console message'}
					{log msg:(1+'2')}
				}
			}
		}`);
	var model = Mark("{item}");
	var output = Template.apply(tmpl, model, null, {pragma:Mark.pragma("{a b c}")});
	assert.equal(Mark.stringify(output), '{div "content 123 true false"}', 'Special matching');
	assert.end();
});
