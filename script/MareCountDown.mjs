import { Duration } from "./Duration.mjs";
import { VisibilityListener } from "./utils.mjs";

const _privates = new self.WeakMap();
const events = [
	["ended", new self.Event("ended")], 
	["paused", new self.Event("paused")], 
	["started", new self.Event("started")]
];

function onVisibilityChange() {
	if (self.document.visibilityState === "hidden") {
		if (this.isStarted)
			this.pause();
	} else if (this.isPaused)
		this.start();
}
function tick() {
	if (!this.isStarted || this.isEnded || this.isPaused)
		return;
	const privates = _privates.get(this);
	const value = this.value;

	if (value === 0) {
		self.clearTimeout(privates.tickTimeoutID);
		privates.isEnded = true;
		privates.isStarted = false;
		privates.tickTimeoutID = 0;
		this.dispatchEvent(privates.events.get("ended"));
		self.Object.freeze(this);
	} else if (typeof value !== "undefined") {
		this.dispatchEvent(privates.events.get("tick"));
		privates.tickTimeoutID = self.setTimeout(tick.bind(this), this.updateFrequency);
	}
}

class MareCountDown extends self.EventTarget {
	constructor(endTime, updateFrequency = 1000) {
		super();
		_privates.set(this, {
			endTime, 
			isEnded: false, 
			isPaused: false, 
			isStarted: false, 
			tickTimeoutID: 0, 
			updateFrequency, 
			visibilityListener: new VisibilityListener(onVisibilityChange.bind(this))
		});
		const privates = _privates.get(this);
		const tickEventDetail = { detail: {} };
		self.Object.defineProperties(tickEventDetail.detail, {
			isoString: { enumerable: true, get: this.toString.bind(this, true) }, 
			string: { enumerable: true, get: this.toString.bind(this) }, 
			value: { enumerable: true, get: this.valueOf.bind(this) }
		});
		privates.events = new self.Map([...events, ["tick", new self.CustomEvent("tick", tickEventDetail)]]);
	}

	get [self.Symbol.toStringTag]() { return "MareCountDown"; }
	get endTime() { return _privates.get(this).endTime; }
	get isEnded() { return _privates.get(this).isEnded; }
	get isStarted() { return _privates.get(this).isStarted; }
	get updateFrequency() { return _privates.get(this).updateFrequency; }
	get value() {
		if (this.isStarted && !this.isEnded && !this.isPaused) {
			const result = this.endTime - self.Date.now();
			return (result > 0) ? result : 0;
		}
		return undefined;
	}

	[self.Symbol.toPrimitive](hint) {
		if (hint === "number")
			return this.valueOf();
		return this.toString();
	}
	pause() {
		if (!this.isStarted || this.isEnded)
			return;
		const privates = _privates.get(this);
		self.clearTimeout(privates.tickTimeoutID);
		privates.isPaused = true;
		privates.isStarted = false;
		this.dispatchEvent(privates.events.get("paused"));
	}
	start() {
		if (this.isStarted || this.isEnded)
			return;
		const privates = _privates.get(this);
		privates.isPaused = false;
		privates.isStarted = true;
		tick.call(this);
		this.dispatchEvent(privates.events.get("started"));
	}
	toDuration() { return new Duration(this.valueOf()); }
	toLocaleString() { return this.toString(); }
	toString(isISO = false) { this.toDuration().toString(isISO); }
	valueOf() { return this.value; }
}

export { MareCountDown };