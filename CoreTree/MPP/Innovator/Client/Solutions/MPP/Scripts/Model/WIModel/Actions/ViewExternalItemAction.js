define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ActionBase'
],
function(declare, ActionBase) {
	return declare('Aras.Client.Controls.MPP.Action.ViewExternalItemAction', ActionBase, {
		Execute: function(context) {
			var targetElement = context.selectedItem;
			var typeName, itemId;

			if (targetElement.is('ArasItemXmlSchemaElement') || targetElement.is('ArasInternalItemXmlSchemaElement')) {
				typeName = targetElement.ItemType();
				itemId = targetElement.ItemId();
			}

			if (typeName && itemId) {
				var showResult = this.aras.uiShowItem(typeName, itemId);

				if (showResult === false) {
					this.aras.AlertError(this.aras.getResource('../Modules/aras.innovator.TDF', 'action.noitemfound'));
				}
			}
		}
	});
});
