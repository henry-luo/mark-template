const test = require('tape');
const Mark = require('mark-js');
const Template = require('./../mark-template.js');

class StringAdaptor {
	// createElement is needed for high order components
	static createElement(type, properties, children) {
		return Mark(type, properties, children);
	}
	static createText(item) { 
		return item;
	}
	static load(filepath) {
		return fs.readFileSync(filepath, 'utf8').replace(/^\uFEFF/, '');
	}
}

test('Simple string output', function(assert) {
	var tmpl = Template.compile(
		`{template 
			{msg '<msg ' 'user=' {this.model.user} '>' {this.model.contents()} '</msg>'} 
			{dialog {div {for each:'m', of:{this.model.contents()} {apply to:{m}}} } }
		}`);
	var model = Mark.parse(`{dialog {msg user:'henry' 'hello'} {msg user:'peter' 'how are you?'} {msg user:'henry' 'I am fine'}}`);
	var output = Template.apply(tmpl, model); 
	
	assert.equal(Mark.stringify(output), `{div "<msg user=henry>hello</msg><msg user=peter>how are you?</msg><msg user=henry>I am fine</msg>"}`, 'String output support');
	assert.end() ;
});