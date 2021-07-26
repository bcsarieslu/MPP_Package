define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ActionBase',
	'MPP/Model/PartConfig'
],
function(declare, ActionBase, partConfig) {
	return declare('Aras.Client.Controls.MPP.ModelAction.CreateProcessPlanAction', ActionBase, {
		datamodel: null,

		constructor: function(args) {
			this.datamodel = this.actionsHelper.datamodel;
		},

		Execute: function(/*Object*/context) {
			var targetItem = context.selectedItem;
			var newProcessPlanItem = this.aras.newIOMItem('mpp_ProcessPlan', 'add');
			var producedPart = this.aras.newIOMItem('mpp_ProcessPlanProducedPart', 'add');
			var itemId = targetItem.Id();
			var relatedIomItem = this.actionsHelper.UIUtils.convertNodeToIomItem(this.aras.getItemById(partConfig.part_it_name, itemId));
			var filterParameters = this.datamodel.filterParameters || {};
			var currentLocationId = filterParameters.locationId;
			var onCloseHandler = function(shownProcessPlanItem) {
				var processPlanId = shownProcessPlanItem.getID();
				var processPlanNode = this.aras.getItemById('mpp_ProcessPlan', processPlanId);

				// refresh targetItem in dataModel
				this.datamodel.replaceRegisteredItemsFromNode(itemId, this.aras.getItemById(partConfig.part_it_name, itemId));

				if (processPlanNode) {
					var loadedProcessPlans = this.datamodel.loadProcessPlans(processPlanId);

					this.datamodel.registerProcessPlan(loadedProcessPlans[processPlanId]);
				}
			}.bind(this);

			producedPart.setRelatedItem(relatedIomItem);
			newProcessPlanItem.setProperty('item_number', targetItem.getProperty('item_number'));
			newProcessPlanItem.addRelationship(producedPart);

			if (currentLocationId) {
				var locationRelationship = this.aras.newIOMItem('mpp_ProcessPlanLocation', 'add');

				locationRelationship.setProperty('related_id', currentLocationId);
				newProcessPlanItem.addRelationship(locationRelationship);
			}

			this.aras.uiShowItemEx(newProcessPlanItem.node).then(function() {
				var processPlanWindow = this.aras.uiFindWindowEx(newProcessPlanItem.getID());

				if (processPlanWindow) {
					processPlanWindow.addEventListener('unload', function() {
						onCloseHandler(newProcessPlanItem);
					});
				} else {
					onCloseHandler(newProcessPlanItem);
				}
			}.bind(this));
		}
	});
});
