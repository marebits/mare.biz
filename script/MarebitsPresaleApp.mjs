/*
	static content, including contract addresses, etc.
		-- include button to add MARE token to wallet

	sale status
	
	sale area
*/

import { browserEvents } from "./EventSet.mjs";
// import { MarebitsPresaleSale } from "./MarebitsPresaleSale.mjs";
// import { MarebitsPresaleStatus } from "./MarebitsPresaleStatus.mjs";
import { MareCustomElement } from "./MareCustomElement.mjs";
import { MareEvent } from "./MareEvent.mjs";
import { defineCustomElements, fetchHtml, preload } from "./utils.mjs";
import { Web3 } from "./Web3.mjs";

// configurable constants 
const TAG_NAME = "marebits-presale-app";

// HTML
const HTML_FILE = "presale/index.html";

// other constants (not configurable)
const _privates = new self.WeakMap();

// private methods
async function createDom() {
	const privates = _privates.get(this);
	const doc = await fetchHtml(HTML_FILE);
	const template = doc.body.querySelector("template").content.cloneNode(true);
	privates.elements = { buttons: { addToMetamask: template.getElementById("add-to-metamask") } };
	this.attachShadow({ mode: "open" }).appendChild(template);
}
function onClickAddToMetamask() { this.web3.mare.watchAsset().catch(console.error); }
function updateButtons() { (async function() { addToMetaMaskButton.disabled = !(this.web3.isConnected && await this.web3.isTargetChain); })().catch(console.error); }

class MarebitsPresaleApp extends MareCustomElement {
	connectedCallback() {
		const privates = _privates.get(this);
		(async () => {
			await privates.createDomPromise;
			browserEvents.addMany(privates.events = [
				new MareEvent(privates.elements.buttons.addToMetamask, "click", onClickAddToMetamask.bind(this), { passive: true }), 
				new MareEvent(this.web3, "accountsChanged", updateButtons.bind(this)), 
				new MareEvent(this.web3, "disconnected", updateButtons.bind(this)), 
				new MareEvent(this.web3, "initialized", updateButtons.bind(this))
			])
		})().then(super.connectedCallback).catch(console.error);
	}
	createdCallback() {
		this.web3 = new Web3();
		// defineCustomElements([MarebitsPresaleSale, MarebitsPresaleStatus]);
		_privates.set(this, {});
		_privates.get(this).createDomPromise = createDom.call(this).then(super.createdCallback).catch(console.error);
	}
	disconnectedCallback() {
		browserEvents.deleteMany(_privates.get(this).events);
		super.disconnectedCallback();
	}
}
MarebitsPresaleApp.TAG_NAME = TAG_NAME;

export { MarebitsPresaleApp };