import { CONSTANTS } from "./constants.mjs";
import { getRandomInt, ScreenMeasure } from "./utils.mjs";

class StarContainer {
	static templateStar = self.document.createElement("div");

	element = undefined;
	maxHeight = undefined;
	numberStars = 0;
	scrollSpeed = 1;
	size = 5;
	stars = undefined;

	constructor(elementId, density, size, scrollSpeed) {
		this.element = self.document.getElementById(elementId);
		this.scrollSpeed = scrollSpeed;
		this.maxHeight = ScreenMeasure.maxHeight; //self.Math.floor(ScreenMeasure.maxHeight * (1 + this.scrollSpeed * 0.6));
		this.numberStars = self.Math.floor(ScreenMeasure.maxWidth / 1000 * this.maxHeight / 1000 * density);
		this.size = size;
		this.stars = self.document.createDocumentFragment();
		this.element.style.setProperty("--scroll-speed", `-${this.scrollSpeed}px`);
		this.generateStars();
	}
	generateStars() {
		for (let i = 0; i < this.numberStars; i++) {
			const star = this.constructor.templateStar.cloneNode();
			const red = getRandomInt(200, 255) * 0x10000;
			const green = getRandomInt(200, 255) * 0x100;
			const blue = getRandomInt(200, 255) + 200;
			const colorMask = CONSTANTS.COLOR_MASKS[getRandomInt(0, 2)];
			star.style.setProperty("--star-blur-offset", `${getRandomInt(-50, 50) / 100}px`);
			star.style.setProperty("--star-color", `#${((red + green + blue) | colorMask).toString(16)}`);
			star.style.setProperty("--star-pos-x", `${getRandomInt(0, ScreenMeasure.maxWidth)}px`);
			star.style.setProperty("--star-pos-y", `${getRandomInt(0, this.maxHeight)}px`);
			star.style.setProperty("--star-size-base", `${this.size}px`);
			star.style.setProperty("--star-size-offset", `${getRandomInt(-50, 50) / 100}px`);
			star.style.setProperty("--star-twinkle-offset", `${getRandomInt(-30, 30) / 100}s`)
			this.stars.appendChild(star);
		}
		this.element.appendChild(this.stars);
	}
}

export { StarContainer };