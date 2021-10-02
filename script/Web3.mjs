import { BetterMap } from "./BetterMap.mjs";
import { CONSTANTS } from "./constants.mjs";
import { EventSet, browserEvents } from "./EventSet.mjs";
import { MareEvent } from "./MareEvent.mjs";
// import { TypedCache } from "./TypedCache.mjs";
import { fetchJson, loadScriptAsync, preload } from "./utils.mjs";

const ETH_UNITS = new BetterMap(CONSTANTS.ETH_UNITS);
const events = new self.Map([
	["accountsChanged", new self.Event("accountsChanged")], 
	["connected", new self.Event("connected")], 
	["disconnected", new self.Event("disconnected")], 
	["initialized", new self.Event("initialized")]
]);

class Mare {
	__isInitialized = false;

	constructor(web3) { this.web3 = web3; }

	get balance() { return this.web3.currentAccount.then(currentAccount => this.__balanceOf(currentAccount)).then(this.web3.mareUtils.fromWei); }
	get bestPony() { return this.__callMethod("bestPony"); }
	get capReached() { return this.__callMethod("capReached"); }
	get closingTime() { return this.__callMethod("closingTime"); }
	get ethRaised() { return this.weiRaised.then(weiRaised => this.web3.utils.fromWei(weiRaised)); }
	get hasClosed() { return this.__callMethod("hasClosed"); }
	get isFinalized() { return this.__callMethod("isFinalized"); }
	get isInitialized() { return this.__isInitialized; }
	get isOpen() { return this.__callMethod("isOpen"); }
	get mareSold() { return this.weiRaised.then(weiRaised => this.web3.mareUtils.fromWei(BigInt(weiRaised) * CONSTANTS.TOKEN.SALE_RATE)); }
	get openingTime() { return this.__callMethod("openingTime"); }
	get weiRaised() { return this.__callMethod("weiRaised"); }

	buyTokens(amount, onTransactionHash, onReceipt, onConfirmation, onError) {
		const amountWei = this.web3.utils.toWei(amount);
		return this.web3.currentAccount.then(currentAccount => this.contract.methods.buyTokens(currentAccount).send({ from: currentAccount, value: amountWei })
			.addListener("transactionHash", (transactionHash) => onTransactionHash(transactionHash))
			.addListener("receipt", (receipt) => onReceipt(receipt))
			.addListener("confirmation", (confirmation, receipt, latestBlockHash) => onConfirmation(confirmation, receipt, latestBlockHash))
			.addListener("error", (error) => onError(error))
		);
	}
	watchAsset() {
		return this.web3.__ethRequest({
			method: "wallet_watchAsset", 
			params: {
				options: {
					address: CONSTANTS.TOKEN.CONTRACT_ADDRESS, 
					decimals: 18, 
					image: CONSTANTS.TOKEN.ICON_PNG, 
					symbol: CONSTANTS.TOKEN.SYMBOL
				},
				type: "ERC20"
			}
		});
	}
	withdrawTokens(onTransactionHash, onReceipt, onConfirmation, onError) {
		return this.web3.currentAccount.then(currentAccount => this.contract.methods.withdrawTokens(currentAccount).send({ from: currentAccount })
			.addListener("transactionHash", (transactionHash) => onTransactionHash(transactionHash))
			.addListener("receipt", (receipt) => onReceipt(receipt))
			.addListener("confirmation", (confirmation, receipt, latestBlockHash) => onConfirmation(confirmation, receipt, latestBlockHash))
			.addListener("error", (error) => onError(error))
		);
	}
	__balanceOf(account) { return this.__callMethod("balanceOf", account); }
	__callMethod(methodName, ...params) { return this.web3.currentAccount.then(currentAccount => this.contract.methods[methodName](...params).call({ from: currentAccount })); }
	async __initialize() {
		const marebitsPresale = await fetchJson(CONSTANTS.PRESALE.CONTRACT_ABI);
		this.abi = marebitsPresale.abi;
		this.contract = new this.web3.eth.Contract(this.abi, CONSTANTS.PRESALE.CONTRACT_ADDRESS, { from: await this.web3.currentAccount });
		this.__isInitialized = true;
	}
}
class MareUtils {
	static get ETH_UNITS() { return ETH_UNITS; }

	static fromWei(number, unit = ETH_UNITS.ether) {
		number = number.toString();

		if (number === "0" || number == "")
			return "0";
		else if (!ETH_UNITS.has(unit))
			unit = ETH_UNITS.ether;
		const decimals = unit.length - 1;
		const result = { whole: "0", fraction: number.slice(-decimals) };
		const wholeLength = number.length - decimals;

		if (wholeLength > 0)
			result.whole = self.Number.parseInt(number.substring(0, wholeLength)).toLocaleString("en-US");
		else if (wholeLength < 0)
			result.fraction = `${"0".repeat(-wholeLength)}${result.fraction}`;
		return `${result.whole}.${result.fraction}`.replace(/\.?0+$/, "");
	}
	static toWei(number, unit = ETH_UNITS.ether) {
		number = number.toString();

		if (number == "" || number === "0" || /e/i.test(number))
			return 0n;
		else if (!ETH_UNITS.has(unit))
			unit = ETH_UNITS.ether;
		const inputValueSplit = number.split(".");
		const numDecimals = unit.length - 1;

		if (inputValueSplit.length === 1)
			inputValueSplit[1] = "0";
		else
			inputValueSplit[1] = inputValueSplit[1].substring(0, numDecimals);
		return self.BigInt((inputValueSplit[0] + inputValueSplit[1].padEnd(numDecimals, "0")).replace(/^0*/, ""));
	}
}
class Web3 extends self.EventTarget {
	mare = new Mare(this);
	__isWeb3ScriptLoaded = self.Promise.resolve(false);

	constructor() {
		super();
		this.__initialize().catch(console.error);
	}

	get accounts() { return this.eth.getAccounts(); }
	get chainId() { return this.eth.getChainId(); }
	get currentAccount() {
		if (typeof this.eth !== "undefined")
			return this.accounts.then(accounts => accounts[0]);
	}
	get eth() {
		if (typeof this.__web3 !== "undefined" && typeof this.__web3.eth !== "undefined")
			return this.__web3.eth;
	}
	get isTargetChain() { return this.chainId.then(chainId => chainId === CONSTANTS.TARGET_CHAIN_ID); }
	get provider() { return this.__provider; }
	get isConnected() {
		if (typeof this.provider === "undefined")
			return false;
		return this.provider.isConnected();
	}
	// get isProviderConnected() { return this.currentAccount.then(currentAccount => typeof currentAccount !== "undefined"); }
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

				if (self.ethereum)
					resolve(self.ethereum);
				else if (typeof self.web3 !== "undefined" && typeof self.web3.currentProvider !== "undefined")
					resolve(self.web3.currentProvider);
				resolve("Cannot detect an installed web3 compatible wallet.");
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

		if (typeof this.provider === "string") {
			await this.__loadWeb3Script();
			this.__provider = new self.Web3.providers.HttpProvider((new self.URL(CONSTANTS.INFURA.PROJECT_ID, CONSTANTS.INFURA.ENDPOINT)).toString());
		}
		this.__addEvents();
		await this.__loadWeb3Script();
		this.__web3 = new self.Web3(this.provider);
		await this.mare.__initialize();
		console.log("finished initializing");
		this.dispatchEvent(events.get("initialized"));
		// this.__onAccountsChanged(await this.accounts);
	}
	async __loadWeb3Script() {
		return this.__isWeb3ScriptLoaded.then(isWeb3ScriptLoaded => {
			if (isWeb3ScriptLoaded)
				return;
			return this.__isWeb3ScriptLoaded = loadScriptAsync("script/web3.min.js").then(() => true);
		});
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
self.Object.defineProperty(Web3.prototype, "mareUtils", { enumerable: true, value: MareUtils });

export { Web3 };