define([
	'dojo/_base/declare',
	'MPP/Model/ModelItem',
	'MPP/Model/ModelEnums'
],
function(declare, ModelItem, Enums) {
	return declare('Aras.Innovator.Solutions.MPP.Model.OperationItem', ModelItem, {
		constructor: function(args) {
			this.registerType('Operation');
		},

		Name: function() {
			return this.getProperty('name');
		},

		getType: function() {
			return this.isEmpty() ? Enums.ModelItemTypes.Unknown : Enums.ModelItemTypes.Operation;
		},

		itemTypeSorter: function(firstItem, secondItem) {
			if (firstItem && secondItem) {
				var firstSortOrder = parseInt(firstItem.getProperty('sort_order'));
				var secondSortOrder = parseInt(secondItem.getProperty('sort_order'));

				firstSortOrder = isNaN(firstSortOrder) ? Number.MAX_VALUE : firstSortOrder;
				secondSortOrder = isNaN(secondSortOrder) ? Number.MAX_VALUE : secondSortOrder;

				return firstSortOrder - secondSortOrder;
			}

			return 0;
		},

		addImageReference: function(referenceId, imageItem) {
			/// <summary>
			/// Creates and adds image reference child item.
			/// </summary>
			/// <param name="referenceId" type="Id of reference relationship.</param>
			/// <param name="imageItem" type="IomItem|String">Referenced tp_Image item or item Id.</param>
			if (referenceId && imageItem) {
				var existingReferences = this.getChildrenByItemType('mpp_OperationImageReference');
				var isAllreadyExists = false;
				var i;

				for (i = 0; i < existingReferences.length; i++) {
					if (existingReferences[i].Id() === referenceId) {
						isAllreadyExists = true;
						break;
					}
				}

				if (!isAllreadyExists) {
					var newReferenceItem = this.datamodel.aras.newIOMItem('mpp_OperationImageReference', 'skip');

					if (typeof imageItem === 'string') {
						var requestImage = this.datamodel.aras.newIOMItem('tp_Image', 'get');

						requestImage.setID(imageItem);
						imageItem = requestImage.apply();
					}

					newReferenceItem.setID(referenceId);
					newReferenceItem.setProperty('reference_id', referenceId);
					newReferenceItem.setRelatedItem(imageItem);

					this.addChildItem(this.datamodel.elementFactory.createElementFromItemNode(newReferenceItem.node));
				}
			}
		}
	});
});
