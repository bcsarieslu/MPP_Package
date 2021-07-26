define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ActionBase',
	'MPP/Model/ModelEnums',
	'MPP/Model/PartConfig'
],
function(declare, ActionBase, Enums, partConfig) {
	return declare('Aras.Client.Controls.MPP.ModelAction.AddItemAction', ActionBase, {
		datamodel: null,
		_defaultStepSortOrderDifference: 2000000,
		uiUtils: null,

		constructor: function(inputArguments) {
			this.datamodel = this.actionsHelper.datamodel;
			this.uiUtils = this.actionsHelper.UIUtils;
		},

		Execute: function(/*Object*/context) {
			var selectedItem = context.selectedItem;
			var isAppendAction = context.direction === 'append';
			var targetElement = isAppendAction ? selectedItem.Parent : selectedItem;
			var elementPosition = isAppendAction ? targetElement.ChildItems().index(selectedItem) + 1 : selectedItem.ChildItems().itemCount();
			var itemType = context.itemType;
			var modelItemTypes = Enums.ModelItemTypes;
			var relatedItemNodes = context.relatedItems;

			relatedItemNodes = relatedItemNodes ? (Array.isArray(relatedItemNodes) ? relatedItemNodes : [relatedItemNodes]) : [];

			switch (context.relatedItemType) {
				case modelItemTypes.Part:
					itemType = modelItemTypes.ConsumedPart;
					break;
				case modelItemTypes.Tool:
				case modelItemTypes.Machine:
					itemType = modelItemTypes.OperationResource;
					break;
				case modelItemTypes.Skill:
					itemType = modelItemTypes.OperationSkill;
					break;
				case modelItemTypes.Document:
					itemType = modelItemTypes.OperationDocument;
					break;
				//Add by tengz 2019/6/5
				//Process Plan workbench 里添加对象类
				case modelItemTypes.CAD:
					itemType=modelItemTypes.OperationCAD;
					break;
				case modelItemTypes.Test:
					itemType=modelItemTypes.OperationTest;
					break;
				default:
					break;
			}

			switch (itemType) {
				case modelItemTypes.Operation:
					this.addOperation(targetElement, elementPosition, context.tooltipDialogArguments, selectedItem);
					break;
				case modelItemTypes.Step:
					this.addStep(targetElement, elementPosition, context.tooltipDialogArguments, selectedItem);
					break;
				case modelItemTypes.ConsumedPart:
					var additionalInfo = {
						initialProperties: {quantity: '1'},
						validateItem: function(relationshipItem) {
							var relatedItem = relationshipItem.getRelatedItem();

							if (relatedItem) {
								var producedPartModelItem = this.datamodel.rootProcessPlan.getProducedPart();

								if (relatedItem.getId() === producedPartModelItem.Id()) {
									this.aras.AlertError(this.uiUtils.getResource('error.circularReferenceProducedConsumedPart'));
								} else {
									return true;
								}
							}
						}.bind(this)
					};
					var consumedPartRelatedItemInfo = relatedItemNodes.length ? {itemNodes: relatedItemNodes} : {itemType: modelItemTypes.Part};
					this.addRelationship(targetElement, itemType, consumedPartRelatedItemInfo, additionalInfo);
					break;
				case modelItemTypes.Phantom:
					this.addPhantomPart(targetElement, elementPosition, context.tooltipDialogArguments);
					break;
				case modelItemTypes.OperationResource:
					var resourceRelatedItemInfo = relatedItemNodes.length ? {itemNodes: relatedItemNodes} : {itemType: modelItemTypes.Resource};
					this.addRelationship(targetElement, itemType, resourceRelatedItemInfo);
					break;
				case modelItemTypes.OperationSkill:
					var skillRelatedItemInfo = relatedItemNodes.length ? {itemNodes: relatedItemNodes} : {itemType: modelItemTypes.Skill};
					this.addRelationship(targetElement, itemType, skillRelatedItemInfo);
					break;
				case modelItemTypes.OperationDocument:
					var documentRelatedItemInfo = relatedItemNodes.length ? {itemNodes: relatedItemNodes} : {itemType: modelItemTypes.Document};
					this.addRelationship(targetElement, itemType, documentRelatedItemInfo);
					break;
				//Add by tengz 2019/6/5
				//Process Plan workbench 里添加对象类
				case modelItemTypes.OperationCAD:
					var cadRelatedItemInfo = relatedItemNodes.length ? {itemNodes: relatedItemNodes} : {itemType: modelItemTypes.CAD};
					this.addRelationship(targetElement, itemType, cadRelatedItemInfo);
					break;
				case modelItemTypes.OperationTest:
					var testRelatedItemInfo = relatedItemNodes.length ? {itemNodes: relatedItemNodes} : {itemType: modelItemTypes.Test};
					this.addRelationship(targetElement, itemType, testRelatedItemInfo);
					break;
				default:
					break;
			}
		},

		addItemToModel: function(parentItem, modelItemNode, addPosition) {
			var newItem = this.datamodel.elementFactory.createElementFromItemNode(modelItemNode);
			var relatedItem = newItem.getRelatedItem();
			var isAddAllowed = true;

			// if same item allready exists in parent, then deny 'add' action
			if (relatedItem) {
				var relatedItemId = relatedItem.Id();
				var existingChilds = parentItem.ChildItems().getAllItems();
				var newItemModelType = newItem.getType();
				var currentChild, currentRelatedItem, i;

				for (i = 0; i < existingChilds.length; i++) {
					currentChild = existingChilds[i];

					if (currentChild.getType() === newItemModelType && currentChild.getType() === Enums.ModelItemTypes.OperationResource) {
						currentRelatedItem = currentChild.getRelatedItem();

						if (currentRelatedItem && currentRelatedItem.Id() === relatedItemId) {
							isAddAllowed = false;

							this.aras.AlertError(this.uiUtils.getResource('error.itemExists'));
							break;
						}
					}
				}
			}

			if (isAddAllowed) {
				parentItem.addChildItem(newItem, addPosition);

				// item is added to client cache
				if (!relatedItem || relatedItem.isNew()) {
					this.aras.itemsCache.addItem(relatedItem ? this.aras.getRelatedItem(modelItemNode) : modelItemNode);
				}

				return newItem;
			}
		},

		_getNextOperation: function(parentItem, prevSortOrder, prevOperationId) {
			var childOperations = parentItem.getChildrenByType(Enums.ModelItemTypes.Operation);
			var currentOperation, minSortOrder, sortOrderStr, sortOrder, nextOperation, i;

			for (i = 0; i < childOperations.length; i++) {
				currentOperation = childOperations[i];

				if (!currentOperation.isDeleted()) {
					sortOrderStr = currentOperation.getProperty('sort_order');
					sortOrder = sortOrderStr && parseInt(sortOrderStr);

					if ((!minSortOrder && minSortOrder !== 0) || ((sortOrderStr || sortOrder === 0) && minSortOrder > sortOrder)) {
						if ((!prevSortOrder && prevSortOrder !== 0) || (prevSortOrder <= sortOrder && currentOperation.Id() !== prevOperationId)) {
							minSortOrder = sortOrder;
							nextOperation = currentOperation;
						}
					}
				}
			}

			return nextOperation;
		},

		_setOperationNumber: function(parentItem, selectedItem, currentOperationIomItem) {
			var itemTypeName = Enums.getItemTypeFromModelType(Enums.ModelItemTypes.Operation);
			var prevOperationIomItem, nextOperationIomItem, prevSortOrder, nextOperation;

			if (selectedItem.getType() === Enums.ModelItemTypes.Operation) {
				prevOperationIomItem = this.convertItemIOMItem(this.aras.getItemById(itemTypeName, selectedItem.Id()));
				var prevSortOrderStr = selectedItem.getProperty('sort_order');

				prevSortOrder = prevSortOrderStr && parseInt(prevSortOrderStr);
			}

			nextOperation = this._getNextOperation(parentItem, prevSortOrder, prevOperationIomItem && prevOperationIomItem.getID());
			nextOperationIomItem = nextOperation && this.convertItemIOMItem(this.aras.getItemById(itemTypeName, nextOperation.Id()));

			this.aras.evalMethod('mpp_SetOperationNumberOnAdd', '', {
				prevOperation: prevOperationIomItem,
				nextOperation: nextOperationIomItem,
				currentOperation: currentOperationIomItem
			});
		},

		_recalculateStepSortOrders: function(parentItem) {
			var nextStep = this._getNextStep(parentItem, null, null);
			var allSteps = [];
			var allStepsIds = [];
			var prevSortOrder, sortOrder, shift, i;

			while (nextStep) {
				allSteps.push(nextStep);
				allStepsIds.push(nextStep.Id());

				prevSortOrder = parseInt(nextStep.getProperty('sort_order'), 0);
				nextStep = this._getNextStep(parentItem, prevSortOrder, allStepsIds);
			}

			sortOrder = this._defaultStepSortOrderDifference / 2;
			shift = sortOrder;

			for (i = 0; i < allSteps.length; i++) {
				allSteps[i].setProperty('sort_order', sortOrder);
				allSteps[i].setAttribute('action', 'edit');

				sortOrder += shift;
			}
		},

		_setStepSortOrderToCurrentStep: function(prevStep, nextStep, currentStep) {
			var prevSortOrderStr = prevStep && prevStep.getProperty('sort_order');
			var prevSortOrder = prevSortOrderStr ? parseInt(prevSortOrderStr) : 0;
			var nextSortOrderStr = nextStep && nextStep.getProperty('sort_order');
			var sortOrderToSet;

			if (nextSortOrderStr) {
				var nextSortOrder = parseInt(nextSortOrderStr);
				var difference = nextSortOrder - prevSortOrder;

				if (difference <= 1) {
					return false;
				}

				if (difference > this._defaultStepSortOrderDifference) {
					difference = this._defaultStepSortOrderDifference;
				}

				sortOrderToSet = prevSortOrder + (difference - difference % 2) / 2;
			} else {
				sortOrderToSet = prevSortOrder + this._defaultStepSortOrderDifference / 2;
			}

			currentStep.setProperty('sort_order', sortOrderToSet);

			return true;
		},

		_getNextStep: function(parentItem, prevSortOrder, prevStepIds) {
			var childSteps = parentItem.getChildrenByType(Enums.ModelItemTypes.Step);
			var currentStep, minSortOrder, sortOrder, nextStep, i;

			for (i = 0; i < childSteps.length; i++) {
				currentStep = childSteps[i];

				if (!childSteps[i].isDeleted()) {
					sortOrder = parseInt(currentStep.getProperty('sort_order'));

					if (!isNaN(sortOrder) && ((!minSortOrder && minSortOrder !== 0) || minSortOrder > sortOrder)) {
						if ((!prevSortOrder && prevSortOrder !== 0) || (prevSortOrder <= sortOrder && prevStepIds.indexOf(currentStep.Id()) === -1)) {
							minSortOrder = sortOrder;
							nextStep = currentStep;
						}
					}
				}
			}

			return nextStep;
		},

		_setStepSortOrder: function(parentItem, selectedItem, stepIomItem, isFromItself) {
			var prevStep, prevSortOrder, nextStep;

			if (selectedItem.getType() === Enums.ModelItemTypes.Step) {
				var prevSortOrderStr = selectedItem.getProperty('sort_order');

				prevStep = selectedItem;
				prevSortOrder = prevSortOrderStr && parseInt(prevSortOrderStr);
			}

			nextStep = this._getNextStep(parentItem, prevSortOrder, prevStep && [prevStep.Id()]);

			if (!this._setStepSortOrderToCurrentStep(prevStep, nextStep, stepIomItem) && !isFromItself) {
				this._recalculateStepSortOrders(parentItem);
				this._setStepSortOrder(parentItem, selectedItem, stepIomItem, true);
			}
		},

		addOperation: function(parentItem, elementPosition, tooltipDialogArguments, selectedItem) {
			var itemTypeName = Enums.getItemTypeFromModelType(Enums.ModelItemTypes.Operation);
			var operationIomItem = this.aras.newIOMItem(itemTypeName, 'add');

	
			//Modify by tengz 2019/6/12
			//Location处理
			//添加Operation时给Location属性赋值
			operationIomItem.setProperty("bcs_location",viewController.shareData.locationId);
			
			this._setOperationNumber(parentItem, selectedItem, operationIomItem);
			var newModelItem = this.addItemToModel(parentItem, operationIomItem.node);

			if (newModelItem) {
				var editItemNode = operationIomItem.node;
				// setTimeout here is required to wait workInstructionModel invalidation after addItemToModel call
				// itemNode will appear in associated control and can be passed as parameter for TooltipDialog
				setTimeout(function() {
					this.fillWithTooltipDialog(editItemNode, tooltipDialogArguments, {
						callbacks: {
							onClose: function() {
								var isItemValid = this.aras.checkItem(editItemNode, this.aras.getMostTopWindowWithAras(window));

								if (isItemValid) {
									var updatedModelItem = this.datamodel.elementFactory.createElementFromItemNode(editItemNode);

									newModelItem.updateFromItem(updatedModelItem);
								} else {
									return true;
								}
							}.bind(this),
							onCancel: function() {
								this.datamodel.deleteItem(newModelItem);
							}.bind(this)
						},
						formId: '85746D0F816F45528A085EC303705696'
					});
				}.bind(this), 0);
			}
		},

		fillWithTooltipDialog: function(itemNode, tooltipArguments, optionalParameters) {
			if (itemNode && tooltipArguments) {
				var isPositionCalculated = tooltipArguments.around || (tooltipArguments.x && tooltipArguments.y);

				if (isPositionCalculated) {
					this.actionsHelper.UIUtils.showTooltipDialog(itemNode, tooltipArguments, optionalParameters);
				} else {
					var waitPromise = tooltipArguments.getWaitPromise && tooltipArguments.getWaitPromise();
					if (waitPromise) {
						waitPromise.then(function() {
							this.uiUtils.normalizeTooltipPositionArguments(tooltipArguments);
							this.actionsHelper.UIUtils.showTooltipDialog(itemNode, tooltipArguments, optionalParameters);
						}.bind(this));
					} else {
						this.uiUtils.normalizeTooltipPositionArguments(tooltipArguments);
						this.actionsHelper.UIUtils.showTooltipDialog(itemNode, tooltipArguments, optionalParameters);
					}
				}
			}
		},

		addStep: function(parentItem, newModelItem, tooltipDialogArguments, selectedItem) {
			var itemTypeName = Enums.getItemTypeFromModelType(Enums.ModelItemTypes.Step);
			var stepIomItem = this.aras.newIOMItem(itemTypeName, 'add');

			this._setStepSortOrder(parentItem, selectedItem, stepIomItem, false);
			newModelItem = this.addItemToModel(parentItem, stepIomItem.node);

			if (newModelItem) {
				var editItemNode = stepIomItem.node;
				// setTimeout here is required to wait workInstructionModel invalidation after addItemToModel call
				// itemNode will appear in associated control and can be passed as parameter for TooltipDialog
				setTimeout(function() {
					this.fillWithTooltipDialog(editItemNode, tooltipDialogArguments, {
						callbacks: {
							onClose: function() {
								var isItemValid = this.aras.checkItem(editItemNode, this.aras.getMostTopWindowWithAras(window));

								if (isItemValid) {
									var updatedModelItem = this.datamodel.elementFactory.createElementFromItemNode(editItemNode);

									newModelItem.updateFromItem(updatedModelItem);
								} else {
									return true;
								}
							}.bind(this),
							onCancel: function() {
								this.datamodel.deleteItem(newModelItem);
							}.bind(this)
						},
						formId: '8D32CCE919734D5B9E637D545B9F996D'
					});
				}.bind(this), 0);
			}
		},

		addPhantomPart: function(parentItem, elementPosition, tooltipDialogArguments) {
			var partItem = this.aras.newIOMItem(partConfig.part_it_name, 'add');
			var itemTypeName = Enums.getItemTypeFromModelType(Enums.ModelItemTypes.ConsumedPart);
			var consumedPartIomItem = this.aras.newIOMItem(itemTypeName, 'add');
			var newModelItem;

			partItem.setNewID();
			partItem.setProperty('classification', partConfig.phantom_class_path);

			consumedPartIomItem.setRelatedItem(partItem);
			consumedPartIomItem.setProperty('quantity', 1);

			newModelItem = this.addItemToModel(parentItem, consumedPartIomItem.node);

			if (newModelItem) {
				var editItemNode = partItem.node;
				// setTimeout here is required to wait workInstructionModel invalidation after addItemToModel call
				// itemNode will appear in associated control and can be passed as parameter for TooltipDialog
				setTimeout(function() {
					this.fillWithTooltipDialog(editItemNode, tooltipDialogArguments, {
						callbacks: {
							onClose: function() {
								var isItemValid = this.aras.checkItem(editItemNode, this.aras.getMostTopWindowWithAras(window));

								if (isItemValid) {
									var updatedModelItem = this.datamodel.elementFactory.createElementFromItemNode(editItemNode);

									newModelItem.setRelatedItem(updatedModelItem);
								} else {
									return true;
								}
							}.bind(this),
							onCancel: function() {
								this.datamodel.deleteItem(newModelItem);
								this.aras.itemsCache.deleteItem(partItem.getId());
							}.bind(this)
						}
					});
				}.bind(this), 0);
			}
		},

		addRelationship: function(parentItem, relationshipModelType, relatedItemInfo, additionalInfo) {
			var relationshipItemType = Enums.getItemTypeFromModelType(relationshipModelType);
			var itemNode, i;

			additionalInfo = additionalInfo || {};

			if (relatedItemInfo.itemNodes) {
				var notPermittedItemIds = [];

				for (i = 0; i < relatedItemInfo.itemNodes.length; i++) {
					itemNode = relatedItemInfo.itemNodes[i];
					if (itemNode.getAttribute('discover_only') === '1') {
						notPermittedItemIds.push(itemNode.getAttribute('id'));
					} else {
						this.addRelationshipToModel(parentItem, relationshipItemType, itemNode, additionalInfo);
					}
				}

				if (notPermittedItemIds.length) {
					this.aras.AlertError(this.actionsHelper.UIUtils.getResource('warning.itemInsufficientPermissions') + '\n' + notPermittedItemIds.join(', '));
				}
			} else if (relatedItemInfo.itemType) {
				var relatedItemTypeName = Enums.getItemTypeFromModelType(relatedItemInfo.itemType);

				this.actionsHelper.UIUtils.showSearchDialog(relatedItemTypeName, function(selectedItemIds) {
					if (selectedItemIds.length) {
						var relatedItemType = this.aras.getItemTypeForClient(relatedItemTypeName).node;
						var selectedItemNodes = [];
						for (i = 0; i < selectedItemIds.length; i++) {
							var itemId = selectedItemIds[i];
							itemNode = this.aras.getItemById(relatedItemTypeName, itemId);

							if (itemNode) {
								selectedItemNodes.push(itemNode);
							}
						}

						if (this.aras.isPolymorphic(relatedItemType)) {
							for (i = 0; i < selectedItemNodes.length; i++) {
								itemNode = selectedItemNodes[i];

								var polyTypeId = this.aras.getItemProperty(itemNode, 'itemtype');
								var typeName = this.aras.getItemTypeName(polyTypeId);
								itemNode.setAttribute('type', typeName);
							}
						}

						relatedItemInfo.itemNodes = selectedItemNodes;
						this.addRelationship(parentItem, relationshipModelType, relatedItemInfo, additionalInfo);
					}
				}.bind(this), {dblclickclose: false, multiselect: true});
			}
		},

		addRelationshipToModel: function(parentItem, relationshipItemType, relatedItemNode, additionalInfo) {
			var relationshipItem = this.aras.newIOMItem(relationshipItemType, 'add');
			
			//Add by tengz 2019/6/14
			//Location处理
			//Operation添加关系数据时填入location值
			relationshipItem.setProperty("bcs_location",viewController.shareData.locationId);
			
			if (relatedItemNode) {
				var relatedItem, relationshipsNode, initialProperties, propertyName;

				// prepare item node (removing relationships, converting to IOMItem)
				relatedItemNode = relatedItemNode.cloneNode(true);
				relationshipsNode = relatedItemNode.selectSingleNode('Relationships');

				if (relationshipsNode) {
					relationshipsNode.parentNode.removeChild(relationshipsNode);
				}

				relatedItem = this.convertItemIOMItem(relatedItemNode);

				initialProperties = additionalInfo.initialProperties || {};

				for (propertyName in initialProperties) {
					relationshipItem.setProperty(propertyName, initialProperties[propertyName]);
				}

				relationshipItem.setRelatedItem(relatedItem);
			}

			if (!additionalInfo.validateItem || additionalInfo.validateItem(relationshipItem)) {
				this.addItemToModel(parentItem, relationshipItem.node);
			}
		},

		convertItemIOMItem: function(itemNode) {
			if (itemNode) {
				var iomItem = this.aras.newIOMItem();

				iomItem.dom = itemNode.ownerDocument;
				iomItem.node = itemNode;
				return iomItem;
			}
		}
	});
});
