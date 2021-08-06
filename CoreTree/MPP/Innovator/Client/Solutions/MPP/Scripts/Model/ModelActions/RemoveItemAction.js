define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ActionBase'
],
function(declare, ActionBase) {
	return declare('Aras.Client.Controls.MPP.Action.RemoveItemAction', ActionBase, {
		constructor: function(args) {
		},

		Execute: function(/*Object*/ args) {
			var selectedItems = args.selectedItems;
			var selectedIds = {};
			var isParentDeleted, currentItem, currentParent, i;

			for (i = 0; i < selectedItems.length; i++) {
				selectedIds[selectedItems[i].Id()] = true;
			}

			for (i = 0; i < selectedItems.length; i++) {
				currentItem = selectedItems[i];
				currentParent = currentItem.Parent;
				isParentDeleted = false;

				while (currentParent) {
					if (selectedIds[currentParent.Id()]) {
						isParentDeleted = true;
						break;
					}

					currentParent = currentParent.Parent;
				}

				if (!isParentDeleted) {
					this.actionsHelper.datamodel.deleteItem(currentItem);
				}
			}
		}
	});
});
