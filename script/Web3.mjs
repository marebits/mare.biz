import { BetterMap } from "./BetterMap.mjs";
import { CONSTANTS } from "./constants.mjs";
import { EventSet, browserEvents } from "./EventSet.mjs";
import { MareEvent } from "./MareEvent.mjs";
import { loadScriptAsync, preload } from "./utils.mjs";

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
				options: {
					address: CONSTANTS.TOKEN_CONTRACT_ADDRESS, 
					decimals: 18, 
					image: CONSTANTS.TOKEN_ICON_PNG, 
					symbol: CONSTANTS.TOKEN_SYMBOL
				},
				type: "ERC20"
			}
		});
	}
	withdrawTokens() {}
	__balanceOf(account) { return self.Promise.resolve(130853200000n); }
}
class Web3MareUtils {
	static __ETH_UNITS = new BetterMap(CONSTANTS.ETH_UNITS);

	static get ETH_UNITS() { return this.__ETH_UNITS; }

	static fromWei(number, unit = this.ETH_UNITS.ether) {
		number = number.toString();

		if (number === "0" || number == "")
			return "0";
		else if (!this.ETH_UNITS.has(unit))
			unit = this.ETH_UNITS.ether;
		const decimals = unit.length - 1;
		const whole = self.Number.parseInt(number.substring(0, number.length - decimals)).toLocaleString("en-US");
		const fraction = `.${number.slice(-decimals)}`.replace(/\.?0+$/, "");
		return `${whole}${fraction}`;
	}
	static toWei(number, unit = this.ETH_UNITS.ether) {
		number = number.toString();

		if (number == "" || number === "0")
			return 0n;
		else if (!this.ETH_UNITS.has(unit))
			unit = this.ETH_UNITS.ether;
		const inputValueSplit = number.split(".");

		if (inputValueSplit.length === 1)
			inputValueSplit[1] = "0";
		return self.BigInt((inputValueSplit[0] + inputValueSplit[1].padEnd(unit.length - 1, "0")).replace(/^0*/, ""));
	}
}
class MareWeb3 extends self.EventTarget {
	mare = new Web3Mare(this);

	constructor() {
		super();
		this.__initialize().catch(console.error);
	}

	get accounts() {
		if (!typeof this.eth === "undefined")
			return this.eth.getAccounts();
	}
	get chainId() { return this.__chainId; }
	get currentAccount() {
		if (!typeof this.eth === "undefined")
			return this.accounts.then(accounts => accounts[0]);
	}
	get eth() { return this.__web3.eth; }
	get provider() { return this.__provider; }
	get isConnected() {
		if (typeof this.provider === "undefined")
			return false;
		return this.provider.isConnected();
	}
	get isProviderConnected() { return this.currentAccount.then(currentAccount => typeof currentAccount !== "undefined"); }
	get utils() { return this.__web3.utils; }

	async connect() { this.__onAccountsChanged(await this.eth.requestAccounts()); }
	__addEvents() {
		this.__events = new EventSet("addListener", "removeListener", [
			new MareEvent(this.provider, "accountsChanged", this.__onAccountsChanged.bind(this)), 
			new MareEvent(this.provider, "chainChanged", this.__onChainChanged.bind(this)), 
			new MareEvent(this.provider, "connect", this.__onConnected.bind(this)), 
			new MareEvent(this.provider, "disconnect", this.__onDisconnected.bind(this))
		]);
		this.__events.startListening();
		self.document.addEventListener("visibilitychange", this.__onSelfVisibilityChange.bind(this), { passive: true });
	}
	__ethRequest(args) {
		if (this.isConnected)
			return this.provider.request(args);
	}
	__ethRequestMethod(method) { return this.__ethRequest({ method }); }
	__getProvider() {
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

				if (ethereum)
					resolve(ethereum);
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
	async __initialize() {
		console.log("starting initializing");
		this.__provider = await this.__getProvider();
		this.__addEvents();

		if (typeof this.provider === "string")
			return;
		// this.dispatchEvent(events.get("initialized"));
		await loadScriptAsync("script/web3.min.js");
		this.__web3 = new self.Web3(this.provider);
		console.log("finished initializing");
		const accounts = await this.accounts;
		console.log(this.accounts);
		this.__onAccountsChanged(accounts);
	}
	__onAccountsChanged(accounts) {
		console.log("accounts changed", accounts);
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
self.Object.defineProperty(MareWeb3.prototype, "mareUtils", { enumerable: true, value: Web3MareUtils });

export { MareWeb3 };