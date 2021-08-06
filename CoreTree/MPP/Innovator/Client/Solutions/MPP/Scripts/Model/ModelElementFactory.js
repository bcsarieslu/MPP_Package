define([
	'dojo/_base/declare',
	'MPP/Model/ModelItem',
	'MPP/Model/ProcessPlan',
	'MPP/Model/OperationItem',
	'MPP/Model/StepItem',
	'MPP/Model/ConsumedPartItem',
	'MPP/Model/ResourceItem',
	'MPP/Model/ModelEnums'
],
function(declare, ModelItem, ProcessPlan, Operation, Step, ConsumedPart, Resource, Enums) {
	return declare('Aras.Innovator.Solutions.MPP.Model.ModelElementFactory', null, {
		datamodel: null,

		constructor: function(args) {
			this.datamodel = args.datamodel;
		},

		createModelElement: function(elementType, itemNode) {
			var elementTypes = Enums.ModelItemTypes;

			switch (elementType) {
				case elementTypes.ProcessPlan:
					return new ProcessPlan({datamodel: this.datamodel, origin: itemNode});
				case elementTypes.Operation:
					return new Operation({datamodel: this.datamodel, origin: itemNode});
				case elementTypes.Step:
					return new Step({datamodel: this.datamodel, origin: itemNode});
				case elementTypes.ConsumedPart:
					return new ConsumedPart({datamodel: this.datamodel, origin: itemNode});
				case elementTypes.OperationResource:
					return new Resource({datamodel: this.datamodel, origin: itemNode});
				default:
					return new ModelItem({datamodel: this.datamodel, origin: itemNode});
			}
		},

		createElementFromItemNode: function(itemNode) {
			if (itemNode && itemNode.nodeType === 1) {
				var itemTypeName = itemNode.getAttribute('type');
				var elementType = Enums.getElementTypeFromItemType(itemTypeName);

				return this.createModelElement(elementType, itemNode);
			}
		}
	});
});
