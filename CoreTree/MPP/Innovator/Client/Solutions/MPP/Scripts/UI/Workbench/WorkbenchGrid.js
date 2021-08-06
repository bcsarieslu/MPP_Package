define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'MPP/UI/MPPTreeGridContainer',
	'MPP/UI/Find/WorkbenchGridExt',
	'MPP/UI/ProcessPlan/DnD/DndSourceTarget/DndSource',
	'MPP/Model/ModelEnums'
],
function(declare, connect, MPPTreeGridContainer, WorkbenchGridExt, DndSource, Enums) {
	return declare('Aras.Client.Controls.MPP.WorkbenchGrid', [MPPTreeGridContainer, WorkbenchGridExt, DndSource], {
		workbench: null,

		constructor: function(initialArguments) {
			this.workbench = initialArguments.workbench;
		},

		activateDnD: function(doActive) {
			if (this.isActive !== doActive) {
				var gridControl = this.grid_Experimental;

				this.dndData.domNode = gridControl.domNode;
				this.attachDnDEventsSource(this.dndData.domNode, doActive);

				if (doActive) {
					this._rowStyleHandler = connect.connect(gridControl, 'onStyleRow', this, function(row) {
						row.node.firstChild.setAttribute('draggable', true);
					});
				} else if (this._rowStyleHandler) {
					this._rowStyleHandler.remove();
					gridControl.update();
				}
			}
		},

		dragStart: function(dndEvent) {
			this.inherited(arguments);

			if (this.isRegistered()) {
				var gridView = this.grid_Experimental.views.views[0];

				gridView.content.decorateEvent(dndEvent);

				if (dndEvent.rowIndex !== undefined) {
					var selectedRowIds = this.getSelectedItemIds('|').split('|');
					var dragNodes = {};
					var selectedItemIds = [];
					var dragRowId = this.getRowId(dndEvent.rowIndex).toString();
					var rowId, rowIndex, rowNode, i;

					// if there are selected items in grid, then drag them, in other case drag row under cursor
					if (selectedRowIds.indexOf(dragRowId) === -1) {
						this.setSelectedRow(dragRowId, false);
						if (dndEvent.ctrlKey) {
							selectedRowIds.push(dragRowId);
						} else {
							selectedRowIds = [dragRowId];
						}
					}

					for (i = 0; i < selectedRowIds.length; i++) {
						rowId = selectedRowIds[i];

						if (!dragNodes[rowId]) {
							rowIndex = this.getRowIndex(rowId);

							rowNode = gridView.getRowNode(rowIndex);
							rowNode = rowNode && rowNode.firstChild;

							dragNodes[rowId] = rowNode;
							this.toggleCssClass(rowNode, 'dragSourceNode', true);
						}

						selectedItemIds.push(this.getUserData(rowId, 'itemId'));
					}

					this.dndData.dragData = {
						controller: this.dndData.controller.id,
						dataType: 'WorkbenchItem',
						itemType: Enums.getModelTypeFromWorkbenchType(this.workbench.itemsType),
						itemIds: selectedItemIds
					};

					this.dndData.dragNodes = dragNodes;

					// required in FF to start dragging
					dndEvent.dataTransfer.setData('text', '');
				}
			}
		},

		dragEndSource: function(dndEvent) {
			var dragNodes = this.dndData.dragNodes;

			if (dragNodes) {
				var domNode, itemId;

				for (itemId in dragNodes) {
					domNode = dragNodes[itemId];

					this.toggleCssClass(domNode, 'dragSourceNode');
					this.setSelectedRow(itemId, true);
				}
			}

			this.inherited(arguments);
		},

		toggleCssClass: function(targetNode, toggleClassName, addClass) {
			if (targetNode && toggleClassName) {
				var toggleClasses = toggleClassName.split(' ');
				var i;

				for (i = 0; i < toggleClasses.length; i++) {
					if (addClass) {
						targetNode.classList.add(toggleClasses[i]);
					} else {
						targetNode.classList.remove(toggleClasses[i]);
					}
				}
			}
		}
	});
});
