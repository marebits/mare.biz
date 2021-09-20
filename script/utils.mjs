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

function getRandomInt(min, max) { return self.Math.floor(self.Math.random() * (max - min + 1)) + min; }
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

export { ScreenMeasure, getRandomInt, promiseTimeout, writeTextToClipboard };