const test = require('tape');
const Template = require('./../mark-template.js');
const MarkAdaptor = require('./../adaptor/mark-adaptor.js');

test('Template import support', function(assert) {
	var tmplMain = `
		{template
			{import at:'./test/import.tp'}
			{Object
				{imported}
			}
		}`;
	var model = null;
	var tmpl = Template.compile(tmplMain, null, MarkAdaptor);
	var output = Template.apply(tmpl, {});
	assert.deepEqual(output, 'inside imported template', 'Template import support');
	assert.end();
});