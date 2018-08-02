const test = require('tape');
const Mark = require('mark-js');
const Template = require('./../mark-template.js');

class JsonAdaptor {
	static createElement(type, properties, children) {
		return properties;
	}
	static createText(item) { 
		return item;
	}
	static load(filepath) {
		return fs.readFileSync(filepath, 'utf8').replace(/^\uFEFF/, '');
	}
}

test('Simple JSON output', function(assert) {
	var tmpl = Template.compile(
		`{template 
			{msg {style:{float:'left'}, user:{this.model.user}} } 
			{dialog {for each:'m' of:(this.model.contents()) {apply to:{m}}}}
		}`);
	var model = Mark.parse("{dialog {msg user:'henry' 'hello'} {msg user:'peter' 'how are you?'} {msg user:'henry' 'I am fine'}}");
	var output = Template.apply(tmpl, model, JsonAdaptor); 
	assert.equal(JSON.stringify(output), '[{"style":{"float":"left"},"user":"henry"},{"style":{"float":"left"},"user":"peter"},{"style":{"float":"left"},"user":"henry"}]', 'JSON output support');
	assert.end() ;
});