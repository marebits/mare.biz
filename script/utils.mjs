const _privates = new self.WeakMap();
const preloadedFiles = new self.Set();

if (!"requestIdleCallback" in self)
	self.requestIdleCallback = (task) => self.setTimeout(task, 1);

class ScreenMeasure {
	static get maxHeight() {
		const maxHeight = self.Math.max(
				self.screen.height, self.document.body.scrollHeight, self.document.body.offsetHeight, self.document.documentElement.clientHeight, 
				self.document.documentElement.scrollHeight, self.document.documentElement.offsetHeight
			);
		delete this.maxHeight;
		self.Object.defineProperty(this, "maxHeight", { value: maxHeight });
		return maxHeight;
	}
	static get maxWidth() {
		const maxWidth = self.screen.width;
		delete this.maxWidth;
		self.Object.defineProperty(this, "maxWidth", { value: maxWidth });
		return maxWidth;
	}
}
class VisibilityListener {
	constructor(listener) { _privates.set(this, { event }); }
	ignore() { self.document.removeEventListener("visibilitychange", _privates.get(this).listener, { passive: true }); }
	listen() { self.document.addEventListener("visibilitychange", _privates.get(this).listener, { passive: true }); }
}

function arrayify(something) {
	if (typeof something === "object")
		if ("forEach" in something)
			return something;
		else if (typeof something.length === "number") {
			const result = self.Array.prototype.slice.call(something, 0);
			something.forEach = result.forEach;
			return result;
		}
	return [something];
}
function createElement(name, attributes = {}, parent = undefined, text = undefined) {
	const element = self.document.createElement(name);
	setAttributes(element, attributes);

	if (text !== undefined)
		element.appendChild(self.document.createTextNode(self.String(text)));

	if (parent instanceof self.Node)
		parent.appendChild(element);
	return element;
}
function defineCustomElement(ElementClass) {
	const supportsCustomElements = self.customElements && self.customElements.define;
	const supportsRegisterElement = self.Boolean(self.document.registerElement);

	function customElementsNotSupported() { return; }
	function defineCustomElementV0(ElementClass) {
		const testElementConstructor = self.document.createElement(ElementClass.TAG_NAME).constructor;

		if (testElementConstructor === self.HTMLElement || testElementConstructor === self.HTMLUnknownElement)
			return;
		self.document.registerElement(ElementClass.TAG_NAME, { prototype: self.Object.create(ElementClass.prototype) });
	}
	function defineCustomElementV1(ElementClass) {
		if (self.customElements.get(ElementClass.TAG_NAME))
			return;
		self.customElements.define(ElementClass.TAG_NAME, ElementClass);
	}

	if (supportsCustomElements)
		defineCustomElement = defineCustomElementV1;
	else if (supportsRegisterElement)
		defineCustomElement = defineCustomElementV0;
	else
		defineCustomElement = customElementsNotSupported;
	defineCustomElement(ElementClass);
}
function defineCustomElements(elementClasses) { arrayify(elementClasses).forEach(defineCustomElement); }
function fetchGeneric(url, mimeType, preloadAs = "fetch") {
	if (preloadAs !== false)
		preload(url, { as: preloadAs, type: mimeType });
	return self.fetch(url, { Accept: mimeType });
}
async function fetchHtml(url) { return (new self.DOMParser()).parseFromString(await fetchText(url, "text/html", false), "text/html"); }
async function fetchJson(url, mimeType = "application/json") { return (await fetchGeneric(url, mimeType)).json(); }
async function fetchText(url, mimeType = "text/plain", preloadAs = "fetch") { return (await fetchGeneric(url, mimeType, preloadAs)).text(); }
function getRandomInt(min, max) { return self.Math.floor(self.Math.random() * (max - min + 1)) + min; }
function loadScriptAsync(scriptPath, type = "text/javascript") {
	preload(scriptPath, { as: "script", type });
	const scriptElement = createElement("script", { async: true, defer: true, src: scriptPath.toString() });

	if (type !== "text/javascript")
		scriptElement.type = type;
	return new self.Promise(function(resolve, reject) {
		function removeListeners() {
			scriptElement.removeEventListener("error", scriptOnError, { once: true, passive: true });
			scriptElement.removeEventListener("load", scriptOnLoad, { once: true, passive: true });
		}
		function scriptOnError(event) {
			removeListeners();
			reject(event);
		}
		function scriptOnLoad() {
			removeListeners();
			resolve(scriptElement);
		}

		scriptElement.addEventListener("load", scriptOnLoad, { once: true, passive: true });
		scriptElement.addEventListener("error", scriptOnError, { once: true, passive: true });
		self.document.head.appendChild(scriptElement);
	});
}
function preload(files = [], attributes = {}) {
	self.requestAnimationFrame(() => arrayify(files).forEach(hrefOrAttributes => {
		const fileAttributes = (typeof hrefOrAttributes === "string") ? { href: hrefOrAttributes } : hrefOrAttributes;

		if (preloadedFiles.has(fileAttributes.href))
			return;
		createElement("link", self.Object.assign({ rel: "preload" }, attributes, fileAttributes), self.document.head);
		preloadedFiles.add(fileAttributes.href);
	}));
}
function runInBackground(task, timeout = 5000) { self.requestIdleCallback(task, { timeout }); }
function setAttributes(element, attributes = {}) {
	for (const key in attributes)
		element.setAttribute(key, attributes[key]);
}
function writeTextToClipboard(text) { // returns self.Promise
	if ("navigator" in self && "clipboard" in self.navigator && "writeText" in self.navigator.clipboard)
		return self.navigator.clipboard.writeText(self.String(text));
	else
		return this.__promiseTimeout(function() {
			const textArea = self.document.createElement("textarea");
			textArea.value = self.String(text);
			self.document.body.appendChild(textArea);
			textArea.select();
			self.document.execCommand("copy");
			textArea.remove();
			resolve();
		});
}

export {
	ScreenMeasure, 
	VisibilityListener, 
	createElement, 
	defineCustomElement, 
	defineCustomElements, 
	fetchGeneric, 
	fetchHtml, 
	fetchJson, 
	fetchText, 
	getRandomInt, 
	loadScriptAsync, 
	preload, 
	runInBackground, 
	setAttributes, 
	writeTextToClipboard
};