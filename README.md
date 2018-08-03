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
  - The entire Mark template is wrap inside this root-level element `{template}`.

### 2. Top-level elements

Like React JSX and XSLT, each Mark template is actually a collection of transformation functions. The top-level elements that can directly appear under the `{template}` root are:

- `{import at:'url'}`
  - Import functions from template at the specified URL.

- `{component name:'...', match:'selector', extend:'class', prop:value `
  `    ... // template contents`
  `}`
  - Defines a component template.
  - Multiple component templates, with the same name can be defined, but they should have different match `selector`.  The template matching process is similar to that in XSLT.
  - When the component is being composed, the template engine maintains a transformation context that can be accessed through JS expression in the template body. The context fields are:
    - `this.model.*`: the current matched model object;
    - `this.context.*`: global context for the entire transformation;
    - `this.children.*`: content nodes of the *current component* this is being composed;
    - `this.apply.*`: the current list of model objects that are being transformed;
      - `this.apply.length`: the length of the list that is being transformed;
      - `this.apply.index`: the index of the model object in the list that is currently being transformed;
    - `this.*`: properties defined in the component template;

- `{comp props ...}`

  - A shorthand for component template that matches elements with name `comp`.

- `{function name:'...' ...}`

  - Defines a function template. 
  - Function name must be unique.

  Components and functions can only be defined at the root-level of the template. Their definition cannot be nested inside the body of a component or function template.

### 3. Component Transformation

The following section describes about the element that can be nested inside the component/function body. There are pre-defined elements that carry out specific transformation logic. Elements other than these pre-defined ones are treated as literal elements. Transformation elements and literal elements can nest within each other.

The contents inside component/function body are processed in the following prioritized way:

- if it is an element, then
  - if it is one of the pre-defined transform elements, including `{if}`, `{else}`, `{for}`, `{let}`, `{apply}`, `{compose}`, process it accordingly;
  - if its name starts with `this.`, it is processed as an inline expression;
  - if its name matches the local variable defined by outer `{let}` element, it is processed as an inline expression;
  - if there's any component/function defined with the same name as the element name, if so invoke the function;
  - else it is processed an a literal element;
- else if it is a Mark pragma, then it is processed as an inline JS expression;
- else any text nodes are copied literally;

#### 3.1 Pre-defined transformation elements

- `{if is:expr ...}` or `{if not:expr ...}`
  - When the condition expression is evaluated to `true`, then the template body is executed, otherwise the body of the following `{else}` branch is executed, if there's any.
- `{else if:expr ...}` or `{else ...}`
  - The else branch of a `if` element. It should always follow a `if` element immediately.
  - If the `if:expr` property is defined, then it is a nested else-if branch, otherwise, it is a simple else branch.
- `{let name:expr ...}`
  - Defined a scoped variable with the given name. The variable is only effective within the body of the `let` element.
- `{context name:expr ...}`
  - Shadows the value of a context variable.
- `{for each:expr ...}`
  - Loop through the objects returned from evaluating the `expr`, and execute the body of the `for` element.
- `{apply}` or `{apply to:expr}`
  - Apply template transformation a list of model objects. If optional to:expr is specified, it is applied to the objects returned from evaluating the `expr`, otherwise it is applied to the 
- `{compose}`
  - Execute the body of the current component.

#### 3.2 Component and function invocation

- `{comp prop1:value prop2:expr ...}`
  - Invokes a component template, through a template matching process, like XSLT.
- `{func prop1:value prop2:expr ...}`
  - Invokes a function. The differences are:
    - when a component is invoked, it changes the *current component* in the context; when a function is invoked, it does not change the *current model object* or the *current component*.
    - component invocation goes through a template matching process like XSLT, which is more powerful and flexible (but also slower in performance), whereas function is a straight invocation.

#### 3.3 Inline expressions

Elements whose name start with `this` and Mark pragmas are treated as inline JS expressions.

- `{this.*}`
- `(expr as Mark pragma)`

The result of evaluating the expression is passed to the template engine output adaptor. It may be casted into a string or preserved as a value, depending on the output adaptor.

#### 3.4 Literal elements

- `{literalElement ...}`

### 4. Output Adaptors

Mark Template can support wide-range of output, through built-in and custom adaptors. The built-in adaptors can support Mark, JSON, HTML, XML, Text, DOM, [virtual-dom](https://github.com/Matt-Esch/virtual-dom). 

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