define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ActionBase'
],
function(declare, ActionBase) {
	return declare('Aras.Client.Controls.MPP.ModelAction.ViewEditItemAction', ActionBase, {
		constructor: function(args) {
		},

		Execute: function(context) {
			var targetItem, formId, formTitle;

			if (context.isChangeQuantity) {
				context.isEditAction = true;
				targetItem = context.selectedItem;

				if (!targetItem || !targetItem.is('ConsumedPart') || targetItem.isEmpty()) {
					return;
				}
			} else {
				var modelItems = context.selectedItems;

				targetItem = modelItems && modelItems.length && modelItems[0];
				targetItem = targetItem.getRelatedItem() || targetItem;
			}

			if (targetItem) {
				var typeName = targetItem.getAttribute('type');
				var itemId = targetItem.Id();

				if (typeName && itemId) {
					if (this.actionsHelper.isToShowAsTooltipDialog(targetItem)) {
						switch (typeName) {
							case 'mpp_Operation':
								formId = '85746D0F816F45528A085EC303705696';
								break;
							case 'mpp_Step':
								formId = '8D32CCE919734D5B9E637D545B9F996D';
								break;
							case 'mpp_OperationConsumedPart':
								formTitle = 'Change Quantity';
								formId = 'F4312587B3DE43D093D6682E6AD96E1E';
								break;
							default:
								break;
						}

						this._showAsTooltipDialog(targetItem, context.tooltipDialogArguments, context.isEditAction, formId, formTitle);
					} else {
						this._showInTearOff(typeName, itemId);
					}
				}
			}
		},

		_showInTearOff: function(typeName, itemId) {
			var showResult = this.aras.uiShowItem(typeName, itemId);

			if (showResult === false) {
				this.aras.AlertError(this.aras.getResource('../Modules/aras.innovator.TDF', 'action.noitemfound'));
			}
		},

		_showAsTooltipDialog: function(targetModelItem, tooltipDialogArguments, isEditAction, formId, formTitle) {
			var targetIOMItem = this.aras.newIOMItem();
			var itemNode;

			targetIOMItem.loadAML(targetModelItem.serializeToAml());
			itemNode = targetIOMItem.node;

			this.actionsHelper.UIUtils.normalizeTooltipPositionArguments(tooltipDialogArguments);
			this.actionsHelper.UIUtils.showTooltipDialog(itemNode, tooltipDialogArguments, {
				formId: formId,
				formType: isEditAction ? 'edit' : 'view',
				title: formTitle,
				callbacks: {
					onClose: isEditAction && function() {
						if (this.aras.isDirtyEx(itemNode)) {
							if (!this.aras.checkItem(itemNode, this.aras.getMostTopWindowWithAras(window))) {
								return true;
							}

							var datamodel = this.actionsHelper.datamodel;
							var modifiedModelItem = datamodel.elementFactory.createElementFromItemNode(itemNode);

							targetModelItem.updateFromItem(modifiedModelItem);
						}
					}.bind(this)
				}
			});
		}
	});
});
