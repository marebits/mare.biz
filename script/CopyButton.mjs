import { CONSTANTS } from "./constants.mjs";
import { browserEvents } from "./EventSet.mjs";
import { MareCustomElement } from "./MareCustomElement.mjs";
import { MareEvent } from "./MareEvent.mjs";
import { createElement, setAttributes, writeTextToClipboard } from "./utils.mjs";

// configurable constants
const TAG_NAME = "copy-button";

// styles
const INLINE_CSS = `
	@import url("common.css");
	:host {
		--button-height: 1rem;
		--button-width: var(--button-height);
		align-items: center;
		display: inline-flex;
	}
	button { display: none; }
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
		button::after, button::before {
			background-repeat: no-repeat;
			content: "";
			display: inline-block;
			height: 100%;
			transition: opacity 0.2s linear;
			width: 100%;
		}
		button::after {
			left: 0;
			opacity: 0;
			position: absolute;
		}
		button.checked::after { opacity: 1; }
		button.checked::before { opacity: 0; }
		button.white-stroke::after, button.white-stroke::before { filter: brightness(0) invert(1); }
		span {
			align-items: center;
			border-radius: 5rem;
			display: flex;
			height: calc(var(--button-height) + 7px);
			justify-content: center;
			transition: background-color 0.2s linear;
			width: calc(var(--button-width) + 9px);
		}
		span:hover { background-color: rgba(0, 0, 0, 0.3); }
	}
`;

// HTML
const TEMPLATE = self.document.createElement("template");
TEMPLATE.innerHTML = `
	<style>${INLINE_CSS}</style>
	<span><button title="${CONSTANTS.COPY_BUTTON.BUTTON_TITLE}"></button></span>
`;

// other constants (not configurable)
const _privates = new self.WeakMap();

function createDom(options) {
	const privates = _privates.get(this);
	const template = TEMPLATE.content.cloneNode(true);
	const style = createElement("style", {}, template, `
		@media screen {
			button::before {
				background-image: url("${CONSTANTS.COPY_BUTTON.BUTTON_IMAGE_URL(this.buttonColor)}");
			}
			button::after {
				background-image: url("${CONSTANTS.COPY_BUTTON.BUTTON_IMAGE_SUCCESS_URL(this.buttonColor)}");
			}
		}
	`);
	privates.button = template.querySelector("button");
	this.attachShadow({ mode: "open" }).appendChild(template);
}
function getAttributeOrDefault(attribute, alternative) {
	const value = this.getAttribute(attribute);
	return (value == null || value.length === 0) ? alternative : value;
}
function hideCopiedOutput() {
	_privates.get(this).button.classList.remove("checked");
	_privates.get(this).button.title = CONSTANTS.COPY_BUTTON.BUTTON_TITLE;
}
async function onCopyContractClick(event) {
	await writeTextToClipboard(this.textContent);
	hideCopiedOutput.call(this);
	await promiseTimeout.call(this, showCopiedOutput.bind(this), 100);
	await promiseTimeout.call(this, hideCopiedOutput.bind(this), 4000);
}
function promiseTimeout(func, delay) { return new self.Promise(resolve => self.setTimeout(() => resolve(func.call(this)), delay)); }
function showCopiedOutput() {
	_privates.get(this).button.classList.add("checked");
	_privates.get(this).button.title = CONSTANTS.COPY_BUTTON.COPY_MESSAGE;
}

class CopyButton extends MareCustomElement {
	get buttonColor() { return getAttributeOrDefault.call(this, "button-color", CONSTANTS.COPY_BUTTON.DEFAULT_BUTTON_COLOR); }
	connectedCallback() {
		if (!this.isConnected)
			return;
		const privates = _privates.get(this);
		privates.copyContractClickEvent = browserEvents.add(new MareEvent(privates.button, "click", () => onCopyContractClick.call(this).catch(console.error), { passive: true }));
		super.connectedCallback();
	}
	createdCallback(options) {
		_privates.set(this, {});
		createDom.call(this, options);
		super.createdCallback();
	}
	disconnectedCallback() {
		browserEvents.delete(_privates.get(this).copyContractClickEvent);
		super.disconnectedCallback();
	}
}
CopyButton.TAG_NAME = TAG_NAME;

export { CopyButton };