"use strict";
import { StarContainer } from "./StarContainer.mjs";

function onBodyLoad() {
	let frame = false;

	function onWindowScroll() {
		if (frame)
			self.cancelAnimationFrame(frame);
		frame = self.requestAnimationFrame(function() {
			self.document.documentElement.style.setProperty("--scroll-y", self.scrollY);
			frame = false;
		});
	}

	StarContainer.templateStar.classList.add("star");
	StarContainer.templateStar.setAttribute("role", "presentation");
	self.requestAnimationFrame(function() { new StarContainer("stars-front", 35, 5, 0.05); });
	self.requestAnimationFrame(function() { new StarContainer("stars-middle", 70, 3, 0.03); });
	self.requestAnimationFrame(function() { new StarContainer("stars-back", 100, 1.25, 0.01); });
	self.addEventListener("scroll", onWindowScroll, { passive: true });
}

if (self.document.readyState === "loading")
	self.document.addEventListener("DOMContentLoaded", onBodyLoad, { once: true, passive: true });
else
	onBodyLoad();