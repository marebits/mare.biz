class Cache {
	static get(key) {
		try { return self.localStorage.getItem(key); } catch (err) { return null; }
		return null;
	}
	static getAccessor(key) {
		return {
			get() { return Cache.get(key); },
			set(value) { Cache.set(key, value); }
		};
	}
	static remove(key) {
		try { return self.localStorage.removeItem(key); } catch (err) { return; }
	}
	static set(key, value) {
		if (value === undefined)
			this.remove(key);
		else
			try { self.localStorage.setItem(key, value); } catch(err) { return; }
	}
}

export { Cache };