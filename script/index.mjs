"use strict";

import { browserEvents } from "./EventSet.mjs";
import { CONSTANTS } from "./constants.mjs";
import { ContractLink } from "./ContractLink.mjs";
import { MareEvent } from "./MareEvent.mjs";
import { OutputDataMessage } from "./OutputDataMessage.mjs";
// import { TypedCache } from "./TypedCache.mjs";
import { createElement, runInBackground } from "./utils.mjs";
import { Web3 } from "./Web3.mjs";

const addToMetaMaskButton = self.document.getElementById("add-to-metamask");
const bitsBalanceOutput = self.document.getElementById("bits-balance");
const defaultChainInfo = CONSTANTS.CHAINS.get(CONSTANTS.TARGET_CHAIN_ID);
const ethRaisedOutput = self.document.getElementById("eth-raised");
const mareBitsSoldOutput = self.document.getElementById("marebits-sold");
const presaleContractLink = self.document.getElementById("presale-contract");
const purchaseAmountInput = self.document.getElementById("purchase-amount");
const purchaseBalanceOutput = self.document.getElementById("purchase-balance");
const purchaseButton = self.document.getElementById("purchase");
const purchaseResult = self.document.getElementById("purchase-result");
const saleNotYetOpen = self.document.getElementById("sale-not-yet-open");
const saleProgress = self.document.getElementById("sale-progress");
const saleProgressHr = self.document.getElementById("sale-progress-hr");
const tokenContractLink = self.document.getElementById("token-contract");
const walletConnectButton = self.document.getElementById("wallet-connect");
const walletMessageOutput = self.document.getElementById("wallet-message");
const withdrawButton = self.document.getElementById("withdraw");
const web3 = new Web3();
browserEvents.addMany([
	new MareEvent(addToMetaMaskButton, "click", onAddToMetaMaskClick, { passive: true }), 
	new MareEvent(purchaseAmountInput, "input", onPurchaseAmountInput, { passive: true }), 
	new MareEvent(purchaseButton, "click", onPurchaseButtonClick, { passive: true }), 
	new MareEvent(walletConnectButton, "click", onWalletConnectClick, { passive: true }), 
	new MareEvent(web3, "accountsChanged", updateButtons), 
	new MareEvent(web3, "disconnected", updateButtons), 
	new MareEvent(web3, "initialized", updateButtons), 
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
// function cacheGetSet(key, valueGetter) {
// 	let value = TypedCache.get(key);

// 	if (value == null) {
// 		value = valueGetter();
// 		TypedCache.set(key, value);
// 	}
// 	return value;
// }
function onAddToMetaMaskClick(event) { web3.mare.watchAsset().catch(console.error); }
function onPurchaseAmountInput(event) {
	if (!event.target.checkValidity() || /e/i.test(event.target.value)) {
		purchaseBalanceOutput.value = "0";
		console.error("Invalid purchase amount entered.");
		return;
	}
	const newPurchaseAmount = web3.mareUtils.toWei(event.target.value) * CONSTANTS.TOKEN.SALE_RATE;
	purchaseBalanceOutput.value = web3.mareUtils.fromWei(newPurchaseAmount);
}
async function onPurchaseButtonClick(event) {
	const purchaseResultElements = {};
	event.target.disabled = true;

	function onTransactionConfirmation(confirmation, receipt, latestBlockHash) {
		console.log("transaction confirmation");
		purchaseResultElements.confirmations.replaceChildren(
			self.document.createTextNode("Received "), 
			createElement("output-data-message", { value: confirmation }), 
			self.document.createTextNode(" confirmations"));
	}
	function onTransactionError(error) {
		purchaseResult.classList.add("alert");
		purchaseResult.replaceChildren(self.document.createTextNode(`Error ${error.code}: ${error.message}`));
		event.target.disabled = false;
		console.error(error);
	}
	function onTransactionHash(transactionHash) {
		console.log("transaction hash");
		purchaseResultElements.transactionHash.replaceChildren(
			self.document.createTextNode("Transaction Hash:"), 
			new ContractLink ({ chainName: defaultChainInfo.shortName, contract: transactionHash, contractLinkType: "tx", textContent: transactionHash })
		);
		purchaseResultElements.confirmations = createElement("div", {}, purchaseResult, "Awaiting confirmations...");
	}
	function onTransactionReceipt(receipt) {
		console.log("transaction receipt");
		const mareBitsSold = self.BigInt(receipt.events.TokensPurchased.returnValues.amount);
		mareBitsSoldOutput.value = web3.mareUtils.fromWei(web3.mareUtils.toWei(mareBitsSoldOutput.value) + mareBitsSold);
		bitsBalance.value = web3.mareUtils.fromWei(web3.mareUtils.toWei(bitsBalance.value) + mareBitsSold);
		ethRaised.value = web3.mareUtils.fromWei(web3.mareUtils.toWei(ethRaised.value) + self.BigInt(receipt.events.TokensPurchased.returnValues.value));
		event.target.disabled = false;
		purchaseAmountInput.value = "";
	}

	if (!purchaseResult.hidden)
		purchaseResult.replaceChildren();
	purchaseResult.hidden = false;
	purchaseResult.classList.remove("alert");
	purchaseResultElements.transactionHash = createElement("div", {}, purchaseResult, "Sending transaction...");
	web3.mare.buyTokens(purchaseAmountInput.value, onTransactionHash, onTransactionReceipt, onTransactionConfirmation, onTransactionError)
		.then(() => event.target.disabled = false).catch(console.error);
}
function onVisibilityChange() {
	if (self.document.visibilityState === "hidden")
		browserEvents.stopListening();
	else
		browserEvents.startListening();
}
function onWalletConnectClick() { web3.connect().catch(console.error); }
function onWithdrawClick() { web3.mare.withdrawTokens().catch(console.error); }
function setFieldValueToPromise(field, promise) { runInBackground(() => promise.then(value => field.value = value).catch(console.error)); }
function updateButtons() {
	(async function() {
		console.log("update buttons");
		const currentAccount = await web3.currentAccount;
		addToMetaMaskButton.disabled = purchaseButton.disabled = walletConnectButton.disabled = withdrawButton.disabled = true;
		updateWalletMessage("Click Connect Wallet above to proceed.");

		if (web3.isConnected) {
			if (await web3.chainId === CONSTANTS.TARGET_CHAIN_ID) {
				if (typeof currentAccount === "undefined")
					walletConnectButton.disabled = false;
				else {
					const isOpen = await web3.mare.isOpen;

					if (isOpen)
						purchaseButton.disabled = false;
					else if (await web3.mare.isFinalized)
						withdrawButton.disabled = false;
					updateWalletMessage("Connected to wallet:", new ContractLink({ chainName: defaultChainInfo.shortName, contract: currentAccount, textContent: currentAccount }));
					saleProgress.hidden = !(saleNotYetOpen.hidden = isOpen);
					saleProgressHr.hidden = false;
					setFieldValueToPromise(bitsBalanceOutput, web3.mare.balance);
					setFieldValueToPromise(mareBitsSoldOutput, web3.mare.mareSold);
					setFieldValueToPromise(ethRaisedOutput, web3.mare.ethRaised);
				}
				addToMetaMaskButton.disabled = false;
			} else {
				console.log(`current chain id is ${await web3.chainId} and you should be on ${CONSTANTS.TARGET_CHAIN_ID}`);
				updateWalletMessage(`Please change the network in your wallet to ${defaultChainInfo.name}`);
			}
		}
	})().catch(console.error);
}
function updateWalletMessage(...nodesOrStrings) {
	if (nodesOrStrings.length === 1 && typeof nodesOrStrings[0] === "string")
		walletMessageOutput.textContent = nodesOrStrings[0];
	else
		walletMessageOutput.replaceChildren(...nodesOrStrings);
}

self.customElements.define("contract-link", ContractLink);
self.customElements.define("output-data-message", OutputDataMessage);
self.document.addEventListener("visibilitychange", onVisibilityChange, { passive: true });
presaleContractLink.contract = CONSTANTS.PRESALE.CONTRACT_ADDRESS;
tokenContractLink.contract = CONSTANTS.TOKEN.CONTRACT_ADDRESS;
// self.setTimeout(function() { updateButtons().catch(console.error); }, 200);
// getCid().then(console.log).catch(console.error);