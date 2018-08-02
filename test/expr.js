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
				(this.context.a + this.context.b)
			}
		}`);
	var model = Mark("{main {item}}");
	var output = Template.apply(tmpl, model, {a:1, b:2});
	assert.equal(Mark.stringify(output), '{div "151"}', 'Context shadowing');
	assert.end();
});

test('Apply index and length', function(assert) {
	var tmpl = Template.compile(
		`{template
			{main
				{div {apply}}
				{div {apply to:(this.model.contents())}}
				{div {apply to:(this.model.contents()[2])}}
			}
			{item
				(this.apply.index + 1) ' of ' {this.apply.length} '; '
			}
		}`);
	var model = Mark("{main {item} {item} {item}}");
	var output = Template.apply(tmpl, model, null, {a:1, b:2});
	assert.equal(Mark.stringify(output), '[{div "1 of 3; 2 of 3; 3 of 3; "},{div "1 of 3; 2 of 3; 3 of 3; "},{div "1 of 1; "}]', 'Apply index and length');
	assert.end();
});