import { BetterMap } from "./BetterMap.mjs";
import { CONSTANTS } from "./constants.mjs";
import { EventSet, browserEvents } from "./EventSet.mjs";
import { MareEvent } from "./MareEvent.mjs";

const events = new self.Map([
	["accountsChanged", new self.Event("accountsChanged")], 
	["connected", new self.Event("connected")], 
	["disconnected", new self.Event("disconnected")], 
	["initialized", new self.Event("initialized")]
]);

class Web3Mare {
	constructor(web3) { this.web3 = web3; }
	get balance() { return this.web3.currentAccount.then(this.__balanceOf.bind(this)); }
	get bestPony() {}
	get capReached() {}
	get closingTime() {}
	get hasClosed() { return self.Promise.resolve(false); }
	get isFinalized() { return self.Promise.resolve(false); }
	get isOpen() { return self.Promise.resolve(true); }
	get openingTime() {}
	get weiRaised() {}
	buyTokens(amount) {}
	watchAsset() {
		return this.web3.__ethRequest({
			method: "wallet_watchAsset", 
			params: {
				"type": "ERC20", 
				"options": {
					"address": CONSTANTS.TOKEN_CONTRACT_ADDRESS, 
					"decimals": 18, 
					"symbol": CONSTANTS.TOKEN_SYMBOL, 
					"image": CONSTANTS.TOKEN_ICON_PNG,
				},
			},
		});
	}
	withdrawTokens() {}
	__balanceOf(account) { return self.Promise.resolve(130853200000n); }
}
class Web3Utils {
	static __ETH_UNITS = new BetterMap(CONSTANTS.ETH_UNITS);
	static get ETH_UNITS() { return this.__ETH_UNITS; }
	static fromWei(number, unit = this.ETH_UNITS.ether) {
		if (!this.ETH_UNITS.has(unit))
			unit = this.ETH_UNITS.ether;
		const decimals = unit.length - 1;
		number = number.toString();
		return (number.substring(0, number.length - decimals) + "." + number.slice(-decimals)).replace(/\.?0+$/, "");
	}
	static toWei(number, unit = this.ETH_UNITS.ether) {
		if (!this.ETH_UNITS.has(unit))
			unit = this.ETH_UNITS.ether;
		const inputValueSplit = number.toString().split(".");

		if (inputValueSplit.length === 1)
			inputValueSplit[1] = "0";
		return BigInt((inputValueSplit[0] + inputValueSplit[1].padEnd(unit.length - 1, "0")).replace(/^0*/, ""));
	}
}
class Web3 extends self.EventTarget {
	constructor() {
		super();
		this.__eth = this.__initializeEth().then((eth) => this.__addEvents(eth)).catch();
		this.mare = new Web3Mare(this);
	}
	get accounts() { return this.__ethRequestMethod("eth_accounts"); }
	get chainId() { return this.__chainId; }
	get currentAccount() { return this.accounts.then(accounts => accounts[0]); }
	get eth() { return this.__eth; }
	get isConnected() { return this.eth.then(eth => eth.isConnected()); }
	get isProviderConnected() { return this.currentAccount.then(currentAccount => typeof currentAccount !== "undefined"); }
	async connect() { this.__onAccountsChanged(await this.__ethRequestMethod("eth_requestAccounts")); }
	__addEvents(eth) {
		this.__events = new EventSet("addListener", "removeListener", [
			new MareEvent(eth, "accountsChanged", this.__onAccountsChanged.bind(this)), 
			new MareEvent(eth, "chainChanged", this.__onChainChanged.bind(this)), 
			new MareEvent(eth, "connect", this.__onConnected.bind(this)), 
			new MareEvent(eth, "disconnect", this.__onDisconnected.bind(this))
		]);
		this.__events.startListening();
		browserEvents.add(new MareEvent(self.document, "visibilitychange", this.__onSelfVisibilityChange.bind(this), { passive: true }));
		return eth;
	}
	async __ethRequest(args) {
		const eth = await this.eth;
		console.log(args);
		return eth.request(args);
	}
	__ethRequestMethod(method) { return this.__ethRequest({ method }); }
	__initializeEth() {
		const eventTarget = this;
		let handled = false;
		return new self.Promise(function(resolve, reject) {
			const event = new MareEvent(self, "ethereum#initialized", handleEthereum, { once: true, passive: true });
			let timeout;

			function handleEthereum() {
				if (handled)
					return;
				handled = true;
				browserEvents.delete(event);
				self.clearTimeout(timeout);
				const { ethereum } = self;

				if (ethereum) {
					eventTarget.dispatchEvent(events.get("initialized"));
					resolve(ethereum);
				}
				reject("Cannot detect an installed web3 compatible wallet.");
			}

			if (self.ethereum)
				handleEthereum();
			else {
				browserEvents.add(event);
				timeout = self.setTimeout(handleEthereum, 3000);
			}
		});
	}
	__onAccountsChanged(accounts) {
		console.log("accounts changed");
		if (accounts.length === 0)
			this.dispatchEvent(events.get("disconnected"));
		else
			this.dispatchEvent(events.get("accountsChanged"));
	}
	__onConnected(connectInfo) {
		console.log("connected");
		this.__chainId = connectInfo.chainId;
		// this.accounts.then(this.__onAccountsChanged.bind(this)).catch(console.error);
		this.dispatchEvent(events.get("connected"));
	}
	__onChainChanged(chainId) { self.location.reload(); }
	__onDisconnected(error) {
		console.error(error);
		this.dispatchEvent(events.get("disconnected"));
		// need to reload page to reconnect
	}
	__onSelfVisibilityChange() {
		if (self.document.visibilityState === "hidden")
			this.__events.stopListening();
		else
			this.__events.startListening();
	}
}
self.Object.defineProperty(Web3.prototype, "utils", { enumerable: true, value: Web3Utils });

export { Web3 };