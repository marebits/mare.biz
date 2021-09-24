class OutputDataMessage extends self.HTMLElement {
	constructor() {
		super();
		const doc = self.document.createDocumentFragment();
		this.outputElement = self.document.createElement("output");
		this.dataElement = self.document.createElement("data");
		this.outputElement.appendChild(this.dataElement);
		doc.appendChild(this.outputElement);
		this.value = this.default;
		super.attachShadow({ mode: "open" }).appendChild(doc);
	}
	get default() { return super.getAttribute("default"); }
	get value() { return super.getAttribute("value"); }
	set value(value) {
		value = (value == null) ? "" : value.toString();

		if (value.length === 0)
			value = this.default;
		super.setAttribute("value", this.dataElement.value = this.dataElement.textContent = value);
		return true;
	}
}

export { OutputDataMessage };