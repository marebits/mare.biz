import { BetterMap } from "./BetterMap.mjs";

const _privates = new self.WeakMap();

class DurationValue {
	static get properties() {
		delete this.properties;
		return this.properties = new BetterMap([
			["years", new this("P", 1, "years", "Y", t => t / 1000 / 60 / 60 / 24 / 365.25, n => n * 1000 * 60 * 60 * 24 * 365.25)], 
			["months", new this("P", 2, "months", "M", t => t / 1000 / 60 / 60 / 24 / (365.25 / 12) % 12, n => n * 1000 * 60 * 60 * 24 * (365.25 / 12))], 
			["weeks", new this("P", 3, "weeks", "W", t => t / 1000 / 60 / 60 / 24 / 7 % 7, n => n * 1000 * 60 * 60 * 24 * 7)], 
			["days", new this("P", 4, "days", "D", t => t / 1000 / 60 / 60 / 24 % 24, n => n * 1000 * 60 * 60 * 24)], 
			["hours", new this("T", 5, "hours", "H", t => t / 1000 / 60 / 60 % 60, n => n * 1000 * 60 * 60)], 
			["minutes", new this("T", 6, "minutes", "M", t => t / 1000 / 60 % 60, n => n * 1000 * 60)], 
			["seconds", new this("T", 7, "seconds", "S", t => t / 1000 % 60, n => n * 1000)]
		]);
	}
	static get regex() {
		delete this.regex;
		return this.regex = this.properties.reduce((designatedValues, properties) => {
			designatedValues.get(properties.designator).push(`(?:(-?\\d*[\\.,]?\\d+)${properties.symbol})?`);
			return designatedValues;
		}, new BetterMap([["P", []], ["T", []]])).reduce((durationRegex, regexArray, designator) => {
			return `${durationRegex}${(designator === "P") ? regexArray.join("") : `(?:T${regexArray.join("")})?$`}`;
		}, "^P");
	}

	static toTimestamp(duration) { return this.properties.reduce((timestamp, properties) => timestamp + properties.toTimestamp(duration[properties.name]), 0, duration); }

	constructor(designator, matchIndex, name, symbol, fromTimestamp, toTimestamp) {
		this.designator = designator;
		this.matchIndex = matchIndex;
		this.name = name;
		this.symbol = symbol;
		this.fromTimestamp = fromTimestamp;
	}

	get [self.Symbol.toStringTag]() { return "DurationValue"; }
}

class Duration {
	constructor(duration = { years: 0, months: 0, weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }) {
		_privates.set(this, { duration: {} });
		const privates = _privates.get(this);

		if (typeof duration === "object") {
			DurationValue.properties.forEach(properties => privates.duration[properties.name] = self.Number(duration[properties.name]) || 0);
			privates.value = DurationValue.toTimestamp(this);
		}
		else if (typeof duration === "string" && self.Number(duration) != duration) {
			const regexResult = DurationValue.regex[self.Symbol.match](duration);
			DurationValue.properties.forEach(properties => privates.duration[properties.name] = self.Number(regexResult[properties.matchIndex]) || 0);
			privates.value = DurationValue.toTimestamp(this);
		} else if (typeof duration === "number" || self.Number(duration) == duration) {
			duration = self.Number(duration);
			DurationValue.properties.forEach(properties => privates.duration[properties.name] = self.Math.floor(properties.fromTimestamp(duration)));
			privates.value = duration;
		}
	}

	get [self.Symbol.toPrimitive](hint) {
		if (hint === "number")
			return this.valueOf();
		return this.toString();
	}
	get [self.Symbol.toStringTag]() { return "Duration"; }
	get years() { return _privates.get(this).duration.years; }
	get months() { return _privates.get(this).duration.months; }
	get weeks() { return _privates.get(this).duration.weeks; }
	get days() { return _privates.get(this).duration.days; }
	get hours() { return _privates.get(this).duration.hours; }
	get minutes() { return _privates.get(this).duration.minutes; }
	get seconds() { return _privates.get(this).duration.seconds; }
	get value() { return _privates.get(this).value; }

	toString(isISO = true) {
		if (isISO) {
			const result = DurationValue.properties.reduce((designatedValues, properties) => {
				const value = this[properties.name];

				if (self.Boolean(value))
					designatedValues.get(properties.designator).push(`${value}${properties.symbol}`);
				return designatedValues;
			}, new BetterMap([["P", []], ["T", []]]), this).reduce((result, designatedValues, designator) => {
				if (designator === "P")
					return `${result}${designatedValues.join("")}`;
				else if (designatedValues.length > 0)
					return `${result}T${designatedValues.join("")}`;
			}, "P");
			return (result === "P") ? "PT0S" : result;
		}
		return DurationValue.properties.reduce((list, properties) => {
			const value = this[properties.name];

			if (self.Boolean(value))
				list.push(`${value} ${properties.name}`);
			return list;
		}, []).join(", ");
	}
	valueOf() { return this.value; }
}

export { Duration };