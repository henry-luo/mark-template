const test = require('tape');
const Mark = require('mark-js');
const Template = require('./../mark-template.js');
const MarkAdaptor = require('./../adaptor/mark-adaptor.js');

class Dialog {
	get header() {
		return "Dialog List";
	}
}

class Message {
	get msg_text() {
		return this.model[0];
	}
}

test('Template expr support', function(assert) {
	var tmpl = Template.compile(MarkAdaptor.load('./test/expr.mt'), [Dialog, Message]);
	var model = Mark.parse("{dialog user:'henry' {msg user:'henry' 'hello'} {msg user:'peter' 'how are you?'} {msg user:'henry' 'I am fine'}}");
	var output = Template.apply(tmpl, model);
	var out_text = Mark.stringify(output[0], null, '\t');
	// Component.save(out_text, './test/output.txt');
	assert.equal(out_text, MarkAdaptor.load('./test/expr_result.txt'), 'Template expr support');
	assert.end();
});
