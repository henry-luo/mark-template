// vdom library
const Vtext = require('virtual-dom/vnode/vtext');
const Vnode = require('virtual-dom/vnode/vnode');
const createElement = require('virtual-dom/create-element');
const diff = require('virtual-dom/diff');
const patch = require('virtual-dom/patch');
// Mark
const Mark = require('mark-js');
// Mark template
const template = require('../mark-template.js');

const $vdom = Symbol('Acro.ui.vdom');
const $state = Symbol('Acro.ui.state');
const $context = Symbol('Acro.ui.context');
const $needUpdate = Symbol('Acro.ui.needUpdate');
const $hook = Symbol('Acro.ui.hook');

const boolAttrs = {'checked':true, 'selected':true, 'disabled':true, 'readonly':true, 'multiple':true, 'ismap':true, 'noresize':true, 'nowrap':true, 'noshade':true, 'compact':true};

class Component {
	static createElement(type, properties, children) {
		// map the properties
		let props = {};
		for (let p in properties) { // have to convert properties to attributes
			let val = properties[p];
			if (p === 'class') { // virtual-dom uses className instead of class
				props.className = val;
			}
			// ref: https://stackoverflow.com/questions/19246714/html-attributes-vs-properties
			// 'value' and 'checked' needs to be property, otherwise they'll not be properly patched by vdom
			else if (p === 'onmount') { // mount hook
				// https://github.com/Matt-Esch/virtual-dom/blob/master/docs/hooks.md
				console.log('got hook');
				if (!val[$hook]) {
					var Hook = function(){}; 
					Hook.prototype.hook = function(node, propertyName, previousValue) {
						// mount function is not invoked on value change
						if (!previousValue) { val(node);  console.log('hook triggered'); }
						else { console.log('value change on hook'); }
					}
					val[$hook] = new Hook();
				}
				props.onmount = val[$hook];
			}
			else if (p === 'id' || p === 'style' || p === 'value' || p === 'checked' || p === 'selected' || (typeof val === 'function')) {
				props[p] = val;  // properties
			}
			else { // html attributes
				if (!props.attributes) { props.attributes = {}; }
				// needs to check and omit boolean attributes
				if (boolAttrs[p]) { if (val) { props.attributes[p] = val; } }
				else { props.attributes[p] = val; }
			}
		}		
		return new Vnode(type, props, children);
	}
	static createText(text) {
		return new Vtext(text.toString());
	}
	
	get state() {
		if (!this[$state]) {
			// create new state
			let repos = this.context[$vdom].state;  // console.log('context state', repos);
			let key = 'k';
			if (this.model) {
				if (this.model.$key) { key = this.model.$key; }
				else { // init the $key
					let newKey = (repos.$lastKey || 0) + 1;
					repos.$lastKey = newKey;
					key = this.model.$key = 'k' + newKey;
				}
			}
			// else state only binds to global key 'k'
			// console.log('state key: ', key);
			// state might have been initialized by other object
			if (!repos[key]) { repos[key] = {}; }
			this[$state] = repos[key];
		}
		return this[$state];
	}

	static load(url) {
		var request = new XMLHttpRequest;  // request.responseType = 'text';
		request.open("GET", url, false);  // sync load
		request.overrideMimeType("text/plain");
		request.send();
		if (request.status === 200) {
			var content = request.response;
			// console.log('got res', content);
			return content;
		} else {
			console.log('failed to load res: '+url);
			return null;
		}
	}
	
	static loadTemplate(url) {
		try {
			return Mark.parse(Component.load(url));
		}
		catch (e) {
			e.fileName = url;
			e.message += ' in file "' + url + '"';
			throw e;  // rethrow the error
		}
	}
	
	static render(model, tmplSrc, classes, domTarget, context) {
		var tmpl = template.compile(tmplSrc, classes, Component);
		context = context || {};
		context[$vdom] = {template:tmpl, model:model, state:{}};
		context[$context] = context;
		console.log('model', model);
		var vhtml = template.apply(tmpl, model, context, {adaptor:Component});   console.log('vnodes', vhtml);
		if (vhtml.length > 1) {
			throw "Template should output only 1 root element";
		} 
		else {
			var html = createElement(vhtml);  console.log('DOM', html);
			context.$vtree = vhtml;  context.$domNode = html;
			domTarget.appendChild(html);
		}
	}
	update() {
		console.log('template update');
		if (!this.context || !this.context[$context]) { console.log('null context');  return; }
		let context = this.context[$context]; // points to the root context
		if (context[$needUpdate]) { console.log('got update flag already');  return; } // return if already $needUpdate
		context[$needUpdate] = true;
		
		function domUpdate() {
			context[$needUpdate] = false;
			let vdom = context[$vdom];
			var vhtml = template.apply(vdom.template, vdom.model, context, {adaptor:Component});
			if (vhtml.length > 1) {
				throw "Template should output only 1 root element";
			}
			else if (vhtml) {
				var patches = diff(context.$vtree, vhtml);  console.log('template diff', patches);
				context.$domNode = patch(context.$domNode, patches);  console.log('patched', context.$domNode);
				context.$vtree = vhtml;
			}
		}
		setTimeout(domUpdate, 0); // setTimeout to batch the dom update
	}

	static trigger(elmt, handler, options) {
		console.log('trigger', elmt, handler);
		while (elmt) {
			if (elmt[handler]) {
				console.log('got handler ' + handler, elmt[handler]);
				// handler is already bound to the component, so no need to bind 'this' here
				return elmt[handler](options);
			}
			elmt = elmt.parentNode;
		}
		console.log("handler '" + handler + "' not defined onthe element");
		return undefined;
	}
}

module.exports = Component;
if (typeof window !== 'undefined') { window.Component = Component; }