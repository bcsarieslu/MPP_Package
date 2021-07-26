define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ActionBase'
],
function(declare, ActionBase) {
	return declare(ActionBase, {
		_isUp: null,

		constructor: function(args) {
			this._isUp = args.isUp;
		},

		Execute: function(/*Object*/ args) {
			var selectedItems = args.selectedItems;
			var selectedItemsIds = [];
			var closestItemToReplaceOrder;

			selectedItemsIds = selectedItems.map(function(selectedItem) {
				return selectedItem.Id();
			});

			if (!this._isUp) {
				selectedItems.reverse();
			}
			selectedItems.map(function(selectedItem) {
				closestItemToReplaceOrder = this._getClosestItem(selectedItemsIds, selectedItem);
				if (closestItemToReplaceOrder) {
					this._replaceSortOrders(selectedItem, closestItemToReplaceOrder);
				}
				return;
			}.bind(this));
		},

		_getClosestItem: function(selectedItemsIds, selectedItem) {
			var children = selectedItem.Parent.getChildrenByType(selectedItem.getType());
			var selectedItemSortOrderStr = selectedItem.getProperty('sort_order');
			var selectedItemSortOrderInt = parseInt(selectedItemSortOrderStr, 10);
			var childItem,
				closestItemToReplaceOrders,
				closestItemToReplaceOrderInt,
				i,
				childItemSortOrderInt;

			for (i = 0; i < children.length; i++) {
				childItem = children[i];
				//we need to find childItem with closest sort_order, less and more than childItemSortOrderInt. It should be not from selected items.
				if (selectedItemsIds.indexOf(childItem.Id()) !== -1) {
					continue;
				}

				childItemSortOrderInt = parseInt(childItem.getProperty('sort_order'), 0);
				if (this._isUp) {
					if (childItemSortOrderInt < selectedItemSortOrderInt &&
					((!closestItemToReplaceOrderInt && closestItemToReplaceOrderInt !== 0) || childItemSortOrderInt > closestItemToReplaceOrderInt)) {
						closestItemToReplaceOrders = childItem;
						closestItemToReplaceOrderInt = parseInt(closestItemToReplaceOrders.getProperty('sort_order'));
					}
				} else if (childItemSortOrderInt > selectedItemSortOrderInt &&
					((!closestItemToReplaceOrderInt && closestItemToReplaceOrderInt !== 0) || childItemSortOrderInt < closestItemToReplaceOrderInt)) {
					closestItemToReplaceOrders = childItem;
					closestItemToReplaceOrderInt = parseInt(closestItemToReplaceOrders.getProperty('sort_order'));
				}
			}

			return closestItemToReplaceOrders;
		},

		_replaceSortOrders: function(selectedItem, itemToReplace) {
			var selectedItemSortOrderStr = selectedItem.getProperty('sort_order');
			var itemToReplaceSortOrderStr = itemToReplace.getProperty('sort_order');

			selectedItem.setProperty('sort_order', itemToReplaceSortOrderStr);
			itemToReplace.setProperty('sort_order', selectedItemSortOrderStr);
		}
	});
});
