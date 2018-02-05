const test = require('tape');
const Mark = require('mark-js');
const Template = require('./../mark-template.js');
const Component = require('./../adaptor/mark-adaptor.js');

class Dialog extends Component {
	get header() {
		return "Dialog List";
	}
}

class Message extends Component {
	get msg_text() {
		return this.model[0];
	}
}

test('Template expr support', function(assert) {
	var tmplSrc = Mark.parse(Component.load('./test/expr.mt'));
	var model = Mark.parse("{dialog user:'henry' {msg user:'henry' 'hello'} {msg user:'peter' 'how are you?'} {msg user:'henry' 'I am fine'}}");
	
	var tmpl = Template.compile(tmplSrc, [Dialog, Message]);
	var output = Template.apply(tmpl, Component, model);
	var out_text = Mark.stringify(output[0], null, '\t');
	// Component.save(out_text, './test/output.txt');
	
	assert.equal(out_text, Component.load('./test/expr_result.txt'), 'Template expr support');
	assert.end();
});
