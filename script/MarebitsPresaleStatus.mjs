/*
	sale status (is it open, is it finalized, when it opens, when it closes, how much MARE sold, how much ETH raised)
		The pre-sale is currently closed, but is scheduled to open in X hours/minutes/countdown
		The pre-sale is open!  Currently sold X MARE out of a total of Y. <progress>  Pre-sale closes in X hours/minutes/countdown
		The pre-sale is closed, we sold X MARE out of a total of Y. <progress> Be sure to withdraw your MARE if you purchased any!

	public properties: 
	public methods: 
	emitted events: 
*/

import { Cache } from "./Cache.mjs";
import { CONSTANTS } from "./constants.mjs";
import { browserEvents } from "./EventSet.mjs";
import { MareCountDownClock } from "./MareCountDownClock.mjs";
import { MareCustomElement } from "./MareCustomElement.mjs";
import { MareEvent } from "./MareEvent.mjs";
import { defineCustomElements } from "./utils.mjs";

// configurable constants 
const TAG_NAME = "marebits-presale-status";

// other constants (not configurable)
const _privates = new self.WeakMap();
const CACHE_PREFIX = `${CONSTANTS.PRESALE.CONTRACT_ADDRESS}.`;

// private methods
function cacheKey(key) { return `${CACHE_PREFIX}.${key.toString()}`; }
function createDom() {
	const privates = _privates.get(this);
	const template = self.document.getElementById("marebits-presale-status").content.cloneNode(true);
	privates.elements = {
		outputs: {
			bitsBalance: template.getElementById("bits-balance"), 
			ethRaised: template.getElementById("eth-raised"), 
			mareSold: template.getElementById("marebits-sold")
		}
	};
	this.attachShadow({ mode: "open" }).appendChild(template);
}
function onVisibilityChange() {
	if (self.document.visibilityState !== "hidden")
		updateStatus.call(this);
}
function updateStatus() {
	(async function() {
		const currentAccount = await web3.currentAccount;
		const privates = _privates.get(this);
		privates.elements.outputs.bitsBalance.value = privates.elements.outputs.ethRaised.value = privates.elements.outputs.mareBitsSold.value = "0";

		if (web3.isConnected && typeof currentAccount !== "undefined" && await web3.isTargetChain) {
			let hasClosed = Cache.Typed.persisted.get(cacheKey`hasClosed`);
			let isOpen;

			if (hasClosed)
				isOpen = false;
			else if (hasClosed = await privates.app.web3.mare.hasClosed) {
				isOpen = false;
				Cache.Typed.persisted.set(cacheKey`hasClosed`, true);
			} else
				isOpen = await privates.app.web3.mare.isOpen;

			if (isOpen) {
				// The pre-sale is open!  Currently sold X MARE out of a total of Y. <progress>  Pre-sale closes in X hours/minutes/countdown
				const [closingTime, ethRaised, mareSold] = await self.Promise.all([
					self.Promise.resolve(Cache.Typed.persisted.getOrSet(cacheKey`closingTime`, () => privates.app.web3.mare.closingTime.then(self.Number.parseInt))), 
					(async () => privates.elements.outputs.ethRaised.value = await privates.app.web3.mare.ethRaised)(), 
					(async () => privates.elements.outputs.mareSold.value = await privates.app.web3.mare.mareSold)()
				]);
			} else if (hasClosed) {
				// The pre-sale is closed, we sold X MARE out of a total of Y. <progress> Be sure to withdraw your MARE if you purchased any!
				const [ethRaised, mareSold] = await self.Promise.all([
					self.Promise.resolve(Cache.Typed.persisted.getOrSet(cacheKey`ethRaised`, () => privates.app.web3.mare.ethRaised)), 
					self.Promise.resolve(Cache.Typed.persisted.getOrSet(cacheKey`mareSold`, () => privates.app.web3.mare.mareSold))
				]);
			} else {
				// The pre-sale is currently closed, but is scheduled to open in X hours/minutes/countdown
				const openingTime = await self.Promise.resolve(Cache.Typed.persisted.getOrSet(cacheKey`openingTime`, () => privates.app.web3.mare.openingTime.then(self.Number.parseInt)));
			}
		}
	})().catch(console.error);
}



class MarebitsPresaleStatus extends MareCustomElement {
	get [self.Symbol.toStringTag]() { return "MarebitsPresaleStatus"; }
	get bitsBalance() { return _privates.get(this).elements.outputs.bitsBalance.value; }
	get ethRaised() { return _privates.get(this).elements.outputs.ethRaised.value; }
	get mareSold() { return _privates.get(this).elements.outputs.mareSold.value; }

	connectedCallback() {
		const privates = _privates.get(this);
		browserEvents.addMany(privates.events = [
			new MareEvent(privates.app.web3, "accountsChanged", updateStatus.bind(this)), 
			new MareEvent(privates.app.web3, "disconnected", updateStatus.bind(this)), 
			new MareEvent(privates.app.web3, "initialized", updateStatus.bind(this))
		]);
		privates.visibilityListener.listen();
		super.connectedCallback();
	}
	createdCallback(app) {
		// defineCustomElements([MareCountDownClock]);
		_privates.set(this, { app, visibilityListener: new VisibilityListener(onVisibilityChange.bind(this)) });
		createDom.call(this);
		super.createdCallback();
	}
	disconnectedCallback() {
		const privates = _privates.get(this);
		privates.visibilityListener.ignore();
		browserEvents.deleteMany(privates.events);
		super.disconnectedCallback();
	}
}
MarebitsPresaleStatus.TAG_NAME = TAG_NAME;

export { MarebitsPresaleStatus };