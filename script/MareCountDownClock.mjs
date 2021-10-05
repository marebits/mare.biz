import { browserEvents } from "./EventSet.mjs";
import { MareCountDown } from "./MareCountDown.mjs";
import { MareCustomElement } from "./MareCustomElement.mjs";
import { MareEvent } from "./MareEvent.mjs";
import { createElement } from "./utils.mjs";

// configurable constants
const TAG_NAME = "mare-count-down-clock";

// styles

// other constants
const _privates = new self.WeakMap();

// private methods
function createDom() {
	const privates = _privates.get(this);
	privates.elements = { time: createElement("time", {}, this.attachShadow({ mode: "open" })) };
}
function onTick({ detail }) { self.requestAnimationFrame(() => ({ isoString: this.value, string: this.textContent } = detail)); }

class MareCountDownClock extends MareCustomElement {
	get [self.Symbol.toStringTag]() { return "MareCountDownClock"; }
	get endTime() { return self.Number(this.getAttribute("end-time")); }
	get hasEndTime() { return self.Boolean(this.endTime); }
	get isClockStarted() { return _privates.get(this).isClockStarted; }
	get textContent() { return _privates.get(this).elements.time.textContent; }
	get value() { return _privates.get(this).elements.time.dateTime; }
	set endTime(endTime) { this.setAttribute("end-time", endTime.toString()); }
	set textContent(textContent) { _privates.get(this).elements.time.replaceChildren(self.document.createTextNode(textContent.toString())); }
	set value(value) { _privates.get(this).elements.time.dateTime = value.toString(); }

	[self.Symbol.toPrimitive](hint) {
		if (hint === "number")
			return this.valueOf();
		return this.toString();
	}
	connectedCallback() {
		if (!this.isConnected)
			return;
		this.startClock();
		super.connectedCallback();
	}
	createdCallback(endTime) {
		if (endTime)
			this.endTime = endTime;
		_privates.set(this, { isClockStarted: false });
		createDom.call(this);
		super.createdCallback();
	}
	disconnectedCallback() {
		if (this.isClockStarted) {
			const privates = _privates.get(this);
			browserEvents.delete(privates.event);
			delete privates.countDown;
		}
		super.disconnectedCallback();
	}
	startClock() {
		if (!this.hasEndTime)
			return;
		const privates = _privates.get(this);
		privates.countDown = new MareCountDown(this.endTime);
		privates.event = new MareEvent(privates.countDown, "tick", onTick.bind(this), { passive: true });
		browserEvents.add(privates.event);
		this.dispatchEvent(new self.Event("started"));
	}
	toString() { return this.textContent; }
	valueOf() { return this.value; }
}
MareCountDownClock.TAG_NAME = TAG_NAME;

export { MareCountDownClock };