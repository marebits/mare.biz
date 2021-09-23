import { Cache } from "./script/Cache.mjs";

class TypedCache {
	static get(key) {
		const cachedValue = Cache.get(key);

		try {
			const cachedJson = self.JSON.parse(cachedValue);

			if ("value" in cachedJson && "valueType" in cachedJson)
				if (cachedJson.valueType === "bigint")
					return self.BigInt(cachedJson.value);
				return cachedJson.value;
			return cachedValue;
		} catch {}

		if (cachedValue === "undefined")
			return undefined;
		return cachedValue;
	}
	static getAccessor(key) { return { get() { return TypedCache.get(key); }, set(value) { TypedCache.set(key, value); } }; }
	static remove(key) { Cache.remove(key); }
	static set(key, value) {
		let valueType = typeof value;

		switch (valueType) {
			case "boolean":
			case "number":
			case "string":
				Cache.set(key, self.JSON.stringify({ value, valueType }));
				break;
			case "bigint": Cache.set(self.JSON.stringify({ value: value.toString(), valueType })); break;
			case "undefined": Cache.set(key, "undefined"); break;
			default:
				if (value instanceof self.Promise)
					value.then(value => this.set(key, value)).catch(console.error);
				else if (value !== null)
					Cache.set(key, self.JSON.stringify({ value, valueType: "object" });
		}
	}
}

export { TypedCache };