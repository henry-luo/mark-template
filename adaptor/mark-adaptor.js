const Mark = require('mark-js');

module.exports = 
class Component {
	// output construction
	static createElement(type, properties, children) {
		return Mark(type, properties, children);
	}
	static createText(item) { 
		return item.toString();
	}
	
	// template processing
	static parse(source) {
		return Mark.parse(source);
	}
	static load(url) {
		let source = null;
		// todo: error handling
		if (typeof document !== 'undefined') { // in browser environment
			// make sync AJAX call
			var xhReq = new XMLHttpRequest();
			xhReq.open("GET", url, false);
			xhReq.send(null);
			source = xhReq.responseText;  // console.log('xml:', xml);
		} else { // assume node environment
			const fs = require('fs');
			source = fs.readFileSync(url, 'utf8').replace(/^\uFEFF/, ''); // assume UTF8 encoding, and trims the starting BOM char if any
		}
		return source;
	}
}