/*
	sale status (is it open, is it finalized, when it opens, when it closes, how much MARE sold, how much ETH raised)
		The pre-sale is currently closed, but is scheduled to open in X hours/minutes/countdown
		The pre-sale is open!  Currently sold X MARE out of a total of Y. <progress>  Pre-sale closes in X hours/minutes/countdown
		The pre-sale is closed, we sold X MARE out of a total of Y. <progress> Be sure to withdraw your MARE if you purchased any!

	public properties: 
	public methods: 
	emitted events: 
*/

import { BetterMap } from "./BetterMap.mjs";
import { CONSTANTS } from "./constants.mjs";
import { browserEvents } from "./EventSet.mjs";
// import { MareCountDownClock } from "./MareCountDownClock.mjs";
import { MareCustomElement } from "./MareCustomElement.mjs";
import { MareEvent } from "./MareEvent.mjs";
import { OutputDataMessage } from "./OutputDataMessage.mjs";
import { VisibilityListener, defineCustomElements, hyphenToCamelCase } from "./utils.mjs";

// configurable constants 
const TAG_NAME = "marebits-presale-status";

// other constants (not configurable)
const _privates = new self.WeakMap();

// helper classes
class MareCommonElements extends self.Set {
	set value(value) { this.forEach(element => element.value = value); }
	replaceChildren(...nodes) { this.forEach(element => element.replaceChildren(...nodes)); }
	setAttribute(name, value) { this.forEach(element => element.setAttribute(name.toString(), value)); }
}
class MareStatusSection {
	constructor(element) { _privates.set(this, { element }); }
	hide() {
		const element = _privates.get(this).element;
		element.setAttribute("aria-hidden", element.hidden = true);
	}
	show() {
		const element = _privates.get(this).element;
		element.hidden = false;
		element.removeAttribute("aria-hidden");
	}
}
class MareStatusSectionCollection extends BetterMap {
	constructor(doc, ...elementIds) { super(elementIds.map(elementId => [hyphenToCamelCase(elementId), new MareStatusSection(doc.getElementById(elementId))])); }
	hide() { this.forEach(element => element.hide()); }
	show() { this.forEach(element => element.show()); }
}

// private methods
function createDom() {
	const privates = _privates.get(this);
	const template = this.app.shadowRoot.getElementById("marebits-presale-status").content.cloneNode(true);
	privates.elements = {
		clocks: {
			closing: template.getElementById("closing"), 
			opening: template.getElementById("opening")
		}, 
		meters: new MareCommonElements(template.querySelectorAll(".amount-sold")), 
		outputs: {
			available: new MareCommonElements(template.querySelectorAll(".available")), 
			chainName: template.getElementById("chain-name"), 
			sold: new MareCommonElements(template.querySelectorAll(".sold"))
		}, 
		statuses: new MareStatusSectionCollection(template, "closed", "need-permission", "not-yet-open", "no-wallet", "open", "wrong-chain")
	};
	privates.elements.outputs.chainName.replaceChildren(self.document.createTextNode(CONSTANTS.CHAINS.get(CONSTANTS.TARGET_CHAIN_ID).name));
	const meterMax = CONSTANTS.PRESALE.CAP * self.Number(CONSTANTS.TOKEN.SALE_RATE);
	privates.elements.meters.setAttribute("max", meterMax);
	privates.elements.meters.setAttribute("low", self.Math.floor(meterMax * 0.33));
	privates.elements.meters.setAttribute("high", self.Math.floor(meterMax * 0.75));
	privates.elements.meters.setAttribute("optimum", self.Math.floor(meterMax * 0.9));
	privates.elements.outputs.available.replaceChildren(self.document.createTextNode(meterMax.toString()));
	privates.elements.outputs.available.value = meterMax;
	this.attachShadow({ mode: "open" }).appendChild(template);
}
function onVisibilityChange() {
	if (self.document.visibilityState !== "hidden")
		updateStatus.call(this);
}
function updateStatus() {
	(async () => {
		const currentAccount = this.app.web3.currentAccount;
		const isTargetChain = this.app.web3.isTargetChain;
		const privates = _privates.get(this);
		privates.elements.statuses.hide();
		console.log({ isInitialized: this.app.web3.mare.isInitialized, isConnected: this.app.web3.isConnected, currentAccount: await currentAccount, isTargetChain: await isTargetChain });

		if (this.app.web3.mare.isInitialized && this.app.web3.isConnected && typeof await currentAccount !== "undefined" && await isTargetChain) {
			const hasClosed = await this.app.web3.mare.hasClosed;
			const isOpen = hasClosed ? false : await this.app.web3.mare.isOpen;

			if (isOpen) {
				// The pre-sale is open!  Currently sold X MARE out of a total of Y. <progress>  Pre-sale closes in X hours/minutes/countdown
				await self.Promise.all([
					(async () => privates.elements.clocks.closing.endTime = await this.app.web3.mare.closingTime * 1000)(), 
					(async () => privates.elements.meters.value = privates.elements.outputs.sold.value = (await this.app.web3.mare.mareSold).replace(",", ""))()
				]);
				privates.elements.statuses.open.show();
			} else if (hasClosed) {
				// The pre-sale is closed, we sold X MARE out of a total of Y. <progress> Be sure to withdraw your MARE if you purchased any!
				console.log((await this.app.web3.mare.mareSold).replace(/,/g, ""));
				privates.elements.meters.value = privates.elements.outputs.sold.value = (await this.app.web3.mare.mareSold).replace(/,/g, "");
				privates.elements.statuses.closed.show();
			} else {
				// The pre-sale is currently closed, but is scheduled to open in X hours/minutes/countdown
				privates.elements.clocks.opening.endTime = await this.app.web3.mare.openingTime * 1000;
				privates.elements.statuses.notYetOpen.show();
			}
		// } else if (!this.app.web3.isConnected) {
			// no web3 wallet found, page will need to be reloaded or wallet connected
			// privates.elements.statuses.noWallet.show();
		} else if (this.app.web3.isInitialized && !(await isTargetChain)) {
			// wrong chain
			privates.elements.statuses.wrongChain.show();
		} else if (this.app.web3.isInitialized && typeof await currentAccount === "undefined") {
			// wallet detected and connected, but we need permission to use it
			privates.elements.statuses.needPermission.show();
		} else
			privates.elements.statuses.noWallet.show();
	})().catch(console.error);
}

class MarebitsPresaleStatus extends MareCustomElement {
	get [self.Symbol.toStringTag]() { return "MarebitsPresaleStatus"; }
	get app() { return undefined; }
	get ethRaised() { return _privates.get(this).elements.outputs.ethRaised.value; }
	get mareSold() { return _privates.get(this).elements.outputs.mareSold.value; }
	set app(app) {
		delete this.app;
		self.Object.defineProperty(this, "app", { get: () => app });
		createDom.call(this);
	}

	connectedCallback() {
		if (!this.isConnected)
			return;
		const privates = _privates.get(this);
		browserEvents.addMany(privates.events = [
			new MareEvent(this.app.web3, "accountsChanged", updateStatus.bind(this)), 
			new MareEvent(this.app.web3, "disconnected", updateStatus.bind(this)), 
			new MareEvent(this.app.web3, "error", updateStatus.bind(this)), 
			new MareEvent(this.app.web3, "initialized", updateStatus.bind(this))
		]);
		privates.visibilityListener.listen();
		super.connectedCallback();
	}
	createdCallback() {
		// defineCustomElements([MareCountDownClock]);
		defineCustomElements([OutputDataMessage]);
		_privates.set(this, { visibilityListener: new VisibilityListener(onVisibilityChange.bind(this)) });
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