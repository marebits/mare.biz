"use strict";

import { browserEvents } from "./EventSet.mjs";
import { CONSTANTS } from "./constants.mjs";
import { ContractLink } from "./ContractLink.mjs";
// import { MarebitsPresaleApp } from "./MarebitsPresaleApp.mjs";
// import { MareEvent } from "./MareEvent.mjs";
// import { OutputDataMessage } from "./OutputDataMessage.mjs";
// import { Cache } from "./Cache.mjs";
import { VisibilityListener, defineCustomElements } from "./utils.mjs";

defineCustomElements([ContractLink]);
// browserEvents.addMany([
// 	new MareEvent(addToMetaMaskButton, "click", onAddToMetaMaskClick, { passive: true }), 
// 	new MareEvent(purchaseAmountInput, "input", onPurchaseAmountInput, { passive: true }), 
// 	new MareEvent(purchaseButton, "click", onPurchaseButtonClick, { passive: true }), 
// 	new MareEvent(walletConnectButton, "click", onWalletConnectClick, { passive: true }), 
// 	new MareEvent(web3, "accountsChanged", updateButtons), 
// 	new MareEvent(web3, "disconnected", updateButtons), 
// 	new MareEvent(web3, "initialized", updateButtons), 
// 	new MareEvent(withdrawButton, "click", onWithdrawClick, { passive: true })
// ]);
// browserEvents.startListening();

function onVisibilityChange() {
	if (self.document.visibilityState === "hidden")
		browserEvents.stopListening();
	else
		browserEvents.startListening();
}

(new VisibilityListener(onVisibilityChange)).listen();