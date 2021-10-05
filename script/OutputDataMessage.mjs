import { MareCustomElement } from "./MareCustomElement.mjs";
import { createElement } from "./utils.mjs";

// configurable constants
const TAG_NAME = "output-data-message";

// other constants (not configurable)
const _privates = new self.WeakMap();

// HTML
const TEMPLATE = self.document.createElement("template");
TEMPLATE.innerHTML = `<output><data></data></output>`;

// private methods
function createDom(value) {
	const privates = _privates.get(this);
	const template = TEMPLATE.content.cloneNode(true);
	privates.outputElement = template.querySelector("output");
	privates.dataElement = template.querySelector("data");
	this.attachShadow({ mode: "open" }).appendChild(template);
}

class OutputDataMessage extends MareCustomElement {
	get default() { return super.getAttribute("default"); }
	get value() { return super.getAttribute("value"); }
	set value(value) {
		const dataElement = _privates.get(this).dataElement;
		value = (value == null) ? "" : value.toString();

		if (value.length === 0)
			value = this.default;
		value = self.Number(value);

		if (self.Number.isNaN(value))
			value = this.default;
		super.setAttribute("value", dataElement.value = value);
		dataElement.textContent = value.toLocaleString("en-US");
		return true;
	}
	createdCallback(value) {
		_privates.set(this, {});
		createDom.call(this, value);
		this.value = (value == undefined) ? this.default : value;
		super.createdCallback();
	}
}
OutputDataMessage.TAG_NAME = TAG_NAME;

export { OutputDataMessage };