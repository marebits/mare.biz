class MareCustomElement extends self.HTMLElement {
	constructor(...parameters) {
		super();
		this.createdCallback();
	}
	attachedCallback() { this.connectedCallback(); }
	connectedCallback() { this.dispatchEvent("elementconnected"); }
	createdCallback() { this.dispatchEvent("elementcreated"); }
	disconnectedCallback() { this.dispatchEvent("elementdisconnected"); }
	dispatchEvent(eventName, eventInit = undefined) { super.dispatchEvent(new self.Event(eventName, eventInit)); }
	setAttribute(attribute, value) {
		const isAttributeBoolean = typeof value === "boolean";
		const currentValue = isAttributeBoolean ? super.hasAttribute(attribute) : super.getAttribute(attribute);

		if (value == currentValue)
			return;
		else if (isAttributeBoolean)
			if (value)
				super.setAttribute(attribute, "");
			else
				super.removeAttribute(attribute);
		else
			super.setAttribute(attribute, self.String(value));
	}
}

export { MareCustomElement };