define([
	'dojo/_base/declare',
	'dojox/uuid/generateRandomUuid',
	'MPP/Model/ModelItem',
	'MPP/Model/PartConfig'
],
function(declare, generateRandomUuid, ModelItem, partConfig) {
	return declare('Aras.Innovator.Solutions.MPP.Model.ConsumedPartItem', ModelItem, {
		constructor: function(args) {
			this.registerType('ConsumedPart');
		},

		Name: function() {
			return this.getRelatedItemProperty('name');
		},

		isPhantom: function() {
			return this.getRelatedItemProperty('classification') === partConfig.phantom_class_path;
		},

		isMBOMOnly: function() {
			return this.getRelatedItemProperty('classification') === partConfig.mbom_only_class_path;
		},

		isProducedPart: function() {
			var itemId = this.getRelatedItemId();

			return Boolean(this.datamodel.data.producedPartHash[itemId]);
		},

		getRelatedProcessPlanId: function() {
			if (!this.isEmpty()) {
				var itemId = this.getRelatedItemId();
				var processPlans = this.datamodel.getProcessPlanByPartId(itemId);

				if (processPlans && processPlans.length === 1) {
					return processPlans[0].planId;
				}
			}
		},

		getAlternateParts: function() {
			if (!this.isEmpty()) {
				var itemId = this.getRelatedItemId();

				return this.datamodel.getAlternateParts(itemId);
			}
		}
	});
});
