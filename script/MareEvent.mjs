class MareEvent {
	constructor(target, event, listener, options) {
		this.target = target;
		this.event = event;
		this.listener = listener;
		this.options = options;
	}
}

export { MareEvent };