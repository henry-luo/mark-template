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

test('Template statement support', function(assert) {
	var tmplSrc = Mark.parse(Component.load('./test/statement.mt'));
	var model = Mark.parse("{dialog user:'henry' {msg user:'henry' 'hello'} {msg user:'peter' 'how are you?'} {msg user:'henry' 'I am fine'}}");
	
	var tmpl = Template.compile(tmplSrc, [Dialog, Message]);
	var output = Template.apply(tmpl, Component, model);
	var out_text = Mark.stringify(output[0], null, '\t');
	//Component.save(out_text, './test/output.txt');
	
	assert.equal(out_text, Component.load('./test/statement_result.txt'), 'Template statement support ');
	assert.end();
});

test('Test for loop', function(assert) {
	var tmplSrc = Mark.parse("{template {test {for each:'i', of:[1, 2, 'string'] {i}} }}");
	var tmpl = Template.compile(tmplSrc);
	var output = Template.apply(tmpl, Component,  Mark.parse("{test}"));
	assert.deepEqual(output, ['1', '2', 'string'], 'Template for loop support ');
	assert.end();
});

test('Test if else statement', function(assert) {
	var tmplSrc = Mark.parse(`
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
	var tmpl = Template.compile(tmplSrc);
	var output = Template.apply(tmpl, Component,  Mark.parse("{test}"));
	assert.equal(Mark.stringify(output), '[{span "11>10"},{span "5.3>5"},{span "3<=5"}]', 'Test if else statement');
	assert.end();
});

test('Test let statement', function(assert) {
	var tmplSrc = Mark.parse(`
		{template 
			{test 
				{let a:5, b:{8/4}
					{a * b}
				}
			} 
		}`
	);
	var tmpl = Template.compile(tmplSrc);
	var output = Template.apply(tmpl, Component,  Mark.parse("{test}"));
	assert.equal(Mark.stringify(output), '["10"]', 'Test let statement');
	assert.end();
});