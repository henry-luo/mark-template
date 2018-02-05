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
	// if (typeof val === 'string') {
	//	return val.startsWith('{') && val.endsWith('}') ? evalExpr(val, comp) : val;
	// } 
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

function applyNodes(node, comp, tmpl, content, creator) {
	let ret = null;
	for (let n of node) {
		if (n.constructor && n.constructor.name === 'else') {
			if (ret && ret.if === false) { // render else content
				if (n.if !== undefined) { // else-if
					let isTrue = evalProp(n.if, comp);
					if (isTrue) {
						applyNodes(n, comp, tmpl, content, creator);
						ret = {if:true};
					} else {
						ret = {if:false};
					}
				} else {
					applyNodes(n, comp, tmpl, content, creator);
					ret = null;
				}
			}
			else { ret = null; } // skip else content
		}
		else {
			ret = applyNode(n, comp, tmpl, content, creator);
		}
	}
}

function applyComp(compDef, comp, paComp, tmpl, output, creator) {
	comp[$stack] = [];  // setup new stack
	comp[$paComp] = paComp;  // push paComp
	// apply to component content, component itself is not copied
	applyNodes(compDef, comp, tmpl, output, creator);
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
		comp = {model: parentComp.model, context: parentComp.context};
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

function applyToModel(m, params, comp, tmpl, output, creator) {
	if (typeof m === 'string') { output.push(creator.createText(m)); }
	else {
		let cm = matchTemplate(tmpl, m.constructor.name, m);
		if (cm) { // apply the template
			let c= newComp(comp, cm);  c.model = m;
			for (let p in params) { c[p] = params[p]; }
			applyComp(cm, c, comp, tmpl, output, creator);
		} else {
			// if no matching template
			let content = null;
			// apply to contents
			if (m[Symbol.iterator]) {
				content = [];  
				applyNodes(m, comp, tmpl, content, creator);
			}
			// construct vnode, copy the name, the props
			output.push(creator.createElement(m.constructor.name, m, m));
		}
	}
}

// @node: template node
// @model: source model object
// @tmpl: root template
function applyNode(node, comp, tmpl, output, creator) {
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
						applyNodes(node, comp, tmpl, output, creator);
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
			applyNodes(node, comp, tmpl, output, creator);
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
				applyNodes(node, comp, tmpl, output, creator);
				return {if:true};
			} else {
				//console.log('if expr is false');
				return {if:false};
			}
		}
		else if (name === 'apply') {
			let params = {}; // hasParam = false;
			// eval apply properties
			for (let p in node) {
				if (p !== 'to') {
					params[p] = evalProp(node[p], comp);  // hasParam = true;   console.log('has prop '+p+':', params[p]);
				}
			}
			let model = comp.model;
			if (node.to) { // apply to specified items
				model = evalProp(node.to, comp);  // console.log('apply to', model);
				if (!(model instanceof Array)) { // single value
					applyToModel(model, params, comp, tmpl, output, creator);
					return null;
				}
			} 
			// apply to model content
			for (let m of model) {
				applyToModel(m, params, comp, tmpl, output, creator);
			}
		}
		else if (name === 'compose') {
			let params = {}, hasParam = false;
			// eval apply properties
			for (let p in node) {
				if (node.hasOwnProperty(p)) {
					params[p] = evalProp(node[p], comp);  hasParam = true;  // console.log('has prop '+p+':', params[p]);
				}
			}
			// construct content nodes
			if (comp.children) {
				/*
				for (let child of comp.children) {
					if (typeof child === 'string') {
						output.push(creator.createText(child));
					} else {
						let cm = matchTemplate(tmpl, child.constructor.name, child);
						if (cm) { // apply the template
							// model object is not changed 
							let c = newComp(comp, cm);
							if (hasParam) { for (let p in params) { c[p] = params[p]; } }
							// copy properties
							for (let p in child) { c[p] = child[p]; }
							if (child[$iterator]) { c.children = child; }					
							applyComp(cm, c, tmpl, output, creator);
						} else {
							// if no matching template
							applyNode(child, comp, tmpl, output, creator);
							// output.push(creator.createElement(child.constructor.name, child, child));
						}
					}
				}*/
				applyNodes(comp.children, comp[$paComp], tmpl, output, creator);
			}
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
				applyComp(cm, c, comp, tmpl, output, creator);
			} else { // apply as html element
				let props = {}, content = null;
				// construct properties
				applyProps(props, node, comp);
				// construct content
				if (node[Symbol.iterator]) {
					content = [];  
					applyNodes(node, comp, tmpl, content, creator);
				}
				// construct vnode
				output.push(creator.createElement(name, props, content));
			}
		}	
	}
	return null;
}

function apply(tmpl, model, creator, context) {
	let rootName = model.constructor.name;   // console.log('apply tmpl', tmpl);
	let comp = matchTemplate(tmpl, rootName, model);
	if (comp) {
		let output = [];  let cont = context || {}; 
		let c = newComp({model:model, context:cont}, comp);
		applyComp(comp, c, null, tmpl, output, creator || MarkAdaptor);
		return output;
	} else {
		console.log("No matching component for " + rootName);
		return null;
	}
}

let Template = {compile, apply};
module.exports = Template;
if (typeof window !== 'undefined') { window.MarkTemplate = Template; }
/*
todo: 
1. matchTemplate can be made more efficient;
2. tmpl, output, creator can be made closure variable to avoid passing around;
3. output parent node properly constructed?
*/