// other constants (not configurable)
const _privates = new self.WeakMap();

// private methods
function testAccessor(storageAccessor) {
	if (!storageAccessor instanceof self.Storage && !storageAccessor instanceof MapAccessor)
		return false;
	const test = "_______Twilight Sparkle is Best Pony, but this is just a test!";

	try {
		storageAccessor.setItem(test, test);

		if (storageAccessor.getItem(test) !== test)
			return false;
		storageAccessor.removeItem(test);
		return true;
	} catch (err) { return false; }
}

class MapAccessor extends self.Map {
	get [self.Symbol.toStringTag]() { return "MapAccessor"; }
	get length() { return super.size; }
	getItem(keyName) {
		const result = super.get(keyName.toString());

		if (result === undefined)
			return null;
		return result;
	}
	key(index) {
		index = self.Number.parseInt(index);

		if (index < 0 || !self.Number.isSafeInteger(index))
			return null;
		const keys = self.Array.from(super.keys());

		if (index > keys.length - 1)
			return null;
		return keys[index];
	}
	removeItem(keyName) { return super.delete(keyName.toString()); }
	setItem(keyName, keyValue) { super.set(keyName.toString(), keyValue.toString()); }
}
class MareCache /* implements self.Storage */ {
	constructor(storageAccessor) { _privates.set(this, { storageAccessor: testAccessor(storageAccessor) ? storageAccessor : new MapAccessor() }); }
	get [self.Symbol.toStringTag]() { return "MareCache"; }
	get length() { return _privates.get(this).storageAccessor.length; }
	clear() { _privates.get(this).storageAccessor.clear(); }
	get(keyName) { return this.getItem(keyName); }
	getAccessor(keyName) {
		return {
			get() { return this.get(keyName); },
			set(keyValue) { return this.set(keyName, keyValue); }
		};
	}
	getItem(keyName) { return _privates.get(this).storageAccessor.getItem(keyName.toString()); }
	getOrSet(keyName, keyValueGenerator) {
		let keyValue = this.getItem(keyName);

		if (keyValue == null) {
			keyValue = (typeof keyValueGenerator === "function") ? keyValueGenerator.call() : keyValueGenerator;
			this.setItem(keyName, keyValue);
		}
		return keyValue;
	}
	key(index) { return _privates.get(this).storageAccessor.key(self.Number.parseInt(index)); }
	remove(keyName) { return this.removeItem(keyName); }
	removeItem(keyName) { return _privates.get(this).storageAccessor.removeItem(keyName.toString()); }
	set(keyName, keyValue) { this.setItem(keyName, keyValue); }
	setItem(keyName, keyValue) { try { _privates.get(this).storageAccessor.setItem(keyName.toString(), keyValue.toString()); } catch (err) { return; } }
}
class MareTypedCache extends MareCache {
	get [self.Symbol.toStringTag]() { return "MareTypedCache"; }
	getItem(keyName) {
		const keyValue = super.getItem(keyName);

		try {
			const keyValueJson = self.JSON.parse(keyValue);

			if ("keyValue" in keyValueJson && "keyValueType" in keyValueJson) {
				if (keyValueJson.keyValueType === "bigint")
					return self.BigInt(keyValueJson.keyValue);
				return keyValueJson.keyValue;
			}
			return keyValue;
		} catch (err) {}

		if (keyValue === "undefined")
			return undefined;
		return keyValue;
	}
	setItem(keyName, keyValue) {
		const keyValueType = typeof keyValue;

		switch (keyValueType) {
			case "boolean":
			case "number":
			case "string":
				super.setItem(keyName, self.JSON.stringify({ keyValue, keyValueType }));
				break;
			case "bigint": super.setItem(keyName, self.JSON.stringify({ keyValue: keyValue.toString(), keyValueType })); break;
			case "undefined": super.setItem(keyName, "undefined"); break;
			default:
				if (keyValue instanceof self.Promise)
					keyValue.then(keyValue => this.setItem(keyName, keyValue)).catch(console.error);
				else if (keyValue !== null)
					super.setItem(keyName, self.JSON.stringify({ keyValue, keyValueType: "object" }));
		}
	}
}

const Cache = {
	get persisted() { return self.Object.defineProperty(this, "persisted", { enumerable: true, value: new MareCache(self.localStorage) }).persisted; }, 
	get session() { return self.Object.defineProperty(this, "session", { enumerable: true, value: new MareCache(self.sessionStorage) }).session; }, 
	Typed: {
		get persisted() { return self.Object.defineProperty(this, "persisted", { enumerable: true, value: new MareTypedCache(self.localStorage) }).persisted; }, 
		get session() { return self.Object.defineProperty(this, "session", { enumerable: true, value: new MareTypedCache(self.sessionStorage) }).session; }
	}
};
export { Cache };