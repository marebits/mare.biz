"use strict";

import { browserEvents } from "./EventSet.mjs";
import { CONSTANTS } from "./constants.mjs";
import { ContractLink } from "./ContractLink.mjs";
import { MareEvent } from "./MareEvent.mjs";
import { OutputDataMessage } from "./OutputDataMessage.mjs";
import { Web3 } from "./Web3.mjs";

const TARGET_CHAIN_ID_INT = self.Number.parseInt(CONSTANTS.TARGET_CHAIN_ID, 16);
const addToMetaMaskButton = self.document.getElementById("add-to-metamask");
const bitsBalanceOutput = self.document.getElementById("bits-balance");
const defaultChainInfo = CONSTANTS.CHAINS.get(CONSTANTS.TARGET_CHAIN_ID);
const purchaseAmountInput = self.document.getElementById("purchase-amount");
const purchaseBalanceOutput = self.document.getElementById("purchase-balance");
const purchaseButton = self.document.getElementById("purchase");
const walletConnectButton = self.document.getElementById("wallet-connect");
const walletMessageOutput = self.document.getElementById("wallet-message");
const withdrawButton = self.document.getElementById("withdraw");
const web3 = new Web3();
browserEvents.addMany([
	new MareEvent(addToMetaMaskButton, "click", onAddToMetaMaskClick, { passive: true }), 
	new MareEvent(purchaseAmountInput, "input", onPurchaseAmountInput, { passive: true }), 
	new MareEvent(purchaseButton, "click", onPurchaseButtonClick, { passive: true }), 
	new MareEvent(self.document, "visibilitychange", onVisibilityChange, { passive: true }), 
	new MareEvent(walletConnectButton, "click", onWalletConnectClick, { passive: true }), 
	new MareEvent(web3, "accountsChanged", () => updateButtons().catch(console.error)), 
	new MareEvent(web3, "connected", () => updateButtons().catch(console.error)), 
	new MareEvent(web3, "disconnected", () => updateButtons().catch(console.error)), 
	new MareEvent(web3, "initialized", onWeb3Initialized), 
	new MareEvent(withdrawButton, "click", onWithdrawClick, { passive: true })
]);
browserEvents.startListening();

// async function getCid() {
// 	if (self.location.host === "mare.biz") {
// 		const headers = new self.Headers({ Accept: "application/dns-json" });
// 		const url = new self.URL("https://cloudflare-dns.com/dns-query");
// 		url.search = new self.URLSearchParams({ name: "_dnslink.mare.biz", type: "TXT", do: false, cd: false });
// 		const request = new self.Request(url, { headers });
// 		const response = await self.fetch(request);
// 		const responseJson = await response.json();
// 		const dnsLink = responseJson.Answer.find(function(answer) { return answer.type === 16; }).data.split("/");
// 		return dnsLink[dnsLink.length - 1].slice(0, -1);
// 	} else {
// 		const currentPathname = self.location.pathname;

// 		if (currentPathname.slice(0, 6) === "/ipfs/")
// 			return currentPathname.substring(6);
// 	}
// 	return "Cannot determine CID";
// }
function onAddToMetaMaskClick(event) { web3.mare.watchAsset().catch(console.error); }
function onPurchaseAmountInput(event) {
	if (!event.target.checkValidity()) {
		purchaseBalanceOutput.value = "0";
		console.error("Invalid purchase amount entered.");
		return;
	}
	const newPurchaseAmount = web3.utils.toWei(event.target.value) * CONSTANTS.TOKEN_SALE_RATE;
	purchaseBalanceOutput.value = web3.utils.fromWei(newPurchaseAmount);
}
function onPurchaseButtonClick(event) {

}
function onVisibilityChange() {
	if (self.document.visibilityState === "hidden")
		browserEvents.stopListening();
	else
		browserEvents.startListening();
}
function onWalletConnectClick() { web3.connect().catch(console.error); }
function onWeb3Initialized() {}
function onWithdrawClick() {}
async function updateButtons() {
	const currentAccount = await web3.currentAccount;
	addToMetaMaskButton.disabled = true;
	purchaseButton.disabled = true;
	walletConnectButton.disabled = true;
	withdrawButton.disabled = true;
	updateWalletMessage("Click Connect Wallet above to proceed.");

	if (await web3.isConnected) {
		if (web3.chainId === CONSTANTS.TARGET_CHAIN_ID) {
			if (typeof currentAccount === "undefined")
				walletConnectButton.disabled = false;
			else {
				if (await web3.mare.isOpen)
					purchaseButton.disabled = false;
				else if (await web3.mare.isFinalized)
					withdrawButton.disabled = false;
				updateWalletMessage("Connected to wallet:", new ContractLink({ chainName: defaultChainInfo.shortName, contract: currentAccount, textContent: currentAccount }));
				bitsBalanceOutput.value = await web3.mare.balance;
			}
			addToMetaMaskButton.disabled = false;
		} else
			updateWalletMessage(`Please change the network in your wallet to ${defaultChainInfo.name}`);
	}
}
function updateWalletMessage(...nodesOrStrings) {
	if (nodesOrStrings.length === 1 && typeof nodesOrStrings[0] === "string")
		walletMessageOutput.textContent = nodesOrStrings[0];
	else
		walletMessageOutput.replaceChildren(...nodesOrStrings);
}

self.customElements.define("contract-link", ContractLink);
self.customElements.define("output-data-message", OutputDataMessage);
self.setTimeout(function() { updateButtons().catch(console.error); }, 200);
// getCid().then(console.log).catch(console.error);