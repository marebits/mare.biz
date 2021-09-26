import { CONSTANTS } from "./constants.mjs";
import { browserEvents } from "./EventSet.mjs";
import { MareCustomElement } from "./MareCustomElement.mjs";
import { MareEvent } from "./MareEvent.mjs";
import { createElement, setAttributes, writeTextToClipboard } from "./utils.mjs";

// configurable constants
const TAG_NAME = "contract-link";

// styles
const INLINE_CSS = `
	:host {
		--button-height: 1rem;
		--button-width: var(--button-height);
		align-items: center;
		display: flex;
	}
	* {
		box-sizing: border-box;
		margin: 0;
	}
	a {
		display: inline-block;
		max-width: 90%;
		overflow: hidden;
		text-decoration: underline;
		text-decoration-style: dotted;
		text-overflow: ellipsis;
	}
	a:link { color: var(--link-color); }
	a:visited { color: var(--link-visited-color); }
	a:focus, a:hover { background-color: var(--link-focus-background-color); }
	a:active {
		background-color: var(--link-active-background-color);
		color: var(--link-active-color);
	}
	:host-context(.card.twilight) a { --link-visited-color: var(--twilight-red); }
	button { display: none; }
	button > output { opacity: 0; }
	@media screen {
		button {
			background-color: transparent;
			border: none;
			cursor: pointer;
			display: unset;
			flex-shrink: 0;
			height: var(--button-height);
			margin-left: 0.5em;
			overflow: visible !important;
			padding: 0;
			position: relative;
			width: var(--button-width);
		}
		button::after {
			background-repeat: no-repeat;
			content: "";
			display: inline-block;
			height: 100%;
			width: 100%;
		}
		button.white-stroke::after { filter: brightness(0) invert(1); }
		button > output {
			--width: calc(var(--card-header-font-size) * 2.75);
			background-color: var(--twilight-orange);
			border-radius: 0.5rem;
			font-size: calc(var(--card-header-font-size) / 1.5);
			font-weight: 700;
			height: var(--card-header-font-size);
			left: calc(var(--width) * -1);
			padding: 0.25rem;
			position: absolute;
			transition-duration: 1s;
			transition-property: opacity;
			width: var(--width);
			z-index: 100;
		}
	}
`;

// HTML
const TEMPLATE = self.document.createElement("template");
TEMPLATE.innerHTML = `
	<template>
		<style id="style">${INLINE_CSS}</style>
		<a rel="${CONSTANTS.CONTRACT_LINK.REL}" target="${CONSTANTS.CONTRACT_LINK.TARGET}"><slot></slot></a>
		<button title="${CONSTANTS.CONTRACT_LINK.BUTTON_TITLE}"></button>
		<template><output>${CONSTANTS.CONTRACT_LINK.COPY_MESSAGE}</output></template>
	</template>
`;

// other constants (not configurable)
const _privates = new self.WeakMap();
const validContractLinkTypes = new self.Set(CONSTANTS.CONTRACT_LINK.VALID_CONTRACT_LINK_TYPES);

// private methods
function createCopiedOutputElement() {
	const privates = _privates.get(this);
	return self.Object.defineProperty(privates, "copiedOutputElement", {
		enumerable: true, 
		value: privates.button.appendChild(privates.copiedOutputElementTemplate.cloneNode(true))
	}).copiedOutputElement;
}
function createDom(options) {
	const privates = _privates.get(this);
	const template = TEMPLATE.content.cloneNode(true);
	privates.anchor = template.querySelector("a");
	setAttributes(privates.anchor, { href: this.href, title: this.title });
	privates.button = template.querySelector("button");
	privates.copiedOutputElementTemplate = template.querySelector("template").content;
	this.attachShadow({ mode: "open" }).appendChild(template);
	const style = template.getElementById("style");
	style.sheet.insertRule(`@media screen { button::after { background-image: url("${CONSTANTS.CONTRACT_LINK.BUTTON_IMAGE_TAG(this.buttonColor)}"); } }`, 0);
}
function getAttributeOrDefault(attribute, alternative) {
	const value = this.getAttribute(attribute);
	return (value == null || value.length === 0) ? alternative : value;
}
function hideCopiedOutput() { _privates.get(this).copiedOutputElement.style.opacity = 0; }
function initializeOptions(options) {
	if (typeof options !== "object" || self.Object.keys(options).length === 0)
		return;
	CONSTANTS.CONTRACT_LINK.ATTRIBUTES.forEach((attributeName, optionName) => {
		if (typeof options[optionName] === "string")
			this.setAttribute(attributeName, options[optionName]);
	});

	if (typeof options.textContent === "string")
		this.replaceChildren(self.document.createTextNode(options.textContent));
}
async function onCopyContractClick(event) {
	await writeTextToClipboard(this.contract);
	hideCopiedOutput.call(this);
	await promiseTimeout.call(this, showCopiedOutput.bind(this), 100);
	await promiseTimeout.call(this, hideCopiedOutput.bind(this), 4000);
}
function promiseTimeout(func, delay) { return new self.Promise(resolve => self.setTimeout(() => resolve(func.call(this)), delay)); }
function showCopiedOutput() { _privates.get(this).copiedOutputElement.style.opacity = 1; }

class ContractLink extends MareCustomElement {
	get buttonColor() { return getAttributeOrDefault.call(this, "button-color", CONSTANTS.CONTRACT_LINK.DEFAULT_BUTTON_COLOR); }
	get chainName() { return getAttributeOrDefault.call(this, "chain-name", CONSTANTS.CONTRACT_LINK.DEFAULT_CHAIN_NAME); }
	get contract() { return super.getAttribute("contract"); }
	get contractLinkType() {
		const contractLinkType = super.getAttribute("contract-link-type");

		if (validContractLinkTypes.has(contractLinkType))
			return contractLinkType;
		return CONSTANTS.CONTRACT_LINK.DEFAULT_CONTRACT_LINK_TYPE;
	}
	get href() { return new self.URL(this.contract, new self.URL(`${this.contractLinkType}/`, _privates.get(this).chainInfo.bexHrefBase)); }
	get title() { return CONSTANTS.CONTRACT_LINK.ANCHOR_TITLE_TAG(_privates.get(this).chainInfo.bexName); }
	set contract(contract) {
		const privates = _privates.get(this);
		super.setAttribute("contract", contract);
		privates.anchor.href = this.href;

		if (privates.anchor.textContent.length === 0)
			privates.anchor.textContent = contract;
	}
	connectedCallback() {
		const privates = _privates.get(this);
		privates.copyContractClickEvent = browserEvents.add(new MareEvent(privates.button, "click", () => onCopyContractClick.call(this).catch(console.error), { passive: true }));
	}
	createdCallback(options) {
		_privates.set(this, { chainInfo: CONSTANTS.CHAINS_BY_NAME.get(this.chainName) });
		self.Object.defineProperty(_privates.get(this), "copiedOutputElement", { configurable: true, enumerable: true, get: createCopiedOutputElement.bind(this) });
		createDom.call(this, options);
		initializeOptions.call(this, options);
	}
	disconnectedCallback() { browserEvents.delete(_privates.get(this).copyContractClickEvent); }
}
ContractLink.TAG_NAME = TAG_NAME;

export { ContractLink };