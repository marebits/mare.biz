import { CONSTANTS } from "./constants.mjs";
import { browserEvents } from "./EventSet.mjs";
import { MareEvent } from "./MareEvent.mjs";
import { writeTextToClipboard } from "./utils.mjs";

const validContractLinkTypes = new self.Set(CONSTANTS.CONTRACT_LINK.VALID_CONTRACT_LINK_TYPES);

class ContractLink extends self.HTMLElement {
	constructor(options) {
		super();
		this.__initializeOptions(options);
		this.chainInfo = CONSTANTS.CHAINS_BY_NAME.get(this.chainName);
		const doc = self.document.createDocumentFragment();
		const style = self.document.createElement("style");
		style.textContent = `
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
					overflow: visible !important;
					padding: 0;
					position: relative;
					width: var(--button-width);
				}
				button::after {
					background-image: url("${CONSTANTS.CONTRACT_LINK.BUTTON_IMAGE_TAG(this.buttonColor)}");
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
		doc.appendChild(style);
		this.anchor = self.document.createElement("a");
		this.anchor.textContent = (super.textContent.length === 0) ? this.contract : super.textContent;
		this.anchor.href = this.href;
		this.anchor.rel = CONSTANTS.CONTRACT_LINK.REL;
		this.anchor.title = this.title;
		this.anchor.target = CONSTANTS.CONTRACT_LINK.TARGET;
		doc.appendChild(this.anchor);
		this.button = self.document.createElement("button");
		browserEvents.add(new MareEvent(this.button, "click", () => this.__onCopyContractClick().catch(console.error), { passive: true }));
		this.button.title = CONSTANTS.CONTRACT_LINK.BUTTON_TITLE;
		doc.appendChild(this.button);
		super.attachShadow({ mode: "open" }).appendChild(doc);
	}
	get buttonColor() { return this.__getAttributeOrDefault("button-color", CONSTANTS.CONTRACT_LINK.DEFAULT_BUTTON_COLOR); }
	get chainName() { return this.__getAttributeOrDefault("chain-name", CONSTANTS.CONTRACT_LINK.DEFAULT_CHAIN_NAME); }
	get contract() { return super.getAttribute("contract"); }
	get contractLinkType() {
		const contractLinkType = super.getAttribute("contract-link-type");

		if (validContractLinkTypes.has(contractLinkType))
			return contractLinkType;
		return CONSTANTS.CONTRACT_LINK.DEFAULT_CONTRACT_LINK_TYPE;
	}
	get href() { return new self.URL(this.contract, new self.URL(`${this.contractLinkType}/`, this.chainInfo.bexHrefBase)); }
	get title() { return CONSTANTS.CONTRACT_LINK.ANCHOR_TITLE_TAG(this.chainInfo.bexName); }
	get __copiedOutputElement() {
		if (typeof this.___copiedOutputElement === "undefined") {
			this.___copiedOutputElement = self.document.createElement("output");
			this.___copiedOutputElement.appendChild(self.document.createTextNode(CONSTANTS.CONTRACT_LINK.COPY_MESSAGE));
			this.button.appendChild(this.___copiedOutputElement);
		}
		return this.___copiedOutputElement;
	}
	__getAttributeOrDefault(attribute, alternative) {
		const value = super.getAttribute(attribute);

		if (value == null || value.length === 0)
			return alternative;
		return value;
	}
	__hideCopiedOutput() { this.__copiedOutputElement.style.opacity = 0; }
	__initializeOptions(options) {
		if (typeof options !== "object" || self.Object.keys(options).length === 0)
			return;
		CONSTANTS.CONTRACT_LINK.ATTRIBUTES.forEach((attributeName, optionName) => {
			if (typeof options[optionName] === "string")
				super.setAttribute(attributeName, options[optionName]);
		});

		if (typeof options.textContent === "string")
				super.replaceChildren(self.document.createTextNode(options.textContent));
	}
	__promiseTimeout(func, delay) { return new self.Promise((resolve) => self.setTimeout(() => resolve(func.call(this)), delay)); }
	__showCopiedOutput() { this.__copiedOutputElement.style.opacity = 1; }
	async __onCopyContractClick(event) {
		await writeTextToClipboard(this.contract);
		this.__hideCopiedOutput();
		await this.__promiseTimeout(this.__showCopiedOutput, 100);
		await this.__promiseTimeout(this.__hideCopiedOutput, 4000);
	}
}

export { ContractLink };