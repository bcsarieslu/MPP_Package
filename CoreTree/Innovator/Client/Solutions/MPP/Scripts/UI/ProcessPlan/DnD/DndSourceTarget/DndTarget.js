define([
	'dojo/_base/declare',
	'./DndBase'
],
function(declare, DndBase) {
	return declare('Aras.Client.Controls.MPP.DnD.DndSourceTarget.DndTarget', [DndBase], {
		constructor: function(inputArguments) {
			this.dndData.eventListeners.dragOver = this.dragOver.bind(this);
			this.dndData.eventListeners.dragEnter = this.dragEnter.bind(this);
			this.dndData.eventListeners.drop = this.drop.bind(this);

			this.activateDnD(inputArguments.activeDnD);
		},

		setControllerForTarget: function(controller) {
			var currentController = this.dndData.controller;

			if (currentController) {
				currentController.unregisterTarget();
				currentController.removeEventListeners(this);
			}

			this.dndData.controller = controller;
			controller.addEventListener(this, null, 'onDragEnd', this.dragEndTarget);
		},

		attachDnDEventsTarget: function(targetNode, addListeners) {
			if (targetNode) {
				var eventListeners = this.dndData.eventListeners;
				var actionMethod = addListeners ? 'addEventListener' : 'removeEventListener';

				targetNode[actionMethod]('dragenter', eventListeners.dragEnter);
				targetNode[actionMethod]('dragover', eventListeners.dragOver);
				targetNode[actionMethod]('drop', eventListeners.drop);
			}
		},

		dragOver: function(dndEvent) {
		},

		dragEnter: function(dndEvent) {
		},

		drop: function(dndEvent) {
		},

		isDropAllowed: function(dndEvent) {
			return true;
		},

		dragEndTarget: function(dragSource, dndEvent) {
			this.dndData.dragData = null;
		}
	});
});
