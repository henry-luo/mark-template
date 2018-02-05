const fs = require('fs');
const fsf = require('fs-force');
const Mark = require('mark-js');

module.exports = 
class Component {
	static createElement(type, properties, children) {
		return Mark(type, properties, children);
	}
	static createText(item) { 
		return item.toString();
	}
	static load(filepath) {
		return fs.readFileSync(filepath, 'utf8').replace(/^\uFEFF/, '');
	}
	static loadTemplate(url) {
		return Mark.parse(Component.load(url));
	}
	static save(text, filepath) {
		return fsf.writeFileSync(filepath, '\ufeff'+text, {encoding:'utf8'});
	}
}