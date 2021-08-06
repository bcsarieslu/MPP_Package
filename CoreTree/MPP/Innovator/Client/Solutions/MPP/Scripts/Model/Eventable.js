define([
	'dojo/_base/declare'
],
function(declare) {
	return declare('Aras.Client.Controls.MPP.Model.Eventable', null, {
		eventCallbacks: null,

		constructor: function(args) {
			this.eventCallbacks = {};
		},

		getEventCallbackCache: function(eventName) {
			if (!this.eventCallbacks[eventName]) {
				this.eventCallbacks[eventName] = [];
			}

			return this.eventCallbacks[eventName];
		},

		addEventListener: function(eventOwner, contextObject, eventName, eventCallback, listenerPriority) {
			/// <summary>
			/// Adds event listener on 'eventName' of 'eventOwner'
			/// </summary>
			/// <param name="eventOwner" type="Object">see the "type" property.</param>
			/// <param name="contextObject" type="Object">Caller of eventCallback.</param>
			/// <param name="eventName" type="String">Name of the event</param>
			/// <param name="eventCallback" type="Function">Callback, which should be called when event is raised.</param>
			/// <param name="listenerPriority" type="Number">Priority of eventCallback (asc)</param>
			/// <returns>descriptro of attached listener</returns>
			if (eventName && eventCallback) {
				var callbacksCache = this.getEventCallbackCache(eventName);
				var callbackDescriptor = {
					eventName: eventName,
					owner: eventOwner,
					context: contextObject || eventOwner,
					callback: eventCallback,
					target: this,
					active: true,
					remove: this.callbackRemoveDelegate,
					priority: listenerPriority === undefined ? 0 : listenerPriority
				};

				callbacksCache.push(callbackDescriptor);
				callbacksCache.sort(this.eventListenerSorter);

				return callbackDescriptor;
			}
		},

		eventListenerSorter: function(firstDescriptor, secondDescriptor) {
			var firstPriority = firstDescriptor.priority || 0;
			var secondPriority = secondDescriptor.priority || 0;

			return secondPriority - firstPriority;
		},

		callbackRemoveDelegate: function() {
			this.target.removeEventListener(this);
		},

		removeEventListener: function(listenerDescriptor) {
			if (listenerDescriptor) {
				var callbacksCache = this.getEventCallbackCache(listenerDescriptor.eventName);

				if (callbacksCache) {
					var eventCallback, i;

					for (i = callbacksCache.length - 1; i >= 0; i--) {
						eventCallback = callbacksCache[i];

						if (eventCallback.owner === listenerDescriptor.owner) {
							callbacksCache.splice(i, 1);
							eventCallback.active = false;
						}
					}
				}
			}
		},

		removeEventListeners: function(eventOwner) {
			var callbacksCache, eventName, i;

			for (eventName in this.eventCallbacks) {
				callbacksCache = this.getEventCallbackCache(eventName);

				for (i = callbacksCache.length - 1; i >= 0; i--) {
					var eventCallback = callbacksCache[i];
					if (eventCallback.owner === eventOwner) {
						callbacksCache.splice(i, 1);
						eventCallback.active = false;
					}
				}
			}
		},

		raiseEvent: function(eventName) {
			var eventCallbacks = this.eventCallbacks[eventName];

			if (eventCallbacks) {
				var eventArguments = Array.prototype.slice.call(arguments, 1);
				var callbackInfo, i;

				for (i = 0; i < eventCallbacks.length; i++) {
					callbackInfo = eventCallbacks[i];

					callbackInfo.callback.apply(callbackInfo.context, eventArguments);
				}
			}
		}
	});
});
