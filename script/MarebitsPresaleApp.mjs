/*
	static content, including contract addresses, etc.
		-- include button to add MARE token to wallet

	sale status (is it open, is it finalized, when it opens, when it closes, how much MARE sold, how much ETH raised)
		The pre-sale is currently closed, but is scheduled to open in X hours/minutes/countdown
		The pre-sale is open!  Currently sold X MARE out of a total of Y. <progress>  Pre-sale closes in X hours/minutes/countdown
		The pre-sale is closed, we sold X MARE out of a total of Y. <progress> Be sure to withdraw your MARE if you purchased any!
	
	sale area
		when no wallet is connected: Show connect wallet button
		when wallet is connected: show wallet address and current pending MARE balance

		purchase area -- only visible if wallet is connected and sale is open
			purchase input field, purchase button, field showing how much MARE you get
		withdraw area - only visible if wallet is connected and sale is closed and user has >0 MARE to withdraw
			withdraw button
*/

import { MareCustomElement } from "./MareCustomElement.mjs";
import { fetchHtml, preload } from "./utils.mjs";

// configurable constants 
const TAG_NAME = "marebits-presale-app";

// CSS

// HTML
const HTML_FILE = "presale/index.html";

// other constants (not configurable)
const _privates = new self.WeakMap();

// private methods
async function createDom() {
	const privates = _privates.get(this);
	const doc = await fetchHtml(HTML_FILE);
	console.log(doc);
}

class MarebitsPresaleApp extends MareCustomElement {
	connectedCallback() {}
	createdCallback() {
		_privates.set(this, {});
		createDom.call(this).catch(console.error);
	}
	disconnectedCallback() {}
}
MarebitsPresaleApp.TAG_NAME = TAG_NAME;

export { MarebitsPresaleApp };