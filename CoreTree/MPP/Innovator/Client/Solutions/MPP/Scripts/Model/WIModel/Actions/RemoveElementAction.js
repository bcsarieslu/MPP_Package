define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ActionBase'
],
function(declare, ActionBase) {
	return declare('Aras.Client.Controls.MPP.Action.RemoveElementAction', ActionBase, {
		Execute: function(args) {
			var selectedItems = args.selectedItems;
			var selectedIds = {};
			var isParentDeleted, currentItem, currentParent, childIndex, childItems, schemaCheckResult, elementCheckResult, i;

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
					schemaCheckResult = this.checkSchemaRestrictions(currentItem);
					elementCheckResult = this.checkElementRestrictions(currentItem);

					if (schemaCheckResult.isValid && elementCheckResult.isValid) {
						childItems = currentItem.Parent.ChildItems();
						childIndex = childItems.index(currentItem);
						childItems.splice(childIndex, 1);
					} else {
						var alertMessage = schemaCheckResult.isValid ?
							elementCheckResult.errorList.join(', ') :
							this.aras.getResource('../Modules/aras.innovator.TDF', 'action.schemarestriction', schemaCheckResult.errorList.join(', '));

						this.aras.AlertWarning(alertMessage);
						return;
					}
				}
			}
		},

		checkElementRestrictions: function(targetElement) {
			if (targetElement && targetElement.isRegistered()) {
				if (targetElement.is('ArasRowXmlSchemaElement')) {
					var parentTable = targetElement.GetTable();

					if (parentTable && parentTable.RowCount() === 1) {
						return {isValid: false, errorList: [this.aras.getResource('../Modules/aras.innovator.TDF', 'viewmodel.tablecannotbeempty')]};
					}
				}
			}

			return {isValid: true, errorList: []};
		},

		checkSchemaRestrictions: function(targetElement) {
			// 2nd condition:
			// if target of removing is block, it means that it had access to creation
			if (!targetElement.Parent) {
				return {isValid: true, errorList: []};
			}

			var that = this;
			var checkResult = [];
			var i;

			function isDeleteAllowedImpl(currentItem, deletedCount) {
				var res = {isValid: true, errorList: []};
				if (currentItem.is('ArasBlockXmlSchemaElement')) {
					var childItems = currentItem.ChildItems();
					for (i = 0; i < childItems._array.length; i++) {
						isDeleteAllowedImpl(childItems._array[i], deletedCount);
						deletedCount++;
					}
					deletedCount = 0;
				}

				var ownerElement = currentItem.Parent;

				while (ownerElement.is('ArasBlockXmlSchemaElement') && ownerElement.Parent) {
					ownerElement = ownerElement.Parent;
				}

				var expectedChildsTypes = that._viewmodel.Schema().GetSchemaExpectedElementChilds(ownerElement);
				var existingChildsTypes = that._viewmodel.getAllChildElementsByType(ownerElement, {});

				var deletedElements = {};
				deletedElements[currentItem.nodeName] = {elements: [currentItem], count: 1};

				for (i = 0; i < expectedChildsTypes.length; i++) {
					var childDescriptor = expectedChildsTypes[i];
					var typeName = childDescriptor.name;

					if (deletedElements[typeName] && childDescriptor.minOccurs) {
						// if "minOccurs" is set for this child type, then we need to check that after deletion childs count wouldn't be lower of that value
						if ((existingChildsTypes[typeName].count - deletedCount - deletedElements[typeName].count) < childDescriptor.minOccurs) {
							res.isValid = false;
							res.errorList.push(typeName);
						}
					}
				}

				checkResult.push(res);
			}

			isDeleteAllowedImpl(targetElement, 0);

			for (i = 0; i < checkResult.length; i++) {
				if (!checkResult[i].isValid) {
					return {isValid: false, errorList: checkResult[i].errorList};
				}
			}

			return {isValid: true, errorList: []};
		}
	});
});
