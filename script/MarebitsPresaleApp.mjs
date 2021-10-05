/*
	static content, including contract addresses, etc.
		-- include button to add MARE token to wallet

	sale status
	
	sale area
*/

import { CONSTANTS } from "./constants.mjs";
import { ContractLink } from "./ContractLink.mjs";
import { browserEvents } from "./EventSet.mjs";
// import { MarebitsPresaleSale } from "./MarebitsPresaleSale.mjs";
import { MarebitsPresaleStatus } from "./MarebitsPresaleStatus.mjs";
import { MareCustomElement } from "./MareCustomElement.mjs";
import { MareEvent } from "./MareEvent.mjs";
import { VisibilityListener, defineCustomElements, fetchHtml, preload } from "./utils.mjs";
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
	privates.elements = {
		buttons: { addToMetamask: template.getElementById("add-to-metamask") }, 
		contracts: {
			presale: template.getElementById("presale"), 
			token: template.getElementById("token")
		}
	};
	template.querySelector("marebits-presale-status").addEventListener("elementcreated", ({ detail: marebitsPresaleStatus }) => marebitsPresaleStatus.app = this);
	privates.elements.contracts.presale.textContent = privates.elements.contracts.presale.contract = CONSTANTS.PRESALE.CONTRACT_ADDRESS;
	privates.elements.contracts.token.textContent = privates.elements.contracts.token.contract = CONSTANTS.TOKEN.CONTRACT_ADDRESS;
	this.attachShadow({ mode: "open" }).appendChild(template);
}
function onClickAddToMetamask() {
	const addToMetamask = _privates.get(this).elements.buttons.addToMetamask;
	addToMetamask.disabled = true;
	this.web3.mare.watchAsset()
		.then(() => addToMetamask.disabled = false)
		.catch(error => {
			addToMetamask.disabled = false;
			console.error(error);
		});
}
function onVisibilityChange() {
	if (self.document.visibilityState !== "hidden")
		updateButtons.call(this);
}
function updateButtons() {
	(async () => {
		const privates = _privates.get(this);
		privates.elements.buttons.addToMetamask.disabled = !(this.app.web3.mare.isInitialized && this.web3.isConnected && await this.web3.isTargetChain); 
	})().catch(console.error);
}

class MarebitsPresaleApp extends MareCustomElement {
	get [self.Symbol.toStringTag]() { return "MarebitsPresaleApp"; }

	connectedCallback() {
		if (!this.isConnected)
			return;
		const privates = _privates.get(this);
		(async () => {
			await privates.createDomPromise;
			browserEvents.addMany(privates.events = [
				new MareEvent(privates.elements.buttons.addToMetamask, "click", onClickAddToMetamask.bind(this), { passive: true }), 
				new MareEvent(this.web3, "accountsChanged", updateButtons.bind(this)), 
				new MareEvent(this.web3, "disconnected", updateButtons.bind(this)), 
				new MareEvent(this.web3, "initialized", updateButtons.bind(this))
			]);
			privates.visibilityListener.listen();
			super.connectedCallback();
		})().catch(console.error);
	}
	createdCallback() {
		this.web3 = new Web3();
		defineCustomElements([ContractLink, MarebitsPresaleStatus]);
		_privates.set(this, { visibilityListener: new VisibilityListener(onVisibilityChange.bind(this)) });
		_privates.get(this).createDomPromise = createDom.call(this).then(super.createdCallback.bind(this)).catch(console.error);
	}
	disconnectedCallback() {
		const privates = _privates.get(this);
		privates.visibilityListener.ignore();
		browserEvents.deleteMany(privates.events);
		super.disconnectedCallback();
	}
}
MarebitsPresaleApp.TAG_NAME = TAG_NAME;

export { MarebitsPresaleApp };