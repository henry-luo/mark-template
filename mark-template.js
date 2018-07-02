const MarkAdaptor = require('./adaptor/mark-adaptor.js');
const $stack = Symbol('Mark.template.stack');
const $paComp = Symbol('Mark.template.parentComponent');
const $name = Symbol('Mark.template.name'); // for function name
const $class = Symbol('Mark.template.class');
const $isSelector = Symbol('Mark.template.isSelector');

function matchTemplate(tmpl, comp_name, comp) {
	let t = tmpl.filter(function(c) {
		if (typeof c.match === 'string') { // check against 'match' expr
			if (c[$isSelector]) {
				return comp.matches && comp.matches(c.match);
			} 
			else return c.match === comp_name;
		}
		else if (c.constructor.name === 'function' || c.constructor.name === 'component') { 
			return c.name === comp_name;  // match by name property
		} 
		return c.constructor.name == comp_name;  // match by type-name
	});
	return (t.length) ? t[0]:null;
}

// compile Mark template into a rendering function
function compile(tmpl, classes, adaptor) {
	if (typeof tmpl === 'string') { tmpl = MarkAdaptor.parse(tmpl); }
	// console.log('compiling ...', tmpl);
	let compiled = [];  let hasOthers = false;
	for (let comp of tmpl) {
		// console.log('compiling comp', comp, typeof comp);
		if (typeof comp !== 'object') {
			console.error("Component is not an object: ", comp);  
			throw "Expect object at template root-level.";
		}
		// todo: ensure import are before other elem
		if (comp.constructor.name === 'import') {
			if (hasOthers) { throw "import element should be before other elements"; }
			let imp = adaptor.parse(adaptor.load(comp.at));
			Array.prototype.push.apply(compiled, compile(imp, classes, adaptor));
		} 
		else { // component, function
			hasOthers = true;
			if (comp.extend && classes) { // load component class
				// console.log('got comp extend');
				// todo: ensure comp.extend is a proper name
				let cls = classes.filter(function(c) { return c.name == comp.extend; });
				if (cls.length) {
					// console.log('got class', cls[0]);
					comp[$class] = cls[0];
					// console.log('## extend class:', Object.getOwnPropertyNames(comp[$class]));
				} else {
					// todo: throw class not defined error
				}
			}
			if (typeof comp.match === 'string' && !comp.match.match(/^\s*(\w|-|\$)+\s*$/)) {
				comp[$isSelector] = true;  // console.log('got selector: ', comp.match);
			}
			// else simple name match
			compiled.push(comp);
		}
	}
	return compiled;
}

function transform(tmpl, model, context, options) {
	// transform context
	let template, output, creator;
	
	function evalInContext(expr) {
		try {
			with (this[$stack]) {
				return eval(expr);
			}
		} 
		catch (e) {
			console.error("Error: '"+ e.message + "', when evaluating: " + expr);
			return undefined;
		}
	}

	function evalExpr(exprStr, comp) {
		// strip starting '{' and ending '}' 
		// let expr = exprStr.substr(1, exprStr.length-2);
		// console.log("expr: "+ exprStr, comp);
		return evalInContext.call(comp, exprStr);
	}

	function evalFields(val, fields) {
		if (fields.indexOf('.') >= 0) { // multi fields
			var names = fields.split('.');
			for (let n of names) { 
				if (val !== undefined) val = val[n];
				else { break; }
			}
		} else { // single field
			val = val[fields]; 
		}
		return val;
	}

	function evalThis(field, comp) {
		// template value binding
		let val = null;
		// todo: support field.field... 
		/*
		if (field.startsWith('model.')) { // bind to model object
			// console.log('f', f);
			val = evalFields(comp.model, field.substr(6));
			// console.log("got var model binding", f, val);
		} else { // field of component
			val = comp[field];  // console.log("got var binding", field, val);
		}
		*/
		val = evalFields(comp, field);
		if (typeof val === 'function') { // got function, needs to bind to comp
			val = val.bind(comp);
		}
		// console.log("evalThis", field, val);
		return val;
	}

	function evalProp(val, comp) {
		// console.log('eval expr', val);
		if (typeof val === 'object') {
			// todo: support array
			if (!val.constructor) { // Mark pragma
				// console.log('got pragma', val.pragma());
				return evalExpr(val.pragma(), comp);
			}
			let name = val.constructor.name;
			if (name === 'Object') { // JSON object
				let v = {};
				for (let p in val) {
					if (val.hasOwnProperty(p)) {
						v[p] = evalProp(val[p], comp);
					}
				}
				return v;			
			}
			else if (name === 'Array') { // Array
				return val; // todo: should eval the array
			}
			else if (name === 'apply') { // apply template
				applyApply(node, comp);
			}
			else { // Mark object
				if (name.startsWith('this.')) { // eval under 'this' context
					let ret = evalThis(name.substr(5), comp);
					// if (!ret && val.or) {
						// console.log("got or expr", val.or, val.or.constructor.name, comp.model);	
						// ret = evalProp(val.or, comp);
					// }
					return ret;
				} else { 
					// try as variable
					let start, follow, val;
					if (name.includes('.')) {
						start = name.substring(0, name.indexOf('.'));  follow = name.substring(name.indexOf('.')+1);
					} else {
						start = name;  follow = null;
					}
					if (start in comp[$stack]) {
						// console.log('got stack item', comp[$stack], name);
						val = comp[$stack][start];
						if (val !== undefined && follow) {
							return evalFields(val, follow);
						} 
						else return val;
					}
					return val;  // returns the original Mark obj, no longer fallback as 'global' variable
				}
			}
		}
		// else simple value, just return origial value
		return val;
	}

	function applyProps(props, node, comp) {
		for (let p in node) {
			if (node.hasOwnProperty(p)) {
				let val = evalProp(node[p], comp);  // console.log('apply props '+ p, val);
				props[p] = val;
			}
		}
	}

	function applyNodes(node, comp) {
		let ret = null;
		for (let n of node) {
			if (n.constructor && n.constructor.name === 'else') {
				if (ret && ret.if === false) { // render else content
					if (n.if !== undefined) { // else-if
						let isTrue = evalProp(n.if, comp);
						if (isTrue) {
							applyNodes(n, comp);
							ret = {if:true};
						} else {
							ret = {if:false};
						}
					} else {
						applyNodes(n, comp);
						ret = null;
					}
				}
				else { ret = null; } // skip else content
			}
			else {
				ret = applyNode(n, comp);
			}
		}
	}

	function applyComp(compDef, comp, paComp) {
		comp[$stack] = [];  // setup new stack
		comp[$paComp] = paComp;  // push paComp
		// apply to component content, component itself is not copied
		applyNodes(compDef, comp);
		comp[$stack] = undefined;  comp[$paComp] = undefined;
	}

	function newComp(parentComp, compDef) {
		let comp;
		if (compDef[$class]) {
			comp = new compDef[$class];
			comp.model = parentComp.model;  comp.context = parentComp.context;
			// Object.setPrototypeOf(comp, compDef[$class]);
			// copy over comp default properties, should all be static
			for (let p in compDef) {
				if (p === 'extend' || p === 'match') {} // skip
				// else if (p === 'name') // name is treated as normal property
				else { comp[p] = compDef[p]; }
			}
		}
		else {
			comp = {model: parentComp.model, context: parentComp.context, apply: parentComp.apply};
			if (compDef.constructor.name === 'function') {
				Object.setPrototypeOf(comp, parentComp);
				// copy over comp default properties, should all be static
				for (let p in compDef) {
					// function does not support 'match' or 'extend'
					if (p === 'name') { comp[$name] = compDef[p]; }
					else { comp[p] = compDef[p]; }
				}
			}
			else {
				Object.setPrototypeOf(comp, compDef);
			}
		}
		return comp;
	}

	function applyToModel(m, params, comp) {
		if (m == null) { return; } // null, undefined
		if (typeof m === 'object') { // object
			if (!m.constructor) { return; } // skip pragma
			let cm = matchTemplate(template, m.constructor.name, m);
			if (cm) { // apply the template
				let c= newComp(comp, cm);  c.model = m;
				for (let p in params) { c[p] = params[p]; }
				applyComp(cm, c, comp);
			} else {
				// no matching template, apply to contents by default
				let _output = output;  output = null;
				if (m[Symbol.iterator]) {
					output = [];  
					let c = Object.create(comp);  c.model = m;
					applyNodes(m, c);
				} else {
					content = m;  // copy all contents
				}
				// construct vnode, copy the name, the props
				_output.push(creator.createElement(m.constructor.name, m, output));
				output = _output;
			}
		}
		else { // string, number
			output.push(creator.createText(m));  // output text node
		}
	}

	function applyApply(node, comp) {
		let params = {}; // hasParam = false;
		// eval apply properties
		for (let p in node) {
			if (p !== 'to') {
				params[p] = evalProp(node[p], comp);  // hasParam = true;   console.log('has prop '+p+':', params[p]);
			}
		}
		let model = comp.model;
		if (node.to != null) { // apply to specified items
			model = evalProp(node.to, comp);  // console.log('apply to', model);
			if (!(model instanceof Array)) { // single value
				let newComp = Object.create(comp);  newComp.apply = {index:0, length:1};
				applyToModel(model, params, newComp);
				return null;
			}
		} 
		// apply to model content
		let newComp = Object.create(comp);  newComp.apply = {index:0, length:model.length()};
		for (let m of model) {
			applyToModel(m, params, newComp);
			newComp.apply.index++;
		}
	}

	// @node: template node
	// @model: source model object
	// @tmpl: root template
	function applyNode(node, comp) {
		// console.log('apply comp', node);
		if (typeof node === "string") { // text node
			// let text = evalProp(node, comp);
			// if (text) output.push(creator.createText(text));  // construct vtext node
			if (node) output.push(creator.createText(node));  // construct vtext node
		}
		else if (!node.constructor) { // Mark pragma
			let val = evalExpr(node.pragma(), comp);  // console.log("got pragma", node.pragma());	
			if (val) output.push(creator.createText(val));
		}
		else {
			let name = node.constructor.name;
			if (name === 'for') { // for loop
				if (node.each) {
					//console.log('for each ' + node.each, JSON.stringify(comp.buttons), comp);
					let items = evalProp(node.of, comp); // ['save', 'call']; 
					if (!items) { return null; }
					//console.log('for each ' + node.each, JSON.stringify(items), JSON.stringify(comp.buttons));
					if (items[Symbol.iterator]) {
						let stack = comp[$stack];
						if (stack[node.each] !== undefined) { throw "Variable '"+ node.each +"' already defined"; }
						for (let i of items) {
							stack[node.each] = i;
							// for body
							applyNodes(node, comp);
						}
						stack[node.each] = undefined;
					} else {
						console.log('item not iterable');
					}
				}
			}
			else if (name === 'let') {
				let stack = comp[$stack];
				for (let t in node) {
					if (stack[t] !== undefined) { throw "Variable '"+ t +"' already defined"; }
					stack[t] = evalProp(node[t], comp); 
				}
				// let body
				applyNodes(node, comp);
				for (let t in node) {
					stack[t] = undefined;
				}
			}
			else if (name === 'if') { // || name === 'elif'
				let isTrue = false;
				if (node.is) {
					isTrue = evalProp(node.is, comp);
				}
				else if (node.not) {
					//console.log('if expr', node.not);
					isTrue = !evalProp(node.not, comp);
				}
				if (isTrue) {
					//console.log('if expr is true');
					applyNodes(node, comp);
					return {if:true};
				} else {
					//console.log('if expr is false');
					return {if:false};
				}
			}
			else if (name === 'apply') {
				applyApply(node, comp);
			}
			else if (name === 'compose') {
				let params = {}; // hasParam = false;
				// eval apply properties
				for (let p in node) {
					if (node.hasOwnProperty(p)) {
						params[p] = evalProp(node[p], comp);  // hasParam = true;  // console.log('has prop '+p+':', params[p]);
					}
				}
				// construct content nodes
				if (comp.children) {
					applyNodes(comp.children, comp[$paComp]);
				}
			}
			else if (name === 'context') { // shadow the context value
				let ctx = Object.create(comp.context);
				for (let p in node) {
					if (node.hasOwnProperty(p)) {
						ctx[p] = evalProp(node[p], comp);
					}
				}
				// console.log('ctx', ctx);
				let newComp = Object.create(comp);  newComp.context = ctx;
				applyNodes(node, newComp);
			}
			else if (name === 'log') {
				console.log(typeof node.msg === 'string' ? node.msg : evalProp(node.msg, comp));
			}
			else if (name.includes('.')) {
				// template value binding
				let val = evalProp(node, comp);  // console.log("got var binding", name, txt, comp);	
				if (val) output.push(creator.createText(val));
			}
			else if (name in comp[$stack]) { // variable
				// console.log('got stack item', comp[$stack], name);
				let val = comp[$stack][name];
				if (val) output.push(creator.createText(val));
				return null;
			}
			else { // nested component or html element	
				let cm = matchTemplate(tmpl, name, node);
				if (cm) { // apply the template
					let c = newComp(comp, cm);
					// apply properties
					applyProps(c, node, comp);
					if (node[Symbol.iterator]) { 
						c.children = node;
						// children needs to be constructed, instead of directly passing down
					}
					applyComp(cm, c, comp);
				} else { // apply as html element
					let props = {}, _output = output;
					output = null;
					// construct properties
					applyProps(props, node, comp);
					// construct content
					if (node[Symbol.iterator]) {
						output = [];  
						applyNodes(node, comp);
					}
					// construct vnode
					_output.push(creator.createElement(name, props, output));
					output = _output;
				}
			}	
		}
		return null;
	}

	let rootName = model.constructor.name;   // console.log('apply tmpl', tmpl);
	let comp = matchTemplate(tmpl, rootName, model);
	if (comp) {
		output = [];  template = tmpl;
		let c = newComp({model:model, context:context || {}}, comp);
		creator = options && options.creator || MarkAdaptor;
		applyComp(comp, c, null);
		if (!output.length) { return null; }
		if (output.length === 1) { return output[0]; }
		if (output.every(i => typeof i === 'string')) { // if all string, join them together
			return output.join('');
		}
		return output;
	} else {
		console.log("No matching component for " + rootName);
		return null;
	}
}

let Template = {compile, apply:transform};
module.exports = Template;
if (typeof window !== 'undefined') { window.MarkTemplate = Template; }
/*
todo: 
1. matchTemplate can be made more efficient;
2. tmpl, output, creator can be made closure variable to avoid passing around;
*/