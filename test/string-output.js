const test = require('tape');
const Mark = require('mark-js');
const Template = require('./../mark-template.js');

class Component {
	static createElement(type, properties, children) {
		return Mark(type, properties, children);
	}
	static createText(item) { 
		return item;
	}
	static load(filepath) {
		return fs.readFileSync(filepath, 'utf8').replace(/^\uFEFF/, '');
	}
	static save(text, filepath) {
		return fsf.writeFileSync(filepath, '\ufeff'+text, {encoding:'utf8'});
	}
}

test('Simple string output', function(assert) {
	var tmplSrc = Mark.parse(
		`{template 
			{msg '<msg ' 'user=' {this.model.user} '>' {this.model.contents()} '</msg>'} 
			{dialog {div {for each:'m', of:{this.model.contents()} {apply to:{m}}} } }
		}`);
	var model = Mark.parse(`{dialog {msg user:'henry' 'hello'} {msg user:'peter' 'how are you?'} {msg user:'henry' 'I am fine'}}`);
	
	var tmpl = Template.compile(tmplSrc);
	var output = Template.apply(tmpl, Component, model); 
	
	// console.log(output[0]);  console.log(output[0].constructor.name);
	assert.equal(Mark.stringify(output[0]), `{div "<msg user=henry>hello</msg><msg user=peter>how are you?</msg><msg user=henry>I am fine</msg>"}`, 'String output support');
	assert.end() ;
});