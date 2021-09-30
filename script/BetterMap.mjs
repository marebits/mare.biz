class BetterMap extends self.Map {
	constructor(iterable) {
		super(iterable);
		return new self.Proxy(this, {
			get: function(target, property) {
				const result = self.Reflect.get(target, property);

				if (typeof result === "function")
					return result.bind(target);
				else if (target.hasOwnProperty(property))
					return target[property];
				else if (target.has(property))
					return target.get(property);
				return result;
			}
		});
	}
	reduce(callbackFn, initialValue, thisArg = undefined) {
		const len = this.length;

		if (typeof callbackFn === "undefined" || typeof callbackFn !== "function" || typeof callbackFn.call !== "function")
			return initialValue;
		else if (len === 0 && typeof initialValue === "undefined")
			return;
		const iterator = this[self.Symbol.iterator]();
		let accumulator = undefined;
		let current = {};
		let isDone = false;

		if (typeof initialValue !== "undefined")
			accumulator = initialValue;
		else {
			current = iterator.next();
			accumulator = current.value[1];
		}

		while (!(current = iterator.next()).done)
			accumulator = callbackFn.call(thisArg, accumulator, current.value[1], current.value[0], this);
		return accumulator;
	}
}

export { BetterMap };