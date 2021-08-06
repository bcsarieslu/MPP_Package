define([
	'dojo/_base/declare',
	'MPP/Model/ModelItem',
	'MPP/Model/ModelEnums'
],
function(declare, ModelItem, Enums) {
	return declare('Aras.Innovator.Solutions.MPP.Model.ProcessPlan', ModelItem, {
		constructor: function(args) {
			this.registerType('ProcessPlan');
		},

		Name: function() {
			return this.getProperty('name');
		},

		getType: function() {
			return this.isEmpty() ? Enums.ModelItemTypes.Unknown : Enums.ModelItemTypes.ProcessPlan;
		},

		getProducedPart: function() {
			var allChildren = this.ChildItems().getAllItems();
			var childItem, i;

			for (i = 0; i < allChildren.length; i++) {
				childItem = allChildren[i];

				if (childItem.getType() === Enums.ModelItemTypes.ProducedPart) {
					return childItem.getRelatedItem();
				}
			}
		},

		getLocations: function() {
			return this.getChildrenByType(Enums.ModelItemTypes.Location);
		}
	});
});
