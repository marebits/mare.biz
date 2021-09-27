class EventSet extends self.Set {
	constructor(addMethodName, removeMethodName, iterable) {
		super(iterable);
		this.addMethodName = addMethodName;
		this.isListening = false;
		this.removeMethodName = removeMethodName
	}
	add(event) {
		super.add(event);

		if (this.isListening)
			event.target[this.addMethodName](event.event, event.listener, event.options);
		return event;
	}
	addMany(events) {
		for (const event of events)
			this.add(event);
		return events;
	}
	startListening() {
		if (this.isListening)
			return;
		super.forEach((event) => event.target[this.addMethodName](event.event, event.listener, event.options));
		this.isListening = true;
	}
	delete(event) {
		if (this.isListening)
			event.target[this.removeMethodName](event.event, event.listener, event.options);
		super.delete(event);
	}
	deleteMany(events) {
		for (const event of events)
			this.delete(event);
	}
	stopListening() {
		if (!this.isListening)
			return;
		super.forEach((event) => event.target[this.removeMethodName](event.event, event.listener, event.options));
		this.isListening = false;
	}
}

const browserEvents = new EventSet("addEventListener", "removeEventListener");

export { EventSet, browserEvents };