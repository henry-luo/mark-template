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
	var out_text = Mark.stringify(output, {space:'\t'});
	// Component.save(out_text, './test/output.txt');
	assert.equal(out_text, MarkAdaptor.load('./test/expr_result.txt'), 'Template expr support');
	assert.end();
});

test('Context shadowing', function(assert) {
	var tmpl = Template.compile(
		`{template
			{main
				{div
					{this.context.a}
					{context a:3
						{apply}
					}
					{this.context.a}
				}
			}
			{item
				{this.context.a + this.context.b}
			}
		}`);
	var model = Mark("{main {item}}");
	var output = Template.apply(tmpl, model, null, {a:1, b:2});
	assert.equal(Mark.stringify(output), '{div "151"}', 'Context shadowing');
	assert.end();
});