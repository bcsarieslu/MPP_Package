define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'MPP/Model/Eventable',
	'MPP/Model/ModelEnums'
],
function(declare, connect, Eventable, Enums) {
	return declare('Aras.Client.Controls.MPP.DnD.Controller', [Eventable], {
		dragSources: null,
		dragTargets: null,
		avatarNode: null,
		_controllerCounter: 0,
		isDragStarted: null,
		activeSource: null,
		id: null,

		// TODO ADD CACHE
		constructor: function(inputArguments) {
			this.isDragStarted = false;
			this.dragSources = [];
			this.dragTargets = [];
			this.id = ++this._controllerCounter;
		},

		registerSource: function(dragSource) {
			if (this.dragSources.indexOf(dragSource) === -1) {
				this.dragSources.push(dragSource);

				dragSource.setControllerForSource(this);
				dragSource.addEventListener(this, null, 'onDragStart', this.dragStartHandler);
				dragSource.addEventListener(this, null, 'onDragEnd', this.dragEndNotification);
			}
		},

		unregisterSource: function(dragSource) {
			var sourceIndex = this.dragSources.indexOf(dragSource);

			if (sourceIndex !== -1) {
				dragSource = this.dragSources.splice(sourceIndex, 1);
				dragSource.removeEventListeners(this);
			}
		},

		registerTarget: function(dragTarget) {
			if (this.dragTargets.indexOf(dragTarget) === -1) {
				this.dragTargets.push(dragTarget);

				dragTarget.setControllerForTarget(this);
			}
		},

		unregisterTarget: function(dragTarget) {
			var targetIndex = this.dragTargets.indexOf(dragTarget);

			if (targetIndex !== -1) {
				this.dragTargets.splice(targetIndex, 1);
			}
		},

		dragStartHandler: function(dragSource, dndEvent) {
			this.isDragStarted = true;
			this.activeSource = dragSource;
		},

		dragEndNotification: function(dragSource, dndEvent) {
			this.raiseEvent('onDragEnd', dndEvent);

			this.isDragStarted = false;
			this.activeSource = null;
		},

		getDragData: function() {
			if (this.isDragStarted) {
				return this.activeSource.getDragData();
			}
		},

		createAvatar: function(xCoor, yCoor) {
			if (!this.avatarNode) {
				this.avatarNode = document.createElement('div');
				this.avatarNode.setAttribute('id', 'dndAvatar');
				this.avatarNode.setAttribute('style', 'position: absolute; height: 30px; width: 100px; background-color: gray; z-index: 100;');

				//debugger;
				document.body.appendChild(this.avatarNode);
			}

			this.moveAvatar(xCoor, yCoor);
			this.avatarNode.style.display = '';
		},

		moveAvatar: function(xCoor, yCoor) {
			this.avatarNode.style.left = xCoor + 'px';
			this.avatarNode.style.top = yCoor + 'px';
		}
	});
});
