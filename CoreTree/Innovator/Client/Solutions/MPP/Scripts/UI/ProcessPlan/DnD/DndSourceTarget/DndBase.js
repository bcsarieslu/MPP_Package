define([
	'dojo/_base/declare'
],
function(declare) {
	return declare(null, {
		dndData: null,

		isActive: null,

		constructor: function(inputArguments) {
			this.dndData = {
				controller: inputArguments.controller,
				domNode: inputArguments.domNode || this.domNode,
				dragData: null,
				eventListeners: {}
			};
		},

		activateDnD: function(doActive) {
			var isActive = Boolean(this.isActive);
			doActive = Boolean(doActive);

			if (!isActive && doActive) {
				if (this.attachDnDEventsSource) {
					this.attachDnDEventsSource(this.dndData.domNode, doActive);
				}
				if (this.attachDnDEventsTarget) {
					this.attachDnDEventsTarget(this.dndData.domNode, doActive);
				}
			}
			this.isActive = doActive;
		},

		isRegistered: function() {
			return Boolean(this.dndData.controller);
		}
	});
});
