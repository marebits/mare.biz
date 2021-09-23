const chainsBase = [
	[0x1, { bexName: "Etherscan", bexHrefBase: "https://etherscan.io/", name: "Ethereum Mainnet", shortName: "eth" }], 
	[0x3, { bexName: "Etherscan", bexHrefBase: "https://ropsten.etherscan.io/", name: "Ropsten Test Network", shortName: "ropsten" }], 
	[0x89, { bexName: "Polygonscan", bexHrefBase: "https://polygonscan.com/", name: "Matic Mainnet", shortName: "matic" }], 
	[0x539, { bexName: "Ganache", bexHrefBase: "https://mare.biz/", name: "Ganache", shortName: "ganache" }], 
	[0x13881, { bexName: "Polygonscan", bexHrefBase: "https://mumbai.polygonscan.com/", name: "Matic Mumbai Testnet", shortName: "mumbai" }]
];
const CONSTANTS = {
	CHAINS: new self.Map(chainsBase), 
	COLOR_MASKS: [0xff0000, 0xffff00, 0xff], 
	CONTRACT_LINK: {
		ANCHOR_TITLE_TAG: function(bexName) { return `View contract on ${bexName}`; }, 
		ATTRIBUTES: new self.Map([["buttonColor", "button-color"], ["chainName", "chain-name"], ["contract", "contract"], ["contractLinkType", "contract-link-type"]]), 
		BUTTON_IMAGE_TAG: function(buttonColor) { return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><g fill='none' stroke='${self.encodeURIComponent(buttonColor)}' stroke-linejoin='round'><path d='M2 5h9v9H2z'/><path d='M5 5V2h9v9h-3'/></g></svg>`; }, 
		BUTTON_TITLE: "Copy contract address", 
		COPY_MESSAGE: "Copied!", 
		DEFAULT_BUTTON_COLOR: "black", 
		DEFAULT_CHAIN_NAME: "eth", 
		DEFAULT_CONTRACT_LINK_TYPE: "address", 
		REL: "external noopener", 
		TARGET: "_blank", 
		VALID_CONTRACT_LINK_TYPES: ["address", "token", "tx"]
	}, 
	ETH_UNITS: [["wei", "1"], ["kwei", "1000"], ["mwei", "1000000"], ["gwei", "1000000000"], ["szabo", "1000000000000"], ["ether", "1000000000000000000"]], 
	PRESALE: {
		CAP: 2, 
		CONTRACT_ABI: "script/MarebitsPresale.json", 
		CONTRACT_ADDRESS: "0x5f891a109DD0A6EfBC8Dd447A77800BefbB57220"
	}, 
	TARGET_CHAIN_ID: 0x539, 
	TOKEN: {
		CONTRACT_ADDRESS: "0x97ba87557967E2FC9793fd53B496B0652Ba9bA72", //ropsten: "0x35c94a5a563d7dc00b7edaa455e0a931691deb27", //production: 0xc5a1973e1f736e2ad991573f3649f4f4a44c3028
		ICON_PNG: "https://mare.biz/marebits/icon-512.png", 
		SALE_RATE: 60753271517n, 
		SYMBOL: "MARE"
	}
};
self.Object.defineProperty(CONSTANTS, "CHAINS_BY_NAME", {
	enumerable: true, 
	value: new self.Map(chainsBase.reduce(function(previousValue, currentValue, currentIndex) {
		previousValue[currentIndex] = [currentValue[1].shortName, { bexName: currentValue[1].bexName, bexHrefBase: currentValue[1].bexHrefBase, chainId: currentValue[0], name: currentValue[1].name }];
		return previousValue;
	}, new self.Array(chainsBase.length)))
});

self.Object.freeze(CONSTANTS);

export { CONSTANTS };