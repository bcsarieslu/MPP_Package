define([
	'dojo/_base/declare',
	'MPP/Model/Eventable',
	'./DndBase'
],
function(declare, Eventable, DndBase) {
	return declare('Aras.Client.Controls.MPP.DnD.DndSourceTarget.DndSource', [Eventable, DndBase], {
		_sourceCounter: 0,

		constructor: function(inputArguments) {
			this.id = ++this._sourceCounter;

			this.dndData.eventListeners.dragStart = this.dragStart.bind(this);
			this.dndData.eventListeners.drag = this.drag.bind(this);
			this.dndData.eventListeners.dragEndSource = this.dragEndSource.bind(this);

			this.activateDnD(inputArguments.activeDnD);
		},

		setControllerForSource: function(controller) {
			var currentController = this.dndData.controller;

			// unregister from old controller
			if (currentController) {
				currentController.unregisterSource();
			}

			this.dndData.controller = controller;
		},

		attachDnDEventsSource: function(targetNode, addListeners) {
			if (targetNode) {
				var eventListeners = this.dndData.eventListeners;
				var actionMethod = addListeners ? 'addEventListener' : 'removeEventListener';

				targetNode[actionMethod]('dragstart', eventListeners.dragStart);
				targetNode[actionMethod]('drag', eventListeners.drag);
				targetNode[actionMethod]('dragend', eventListeners.dragEndSource);
			}
		},

		getDragData: function() {
			return this.dndData.dragData;
		},

		dragStart: function(dndEvent) {
			this.raiseEvent('onDragStart', this, dndEvent);
		},

		drag: function(dndEvent) {
		},

		dragEndSource: function(dndEvent) {
			this.dndData.dragData = null;
			this.raiseEvent('onDragEnd', this, dndEvent);
		}
	});
});
