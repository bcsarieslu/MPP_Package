define([
	'dojo/_base/declare',
	'MPP/Model/ModelItem',
	'MPP/Model/ModelEnums'
],
function(declare, ModelItem, Enums) {
	return declare('Aras.Innovator.Solutions.MPP.Model.ResourceItem', ModelItem, {
		constructor: function(args) {
			this.registerType('Resource');
		},

		Name: function() {
			return this.getRelatedItemProperty('name');
		},

		getType: function() {
			return this.isEmpty() ? Enums.ModelItemTypes.Unknown : Enums.ModelItemTypes.OperationResource;
		},

		itemTypeSorter: function(firstItem, secondItem) {
			firstItem = firstItem && firstItem.getRelatedItem();
			secondItem = secondItem && secondItem.getRelatedItem();

			if (firstItem && secondItem) {
				return firstItem.getType() - secondItem.getType();
			}

			return 0;
		}
	});
});
