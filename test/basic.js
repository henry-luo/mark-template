const test = require('tape');
const Mark = require('mark-js');
const Template = require('./../mark-template.js');
const Component = require('./../adaptor/mark-adaptor.js');

test('Basic template transform', function(assert) {
	var tmplSrc = Mark.parse(
		"{template "+
			"{component match:'msg' {p {span style:{float:'left'} {this.model.user}} {apply}}} " +
			"{dialog {div {h1 'dialog'} {apply} {footer}}} " +
			"{footer {div 'Copyright © 2017'}}"+
		"}");
	var model = Mark.parse("{dialog {msg user:'henry' 'hello'} {msg user:'peter' 'how are you?'} {msg user:'henry' 'I am fine'}}");
	
	var tmpl = Template.compile(tmplSrc);
	var output = Template.apply(tmpl, Component, model); 
	
	assert.equal(Mark.stringify(output[0]), '{div {h1 "dialog"} {p {span style:{float:"left"} "henry"} "hello"} {p {span style:{float:"left"} "peter"} "how are you?"} {p {span style:{float:"left"} "henry"} "I am fine"} {div "Copyright © 2017"}}', 'Basic template matching');
	assert.end() ;
});