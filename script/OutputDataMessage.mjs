import { MareCustomElement } from "./MareCustomElement.mjs";
import { createElement } from "./utils.mjs";

// configurable constants
const TAG_NAME = "output-data-message";

// other constants (not configurable)
const _privates = new self.WeakMap();

// private methods
function createDom() {
	const doc = self.document.createDocumentFragment();
	this.outputElement = createElement("output", {}, doc);
	this.dataElement = createElement("data", {}, this.outputElement);
	this.value = (value == undefined) ? this.default;
	this.attachShadow({ mode: "open" }).appendChild(doc);
}

class OutputDataMessage extends MareCustomElement {
	get default() { return super.getAttribute("default"); }
	get value() { return super.getAttribute("value"); }
	set value(value) {
		value = (value == null) ? "" : value.toString();

		if (value.length === 0)
			value = this.default;
		super.setAttribute("value", this.dataElement.value = this.dataElement.textContent = value);
		return true;
	}
	createdCallback(value) {
		super();
		createDom.call(this, value);
	}
}

export { OutputDataMessage };