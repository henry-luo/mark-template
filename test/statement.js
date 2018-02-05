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

test('Template statement support', function(assert) {
	var tmpl = Template.compile(MarkAdaptor.load('./test/statement.mt'), [Dialog, Message]);
	var model = Mark.parse("{dialog user:'henry' {msg user:'henry' 'hello'} {msg user:'peter' 'how are you?'} {msg user:'henry' 'I am fine'}}");
	var output = Template.apply(tmpl, model);
	var out_text = Mark.stringify(output[0], null, '\t');
	//Component.save(out_text, './test/output.txt');
	
	assert.equal(out_text, MarkAdaptor.load('./test/statement_result.txt'), 'Template statement support ');
	assert.end();
});

test('Test for loop', function(assert) {
	var tmpl = Template.compile("{template {test {for each:'i', of:[1, 2, 'string'] {i}} }}");
	var output = Template.apply(tmpl, Mark.parse("{test}"));
	assert.deepEqual(output, ['1', '2', 'string'], 'Template for loop support ');
	assert.end();
});

test('Test if else statement', function(assert) {
	var tmpl = Template.compile(`
		{template 
			{test 
				{for each:'val', of:[11, 5.3, '3']
					{if is:{val>10} {span {val} '>10'}}
					{else if:{val>5} {span {val} '>5'}}
					{else {span {val} '<=5'}}
				}
			} 
		}`
	);
	var output = Template.apply(tmpl, Mark.parse("{test}"));
	assert.equal(Mark.stringify(output), '[{span "11>10"},{span "5.3>5"},{span "3<=5"}]', 'Test if else statement');
	assert.end();
});

test('Test let statement', function(assert) {
	var tmpl = Template.compile(`
		{template 
			{test 
				{let a:5, b:{8/4}
					{a * b}
				}
			} 
		}`
	);
	var output = Template.apply(tmpl, Mark.parse("{test}"));
	assert.equal(Mark.stringify(output), '["10"]', 'Test let statement');
	assert.end();
});