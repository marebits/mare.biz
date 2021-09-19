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

export { getRandomInt, ScreenMeasure };