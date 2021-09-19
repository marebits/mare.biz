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
}

export { BetterMap };