const CONSTANTS = {
	CHAINS: ["", "Ethereum Mainnet", "Expanse Network", "Ropsten Test Network"], 
	COLOR_MASKS: [0xff0000, 0xffff00, 0xff], 
	CONTRACT_LINK: {
		ATTRIBUTES: [["bexName", "bex-name"], ["buttonColor", "button-color"], ["contract", "contract"], ["hrefBase", "href-base"]], 
		BUTTON_TITLE: "Copy contract address", 
		COPY_MESSAGE: "Copied!", 
		DEFAULT_BEX_NAME: "Etherscan", 
		DEFAULT_BUTTON_COLOR: "black", 
		REL: "external noopener", 
		TARGET: "_blank"
	}, 
	ETH_UNITS: [
		["wei", "1"], ["kwei", "1000"], ["mwei", "1000000"], ["gwei", "1000000000"], ["szabo", "1000000000000"], ["ether", "1000000000000000000"]
	], 
	TARGET_CHAIN_ID: "0x3", 
	TOKEN_CONTRACT_ADDRESS: "0xc5a1973e1f736e2ad991573f3649f4f4a44c3028", 
	TOKEN_ICON_PNG: "https://mare.biz/marebits/icon-512.png", 
	TOKEN_SALE_RATE: 65426600000n
};

export { CONSTANTS };