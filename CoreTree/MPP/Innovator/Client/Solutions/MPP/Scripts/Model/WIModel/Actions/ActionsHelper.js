define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dijit/popup',
	'MPP/Model/WIModel/Actions/AddElementAction',
	'MPP/Model/WIModel/Actions/RemoveElementAction',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ArasTextActions',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/ListAction',
	'MPP/Model/WIModel/Actions/TableAction',
	'MPP/Model/WIModel/Actions/ViewExternalItemAction',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/RefreshContentAction',
	'MPP/Model/WIModel/WIModelEnums',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
],
function(declare, connect, popup, AddElementAction, RemoveElementAction, ArasTextActions,
	ListAction, TableAction, ViewExternalItem, RefreshContentAction, Enums, TDEnums) {
	return declare('Aras.Client.Controls.MPP.WIModel.ActionsHelper', null, {
		viewmodel: null,
		clipboard: null,
		datamodel: null,
		aras: null,
		resourceElementName: 'Resource',

		constructor: function(args) {
			this.viewmodel = args.viewmodel;
			this.datamodel = args.datamodel;
			this.clipboard = args.clipboard;
			this.aras = args.aras;
			this.topWindow = this.aras.getMostTopWindowWithAras();

			// workaround because of TechDoc implementation specific, should be replaced with fix in major branch
			this.editor = {
				focus: function() {}
			};

			this.viewActions = {
				insertelement: {
					title: this.aras.getResource('../Modules/aras.innovator.TDF', 'action.insert'),
					handler: new AddElementAction({actionsHelper: this}),
					priority: 10
				},
				removeelement: {
					title: this.aras.getResource('../Modules/aras.innovator.TDF', 'action.remove'),
					handler: new RemoveElementAction({actionsHelper: this}),
					priority: 30
				},
				viewexternalitem: {
					title: this.aras.getResource('../Modules/aras.innovator.TDF', 'action.viewitem'),
					handler: new ViewExternalItem({actionsHelper: this}),
					priority: 110
				},
				refreshcontent: {
					title: this.aras.getResource('../Modules/aras.innovator.TDF', 'action.refreshcontent'),
					handler: new RefreshContentAction({actionsHelper: this}),
					priority: 140
				},
				arastextactions: {
					handler: new ArasTextActions({actionsHelper: this})
				},
				listaction: {
					handler: new ListAction({actionsHelper: this})
				},
				tableactions: {
					handler: new TableAction({actionsHelper: this})
				},
				addelement: {
					addPrefix: this.aras.getResource('MPP', 'action.add'),
					insertPrefix: this.aras.getResource('MPP', 'action.insert'),
					handler: new AddElementAction({actionsHelper: this}),
					priority: 0
				}
			};
		},

		getAction: function(actionName) {
			var targetAction = this.viewActions[actionName];

			return targetAction && targetAction.handler;
		},

		executeAction: function(actionName, actionArguments) {
			var targetAction = this.getAction(actionName);

			if (targetAction) {
				return targetAction.Execute(actionArguments);
			}
		},

		GetProcessPlanMenuModel: function(selectedItems) {
			var menuModel = [];

			if (selectedItems && selectedItems.length) {
				var isEditable = this.viewmodel.IsEditable();
				var isSingleSelect = selectedItems.length === 1;
				var isMultiSelect = selectedItems.length > 1;
				var immutable = this.viewmodel.classification && selectedItems.some(function(item) {
					return this.viewmodel.isRootElementContained(item.Parent || item);
				}.bind(this));
				var currentSelectedItems = (isMultiSelect) ? selectedItems : selectedItems[0];
				var modelItems = this.getSelectedModelItems(selectedItems);
				var isItemsFromRoot = this.datamodel.isFromRootProcessPlan(modelItems);
				var isItemsDeleted = this.datamodel.isDeleted(modelItems);

				if (!immutable && isEditable && isItemsFromRoot && !isItemsDeleted) {
					this.appendActionMenuItem(menuModel, 'removeelement', currentSelectedItems);
				}

				if (isSingleSelect) {
					var isExternalBlock = currentSelectedItems.is('ArasBlockXmlSchemaElement') &&
						currentSelectedItems.ByReference() === Enums.ByReferenceType.External;
					var modelItem = currentSelectedItems.Item();
					var isFromRootProcessPlan = this.datamodel.isFromRootProcessPlan(modelItem);
					var isArasItem = currentSelectedItems.is('ArasItemXmlSchemaElement');
					var isRootElement = !currentSelectedItems.Parent;

					// append ViewItem action
					if ((isExternalBlock || isArasItem) && !isRootElement) {
						this.appendActionMenuItem(menuModel, 'viewexternalitem', currentSelectedItems);
					}

					if (isEditable && isFromRootProcessPlan) {
						// append Internal action
						this.appendActionMenuItem(menuModel, 'refreshcontent', currentSelectedItems);
						this.appendActionMenuItem(menuModel, 'addelement', currentSelectedItems);
					}
				}

				if (modelItems.length) {
					var dataModelActions = this.datamodel.actionsHelper.getSpecificItemActionsMenuModel(modelItems);

					menuModel = this.mergeActionMenuModels(menuModel, dataModelActions);
				}
			}

			return menuModel.sort(function(a, b) {
				return a.priority - b.priority;
			});
		},

		GetWorkInstructionsMenuModel: function(selectedItems) {
			var menuModel = [];

			if (selectedItems && selectedItems.length) {
				var isEditable = this.viewmodel.IsEditable();
				var isSingleSelect = selectedItems.length === 1;
				var isMultiSelect = selectedItems.length > 1;
				var immutable = this.viewmodel.classification && selectedItems.some(function(item) {
					return this.viewmodel.isRootElementContained(item.Parent || item);
				}.bind(this));
				var isElementFromInternalBlock = !(this.viewmodel.ExternalBlockHelper().isExternalBlockContains(selectedItems));
				var currentSelectedItems = (isMultiSelect) ? selectedItems : selectedItems[0];
				var modelItems = this.getSelectedModelItems(selectedItems);
				var isTableContentElement = this.searchTableElements(currentSelectedItems);
				var isItemsDeleted = this.datamodel.isDeleted(modelItems);

				if (!immutable && isEditable && isElementFromInternalBlock && !isItemsDeleted) {
					if (!isTableContentElement) {
						this.appendActionMenuItem(menuModel, 'removeelement', currentSelectedItems);
					}
				}

				if (isSingleSelect) {
					var isExternalBlock = currentSelectedItems.is('ArasBlockXmlSchemaElement') &&
						currentSelectedItems.ByReference() === Enums.ByReferenceType.External;
					var isArasItem = currentSelectedItems.is('ArasItemXmlSchemaElement');
					var isRootElement = !currentSelectedItems.Parent;

					// append ViewItem action
					if ((isExternalBlock || isArasItem) && !isRootElement) {
						this.appendActionMenuItem(menuModel, 'viewexternalitem', currentSelectedItems);
					}

					if (isEditable) {
						// append Table menu action
						if ((currentSelectedItems.is('ArasTableXmlSchemaElement') || isTableContentElement) && !isItemsDeleted) {
							var titlesList = this.viewActions.tableactions.handler.GetTablesMenu(currentSelectedItems);
							var menuAction;

							for (menuAction in titlesList) {
								menuModel.push(titlesList[menuAction]);
							}
						}

						// append Internal action
						this.appendActionMenuItem(menuModel, 'refreshcontent', currentSelectedItems);
						this.appendActionMenuItem(menuModel, 'addelement', currentSelectedItems);
					}
				}

				if (modelItems.length) {
					var dataModelActions = this.datamodel.actionsHelper.getSpecificItemActionsMenuModel(modelItems);

					menuModel = this.mergeActionMenuModels(menuModel, dataModelActions);
				}
			}

			return menuModel.sort(function(a, b) {
				return a.priority - b.priority;
			});
		},

		getCreateSiblingMenu: function(targetElement) {
			var menuItems = [];

			if (targetElement) {
				if (this.viewmodel.IsEditable()) {
					var isElementFromInternalBlock = !this.viewmodel.ExternalBlockHelper().isExternalBlockContains(targetElement);

					// append Insert|Append menu actions
					if (isElementFromInternalBlock) {
						var isTableElement = targetElement.is('ArasTableXmlSchemaElement') || targetElement.is('ArasRowXmlSchemaElement') ||
							targetElement.is('ArasCellXmlSchemaElement');
						var menuItemCandidates;

						if (isTableElement) {
							menuItemCandidates = this.viewActions.tableactions.handler.getCreateSiblingMenu(targetElement);
						}

						return menuItemCandidates || this.getAppendMenu(targetElement);
					}
				}
			}

			return menuItems;
		},

		onMenuItemClick: function(cmdId, rowId, tooltipDialogArguments) {
			var selectedWrappedObject = this.viewmodel.GetElementById(rowId);
			var selectedItems = this.viewmodel.GetSelectedItems();
			var viewModelElements = this.filterDataModelElements(selectedItems);
			var groupSplit = cmdId.split('|');
			var groupNames = groupSplit.length === 2 ? groupSplit[0].split(',') : [];
			var commandNameSplit = groupSplit.length === 2 ? groupSplit[1].split(':') : cmdId.split(':');
			var actionName = commandNameSplit[0];
			var target = commandNameSplit[1];
			var actionArguments, subCommand, placementType, elementName, modelItemType, selectedModelItem;

			this.viewmodel.SuspendInvalidation();

			try {
				// if action is not specific model action, then
				if ((!groupNames.length || groupNames.indexOf('wi') !== -1) && viewModelElements.length) {
					var viewAction = this.viewActions[actionName];
					var actionHandler = viewAction && viewAction.handler;

					switch (actionName) {
						case 'removeelement':
							actionArguments = {selectedItems: viewModelElements};
							break;
						case 'viewexternalitem':
						case 'refreshcontent':
							actionArguments = {selectedItem: viewModelElements[0]};
							break;
						case 'table':
							actionHandler = this.viewActions.tableactions.handler;
							actionArguments = {action: target};
							break;
						case 'addelement':
							subCommand = target.split('>');
							placementType = subCommand[0];
							elementName = subCommand[1];

							actionArguments = {elementName: elementName, context: selectedWrappedObject, direction: placementType};
							break;
						default:
							break;
					}

					if (actionHandler) {
						actionHandler.Execute(actionArguments);
					}
				}

				// if this is a "datamodel" action
				if (groupNames.indexOf('datamodel') !== -1) {
					var dataModelActions = this.datamodel.actionsHelper;
					var selectedModelItems = this.getSelectedModelItems(selectedItems);

					switch (actionName) {
						case 'additem':
							var selectedItem = selectedItems[0];
							var nearestModelItemElement = this.findNearestModelItem(selectedItem);

							subCommand = target.split('>');
							placementType = selectedItem === nearestModelItemElement ? subCommand[0] : 'insert';
							elementName = subCommand[1];
							modelItemType = Enums.getModelTypeFromElementName(elementName);

							actionArguments = {
								selectedItem: nearestModelItemElement && nearestModelItemElement.Item(),
								direction: placementType,
								itemType: modelItemType,
								tooltipDialogArguments: tooltipDialogArguments
							};
							break;
						case 'changequantity':
							actionArguments = {
								selectedItem: (selectedModelItems.length && selectedModelItems[0]),
								isChangeQuantity: true,
								tooltipDialogArguments: tooltipDialogArguments
							};
							break;
						case 'createprocessplan':
							selectedModelItem = selectedModelItems.length && selectedModelItems[0];
							actionArguments = {selectedItem: (selectedModelItem && selectedModelItem.getRelatedItem())};
							break;
						case 'viewproducedpart':
							selectedModelItem = selectedModelItems.length && selectedModelItems[0];
							actionArguments = {selectedItems: [selectedModelItem.getProducedPart()]};
							break;
						case 'viewedititem':
							var isEditable = this.viewmodel.IsEditable();
							var isItemsFromRoot = this.datamodel.isFromRootProcessPlan(selectedModelItems);
							var isEditAction = isEditable && isItemsFromRoot;

							actionArguments = {selectedItems: selectedModelItems, tooltipDialogArguments: tooltipDialogArguments, isEditAction: isEditAction};
							break;
						default:
							actionArguments = {selectedItems: selectedModelItems, tooltipDialogArguments: tooltipDialogArguments};
							break;
					}
					var action = dataModelActions.actions[actionName];
					actionArguments.actionArgumentsOptionalArgs = action.actionOptionalArgs;
					dataModelActions.executeAction(actionName, actionArguments);
					var currentItem, flowCourses;
					if (selectedModelItems && actionName == "removeelement") {
						for (var i = 0; i < selectedModelItems.length; i++) {
							currentItem = selectedModelItems[i];
							flowCourses = aras.getRelationships(parent.item, "mpp_process_flow");
							if (flowCourses.length < 1) {
								processFlowItem = aras.getItemRelationshipsEx(parent.item, "mpp_process_flow");
								flowCourses = aras.getRelationships(parent.item, "mpp_process_flow");
							}
							if (flowCourses.length > 0) {
								var flowCourse, path_to_id, path_from_id;
								for (var x = 0; x < flowCourses.length; x++) {
									flowCourse = flowCourses[x];
									path_to_id = aras.getItemProperty(flowCourse, "path_to_id");
									path_from_id = aras.getItemProperty(flowCourse, "path_from_id");
									if (path_to_id.substring(4) == currentItem._id || path_from_id.substring(4) == currentItem._id) {
										flowCourse.setAttribute("action", "delete");
									}
								}
							}
						}
					}
				}
			} catch (ex) {
				this.aras.AlertError(ex.message);
			} finally {
				this.viewmodel.ResumeInvalidation();
			}
		},

		findNearestModelItem: function(targetElement) {
			if (targetElement) {
				var nearestModelItemElement = targetElement;

				while (nearestModelItemElement && !nearestModelItemElement.is('ArasInternalItemXmlSchemaElement')) {
					nearestModelItemElement = nearestModelItemElement.Parent;
				}

				return nearestModelItemElement;
			}
		},

		showContextMenu: function(contextMenu, parentWidget, menuModel, rowId, additionalSettings) {
			if (contextMenu && parentWidget && menuModel) {
				contextMenu.removeAll();
				contextMenu.addRange(menuModel);
				contextMenu.rowId = rowId;
				additionalSettings = additionalSettings || {};

				connect.connect(contextMenu.menu, 'onBlur', function() {
					this.hideContextMenu(contextMenu);
				}.bind(this));

				connect.connect(contextMenu.menu, 'onKeyPress', function(keyEvent) {
					if (keyEvent.keyCode === 27) {
						this.hideContextMenu(contextMenu);
					}
				}.bind(this));

				popup.open({
					popup: contextMenu.menu,
					parent: parentWidget,
					x: isNaN(additionalSettings.x) ? 0 : additionalSettings.x,
					y: isNaN(additionalSettings.y) ? 0 : additionalSettings.y,
					onClose: additionalSettings.onClose,
					onExecute: additionalSettings.onExecute
				});

				contextMenu.menu.focus();
			}
		},

		hideContextMenu: function(targetMenu) {
			targetMenu.rowId = null;
			targetMenu.removeAll();
		},

		getSelectedModelItems: function(selectedElements) {
			var modelItems = [];
			var currentElement, i;

			for (i = 0; i < selectedElements.length; i++) {
				currentElement = selectedElements[i];

				if (currentElement.is('ArasInternalItemXmlSchemaElement') && !currentElement.isEmpty()) {
					modelItems.push(currentElement.Item());
				}
			}

			return modelItems;
		},

		filterDataModelElements: function(selectedElements) {
			var filteredElements = [];
			var currentElement, i;

			for (i = 0; i < selectedElements.length; i++) {
				currentElement = selectedElements[i];

				if (!currentElement.is('ArasInternalItemXmlSchemaElement')) {
					filteredElements.push(currentElement);
				}
			}

			return filteredElements;
		},

		mergeActionMenuModels: function(firstGroup, secondGroup) {
			var resultMenuModel = [];

			if (firstGroup && secondGroup) {
				var actionsHash = {};
				var actionDescriptor, actionName, actionIndex, actionId, existingGroups, groupSplit, groupName, groupNames, i, j;

				for (i = 0; i < firstGroup.length; i++) {
					actionId = firstGroup[i].id;

					groupSplit = actionId.split('|');
					actionName = groupSplit.length === 2 ? groupSplit[1] : actionId;
					groupNames = groupSplit.length === 2 ? groupSplit[0].split(',') : [];

					actionsHash[actionName] = {index: i, groups: groupNames};
				}

				resultMenuModel = resultMenuModel.concat(firstGroup);

				for (i = 0; i < secondGroup.length; i++) {
					actionId = secondGroup[i].id;

					groupSplit = actionId.split('|');
					groupNames = groupSplit.length === 2 ? groupSplit[0].split(',') : [];

					if (groupNames.length) {
						actionName = groupSplit.length === 2 ? groupSplit[1] : actionId;

						// if action isn't exist in current menumodel, then add it
						if (actionsHash[actionName]) {
							actionIndex = actionsHash[actionName].index;
							existingGroups = actionsHash[actionName].groups;
							actionDescriptor = resultMenuModel[actionIndex];

							for (j = 0; j < groupNames.length; j++) {
								groupName = groupNames[j];

								if (existingGroups.indexOf(groupName) === -1) {
									existingGroups.push(groupName);
								}
							}

							actionDescriptor.id = existingGroups.join(',') + '|' + actionName;
						} else {
							resultMenuModel.push(secondGroup[i]);
						}
					}
				}
			}

			return resultMenuModel;
		},

		appendActionMenuItem: function(menuItems, actionName, selectedItems) {
			/// <summary>
			/// Appends menu item to 'menuItems' if all validations are passed.
			/// </summary>
			/// <param name="menuItems" type="Array">Container for menu items.</param>
			/// <param name="actionName" type="String">Name of action for add.</param>
			/// <param name="selectedItems" type="WrappedObject|Array">Items, that currently selected in Model.</param>
			if (actionName) {
				var actionGroupSplit = actionName.split('|');
				var actionGroupName = actionGroupSplit.length === 2 ? actionGroupSplit[0] : '';

				if (!actionGroupName || actionGroupName === 'common') {
					var cleanActionName = actionGroupName ? actionGroupSplit[1] : actionName;
					var viewAction = this.viewActions[cleanActionName];
					var actionTitle = viewAction.title;
					var isActionAllowed = true;
					var isAppended = false;
					var subMenuItems, menuItem, addMenuItems, i;

					switch (cleanActionName) {
						case 'addelement':
							var nearestModelItemElement = this.findNearestModelItem(selectedItems);
							var isModelItemChild = selectedItems !== nearestModelItemElement;
							var modelItem = nearestModelItemElement.Item();
							var isItemDeleted = modelItem.isDeleted();
							var isParentDeleted = modelItem.isParentDeleted();
							var priority = isNaN(this.viewActions[cleanActionName].priority) ? 1000 : this.viewActions[cleanActionName].priority;

							if (!(isItemDeleted && isModelItemChild) && !isParentDeleted) {
								addMenuItems = this.getAppendMenu(selectedItems);

								for (i = 0; i < addMenuItems.length; i++) {
									menuItem = addMenuItems[i];
									menuItem.name = viewAction.addPrefix + ' ' + menuItem.name;
									menuItem.priority = priority;

									menuItems.push(menuItem);
								}
							}

							if (!isItemDeleted && !isParentDeleted) {
								addMenuItems = this.getInsertMenu(selectedItems);

								for (i = 0; i < addMenuItems.length; i++) {
									menuItem = addMenuItems[i];
									menuItem.name = viewAction.insertPrefix + ' ' + menuItem.name;
									menuItem.priority = priority;

									menuItems.push(menuItem);
								}
							}

							isAppended = true;
							break;
						case 'viewexternalitem':
							isActionAllowed = !selectedItems.isBlocked();
							break;
						case 'refreshcontent':
							isActionAllowed = selectedItems.ContentType() === Enums.ElementContentType.Static;
							break;
						case 'removeelement':
							//Modify By BCS Tengz 2021/6/28 MPP与PQD联动
							//增加不允许编辑对象逻辑
							var schemaHelper = this.viewmodel.Schema();
							isActionAllowed = !this.viewmodel.isRootElementContained(selectedItems);
							if(isActionAllowed){
								if(Array.isArray(selectedItems)){
									for(let selectedItem of selectedItems){
										if(schemaHelper.getSchemaAttribute(selectedItem.nodeName, 'noedit')){
											isActionAllowed=false;
											break;
										}
										if(parent.isUsedPQD){
											if(selectedItem.Parent&&selectedItem.Parent.nodeName=="Test"){
												isActionAllowed=false;
												break;
											}
										}
									}
								}else{
									isActionAllowed=!schemaHelper.getSchemaAttribute(selectedItems.nodeName, 'noedit');
									if(parent.isUsedPQD&&isActionAllowed&&selectedItems.Parent){
										isActionAllowed=selectedItems.Parent.nodeName!="Test";
									}
								}
							}
							//End Modify
							break;
						default:
							break;
					}

					if (isActionAllowed && !isAppended) {
						var actionPriority = isNaN(this.viewActions[cleanActionName].priority) ? 1000 : this.viewActions[cleanActionName].priority;

						menuItems.push({id: 'wi|' + actionName, name: actionTitle, subMenu: subMenuItems, priority: actionPriority});
					}
				}
			}
		},

		getInsertMenu: function(selectedItem) {
			var schemaHelper = this.viewmodel.Schema();
			var expectedElements = schemaHelper.GetExpectedElements(selectedItem).insert;
			var menuItems = [];
			var elementName, elementType, itemImage, isInternalItem, menuItemToPushLast, menuItem, i;

			for (i = 0; i < expectedElements.length; i++) {
				elementName = expectedElements[i];

				if (elementName !== 'External Content') {
					//Add By BCS Tengz 2021/6/28 MPP与PQD联动
					//增加不允许编辑对象的逻辑
					if(schemaHelper.getSchemaAttribute(elementName, 'noedit') !== undefined){
						continue;
					}
					//End Add
					elementType = schemaHelper.GetSchemaElementType(elementName);
					isInternalItem = schemaHelper.getSchemaAttribute(elementName, 'internalitem') !== undefined;
					itemImage = Enums.getImageFromName(elementName) || Enums.getImagefromType(elementType);
					menuItem = {
						id: (isInternalItem ? 'datamodel|additem' : 'wi|addelement') + ':insert>' + elementName,
						icon: itemImage === 'blank' ? undefined : itemImage,
						name: elementName
					};

					if (elementName === this.resourceElementName) {
						menuItemToPushLast = menuItem;
					} else {
						menuItems.push(menuItem);
					}
				}
			}

			if (menuItemToPushLast) {
				menuItems.push(menuItemToPushLast);
			}

			return menuItems;
		},

		getAppendMenu: function(selectedItem) {
			var schemaHelper = this.viewmodel.Schema();
			var expectedElements = schemaHelper.GetExpectedElements(selectedItem).append;
			var menuItems = [];
			var isTableCell = selectedItem.is('ArasCellXmlSchemaElement');
			var elementName, elementType, itemImage, isInternalItem, menuItemToPushLast, menuItem, i;

			for (i = 0; i < expectedElements.length; i++) {
				elementName = expectedElements[i];

				if (elementName !== 'External Content') {
					elementType = schemaHelper.GetSchemaElementType(elementName);
					
					//Add By BCS Tengz 2021/6/28 MPP与PQD联动
					//增加不允许编辑对象的逻辑
					if(schemaHelper.getSchemaAttribute(elementName, 'noedit') !== undefined){
						continue;
					}
					//End Add

					// remove cell elements from menu, if menu created for TableCell
					if (isTableCell && (elementType & TDEnums.XmlSchemaElementType.TableCell) === TDEnums.XmlSchemaElementType.TableCell) {
						continue;
					}

					isInternalItem = schemaHelper.getSchemaAttribute(elementName, 'internalitem') !== undefined;
					itemImage = Enums.getImageFromName(elementName) || Enums.getImagefromType(elementType);
					menuItem = {
						id: (isInternalItem ? 'datamodel|additem' : 'wi|addelement') + ':append>' + elementName,
						icon: itemImage === 'blank' ? undefined : itemImage,
						name: elementName
					};

					if (elementName === this.resourceElementName) {
						menuItemToPushLast = menuItem;
					} else {
						menuItems.push(menuItem);
					}
				}
			}

			if (menuItemToPushLast) {
				menuItems.push(menuItemToPushLast);
			}

			return menuItems;
		},

		getPasteSubMenu: function(action, selectedItem) {
			var modes = [{value: 'before', name: 'Before'}, {value: 'into', name: 'Into'}, {value: 'after', name: 'After'}];
			var pasteSubMenu = [];
			var validationResult, currentMode, i;

			validationResult = action.handler.Validate({selectedItem: selectedItem, clipboard: this.clipboard, actions: modes});

			for (i = 0; i < modes.length; i++) {
				currentMode = modes[i];

				if (validationResult[currentMode.value]) {
					pasteSubMenu.push({id: 'pasteelement:' + currentMode.value, name: currentMode.name});
				}
			}

			return pasteSubMenu;
		},

		haveSameParentCheck: function(selectedItems, invalidElementType) {
			/// <summary>
			/// Checks that elements have same parent.
			/// </summary>
			/// <param name="selectedItems" type="WrappedObject|Array">Items for check.</param>
			/// <param name="invalidElementType" type="String">Invalid element type for check.</param>
			/// <returns>True if all items have same parent.</returns>
			var itemsList = Array.isArray(selectedItems) ? selectedItems : [selectedItems];
			var firstItem = itemsList[0];
			var parentItem = firstItem.Parent;

			if (parentItem && (!invalidElementType || !firstItem.is(invalidElementType))) {
				var parentId = parentItem.Id();
				var isAllSelectedSiblings = true;
				var selectedItem, i;

				for (i = 1; i < itemsList.length; i++) {
					selectedItem = itemsList[i];

					if (!selectedItem.Parent || selectedItem.Parent.Id() !== parentId || (invalidElementType && selectedItem.is(invalidElementType))) {
						isAllSelectedSiblings = false;
						break;
					}
				}

				if (isAllSelectedSiblings) {
					var childItems = parentItem.ChildItems();
					var indexArray = [];

					for (i = 0; i < itemsList.length; i++) {
						indexArray.push(childItems.index(itemsList[i]));
					}

					indexArray = indexArray.sort();
					return (indexArray[indexArray.length - 1] - indexArray[0] + 1) === itemsList.length;
				}
			}

			return false;
		},

		searchTableElements: function(selectedItems) {
			var selectedItem, i;

			selectedItems = Array.isArray(selectedItems) ? selectedItems : [selectedItems];

			for (i = 0; i < selectedItems.length; i++) {
				selectedItem = selectedItems[i];

				if (selectedItem.is('ArasRowXmlSchemaElement') || (selectedItem.is('ArasCellXmlSchemaElement') &&
					selectedItem.Parent.is('ArasRowXmlSchemaElement'))) {
					return true;
				}
			}

			return false;
		}
	});
});
