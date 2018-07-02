# Mark Template
Mark Template is a new JS template engine inspired by [React JSX](https://reactjs.org/docs/introducing-jsx.html) and [XSLT](https://en.wikipedia.org/wiki/XSLT). It's template syntax is based on [Mark](https://mark.js.org), a new markup notation that has unified support of JSON, HTML and XML.

Features of Mark Template:

- **Clean** template syntax based on Mark notation.
- **Wide-range** of input/output formats support, including JSON, HTML, XML, DOM, virtual-dom, etc.
- Completely **functional** transformation.
- Powerful **high-order** transformation (like React high-order components).
- Powerful **selector-based** template matching (like XSLT, but uses CSS selector).

## Template Reference

### 1. Template root

- `{template}`
  - The entire Mark template is wrap inside this root-level element {template}.

### 2. Top-level elements

Like React JSX and XSLT, each Mark template is actually a collection of transformation functions. The top-level elements that can directly appear under the {template} root are:

- `{import at:'url'}`
  - Import functions from template at the specified URL.
- `{component name:'...', match:'selector', extend:'class', prop:value `
  `    ... // template contents`
  `}`
  - A component template. 
  - Component model:
    - `this.model.*`: the current matched model object;
    - `this.context.*`: global context for the entire transformation;
    - `this.children.*`: contents defined in the component template;
    - `this.*`: properties defined in the component template;
- `{function name:'...' ...}`
  - A function to be called during transformation. 
- `{comp ...props}`
  - A shorthand for component template that matches elements with name `comp`.

### 3. Component Transformation

These are special elements nested inside the component/function body, that carry out specific transformation logic. Elements other than these pre-defined elements are treated as literal elements. Transform elements and  literal elements can nest within each other.

The contents inside component/function body are processed in the following prioritized way:

- if it is an element, then
  - if it is one of the pre-defined transform elements, including `{if}`, `{else}`, `{for}`, `{let}`, `{apply}`, `{compose}`, process it accordingly;
  - if its name starts with 'this.', it is processed as an inline expression;
  - if its name matches the local variable defined by outer {let} element, it is processed as an inline expression;
  - if there's any component/function defined with the same name as the element name, if so invoke the function;
  - else it is processed an a literal element;
- else if it is a Mark pragma, then it is processed as an inline expression;
- else any text nodes are copied literally;

#### 3.1 Pre-defined transform element

- {if}
- {else}
- {for}
- {let}
- {apply}
- {compose}

#### 3.2 Component/function invocation

- `{comp prop:value ...}`
  - Invoke another component or function.

#### 3.3 Inline expressions

An element whose name starts with 'this.' or a Mark pragma are treated as inline expressions.

- `{this.name}`
- `{expr as pragma}`

#### 3.4 Literal elements

- `{literalElement ...}`

### 4. Output Adaptors

Mark Template can support wide-range of output, through built-in and custom adaptors. The built-in adaptors can support Mark, JSON, HTML, XML, Text, DOM, virtual-dom. 

## Usage

Install from NPM:

```
npm install mark mark-template --save
```

Then in your node script, use it as:

```js
const Mark = require('mark');
const Template = require('mark-template');
var tmpl = Template.compile(`... template source ...`);
var model = Mark.parse(`... model data ...`);
var output = Template.apply(tmpl, model);
console.log("Output: " + Mark.stringify(output));
```

To use the library in browser, you can include the `mark-template.js` under `/dist` directory into your html page, like:

```html
<script src='mark.js'></script>
<script src='mark-template.js'></script>
<script> 
var tmpl = MarkTemplate.compile(`... template source ...`);
var model = Mark.parse(`... model data ...`);
var output = MarkTemplate.apply(tmpl, model);
console.log("Output: " + Mark.stringify(output));
</script>
```