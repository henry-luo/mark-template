const test = require('tape');
const Mark = require('mark-js');
const Template = require('./../mark-template.js');
const Component = require('./../adaptor/mark-adaptor.js');

test('Template import support', function(assert) {
	var tmplMain = `
		{template
			{import at:'./test/import.tp'}
			{Object
				{imported}
			}
		}`;
	var model = null;
	var tmpl = Template.compile(Mark.parse(tmplMain), null, Component.loadTemplate);
	var output = Template.apply(tmpl, Component, {});
	// var out_text = Mark.stringify(output[0], null, '\t');
	assert.deepEqual(output, ['inside imported template'], 'Template import support');
	assert.end();
});