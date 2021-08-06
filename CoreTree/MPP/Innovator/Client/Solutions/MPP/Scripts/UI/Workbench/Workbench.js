define([
	'dojo/_base/declare',
	'dojo/aspect',
	'MPP/UI/Utils/UIUtils',
	'MPP/UI/Workbench/WorkbenchGrid',
	'MPP/Model/ModelEnums',
	'dojo/parser',
	'dijit/dijit',
	'MPP/Model/PartConfig'
],
function(declare, aspect, UIUtils, WorkbenchGrid, Enums, parser, dijit, partConfig) {
	return declare('Aras.Client.Controls.MPP.Workbench', null, {
		aras: null,
		itemsType: null,
		gridHeaders: null,
		gridData: null,
		domNode: null,
		uiControls: null,
		datamodel: null,
		UIUtils: null,
		additionalItems: null,
		expandStates: null,
		isEditable: null,
		supportedTypes: null,
		isProcessPlanView: null,
		idPrefix: null,
		typeIconCache: null,

		constructor: function(initialArguments) {
			var workbenchData = initialArguments.workbenchData || {};

			this.aras = initialArguments.aras;
			this.datamodel = initialArguments.datamodel;
			this.dndController = initialArguments.dndController;
			this.gridHeaders = workbenchData.gridHeaders || {};
			this.UIUtils = new UIUtils({aras: this.aras});
			this.additionalItems = workbenchData.gridItems || {};
			this.expandStates = {};
			this.isEditable = this.datamodel.isEditable();
			this.supportedTypes = initialArguments.supportedTypes || [];
			this.isProcessPlanView = initialArguments.isProcessPlanView;
			this.idPrefix = initialArguments.idPrefix || '_' + Date.now();
			this.typeIconCache = {};
			this.clientControlsFactory = initialArguments.clientControlsFactory;

			this.postCreate(initialArguments);
		},

		setEditable: function(doEditable) {
			if (this.isEditable !== doEditable) {
				this.isEditable = doEditable;

				if (this.uiControls) {
					this.uiControls.grid.activateDnD(doEditable);
				}
			}
		},

		postCreate: function(initialArguments) {
			if (initialArguments.createControl) {
				this.createControl(initialArguments);
			}

			this.attachDataModelListeners();
		},

		getAdditionalItems: function(workbenchType) {
			var foundItems = this.additionalItems[workbenchType];

			if (!foundItems) {
				var rootProcessPlan = this.datamodel.rootProcessPlan;

				foundItems = {};

				if (rootProcessPlan) {
					var existingItems, itemId, modelItem, i;

					switch (workbenchType) {
						case 'Parts':
							var producedPart = rootProcessPlan.getProducedPart();

							existingItems = producedPart ? this.getPartMBomStructure(producedPart, {producedPartId: producedPart.Id()}) : [];

							for (i = 0; i < existingItems.length; i++) {
								modelItem = existingItems[i];
								itemId = modelItem.getProperty('bom_id');

								foundItems[itemId] = modelItem;
							}
							break;
						default:
							break;
					}
				}

				this.additionalItems[workbenchType] = foundItems;
			}

			return foundItems;
		},

		dropData: function(itemsType) {
			if (itemsType) {
				delete this.additionalItems[itemsType];

				if (itemsType === this.itemsType) {
					this.initGrid(this.itemsType, true);
				}
			} else {
				this.additionalItems = {};
				this.initGrid(this.itemsType, true);
			}
		},

		attachDataModelListeners: function() {
			this.datamodel.addEventListener(this, null, 'onDeleteItem', this.onDeleteModelItemHandler, 1);
		},

		onDeleteModelItemHandler: function(modelItem, optionalParameters) {
			optionalParameters = optionalParameters || {};

			if (modelItem && modelItem.is('ConsumedPart') && modelItem.hasRelatedItem() && !modelItem.isNew() && !optionalParameters.ignoreForWorkbench) {
				var additionalItems = this.getAdditionalItems('Parts');
				var allWorkbenchParts = [];
				var isItemAllreadyExists = false;
				var deletedPartItem = modelItem.getRelatedItem();
				var deletedItemId = deletedPartItem.Id();
				var currentModelItem, partId, i;

				for (partId in additionalItems) {
					currentModelItem = additionalItems[partId];

					allWorkbenchParts = allWorkbenchParts.concat(currentModelItem.getAllChildren());
				}

				for (i = 0; i < allWorkbenchParts.length; i++) {
					currentModelItem = allWorkbenchParts[i];

					if (currentModelItem.Id() === deletedItemId) {
						isItemAllreadyExists = true;
						break;
					}
				}

				if (!isItemAllreadyExists) {
					this.UIUtils.showConfirmDialog(this.UIUtils.getResource('workbench.sendToWorkbenchWarning'), {
						buttons: {
							btnRemove: this.UIUtils.getResource('action.remove'),
							btnSendToWorkbench: this.UIUtils.getResource('workbench.sendToWorkbenchButton')
						},
						defaultButton: 'btnRemove'
					})
						.then(function(selectedOption) {
							if (selectedOption === 'btnSendToWorkbench') {
								// additionally check if user selected produced part for current processPlan
								var partItemWithStructure = this.getPartMBomStructure(deletedPartItem);
								var workbenchItemsType = Enums.getModelTypeFromWorkbenchType(this.itemsType);

								if (workbenchItemsType === Enums.ModelItemTypes.Part) {
									this.addModelItemsToGrid(partItemWithStructure);
								} else {
									additionalItems[deletedItemId] = partItemWithStructure[0];
								}
							}
						}.bind(this));
				}
			}
		},

		removeDataModelListeners: function() {
			this.datamodel.removeEventListeners(this);
		},

		onNewModelItemHandler: function(newItem, parentItem) {
			var targetItem = newItem.hasRelatedItem() ? newItem.getRelatedItem() : newItem;

			targetItem = targetItem.Clone();

			// if user add part item, then additionally request mbom structure from server
			if (targetItem.getType() === Enums.ModelItemTypes.Part) {
				var rootProcessPlan = this.datamodel.rootProcessPlan;
				var producedPart = rootProcessPlan && rootProcessPlan.getProducedPart();

				// additionally check if user selected produced part for current processPlan
				targetItem = this.getPartMBomStructure(targetItem, producedPart ? {producedPartId: producedPart.Id()} : {});
			}

			this.addModelItemsToGrid(targetItem);
		},

		isItemAllreadyInGrid: function(gridControl, itemId) {
			if (gridControl && itemId) {
				var topLevelItems = gridControl.grid_Experimental.store._arrayOfTopLevelItems;
				var storeItem, userData, i;

				for (i = 0; i < topLevelItems.length; i++) {
					storeItem = topLevelItems[i];
					userData = storeItem.userData$Gm;

					if (userData && userData.itemId === itemId) {
						return true;
					}
				}
			}
		},

		addModelItemsToGrid: function(targetItems) {
			if (targetItems && this.uiControls) {
				var workbenchItemsType = Enums.getModelTypeFromWorkbenchType(this.itemsType);
				var additionalItems = this.getAdditionalItems(this.itemsType);
				var gridControl = this.uiControls.grid;
				var approvedItems = [];
				var modelItem, newRowItem, itemId, i, itemType;

				targetItems = targetItems ? (Array.isArray(targetItems) ? targetItems : [targetItems]) : [];

				for (i = 0; i < targetItems.length; i++) {
					modelItem = targetItems[i];
					itemId = modelItem.Id();
					itemType = modelItem.getType();
					var isCheckPassed = itemType !== Enums.ModelItemTypes.Unknown;

					if (!isCheckPassed && modelItem.hasRelatedItem()) {
						modelItem = modelItem.getRelatedItem();
						itemType = modelItem.getType();

						isCheckPassed = itemType !== Enums.ModelItemTypes.Unknown;
					}

					if (isCheckPassed && !this.isItemAllreadyInGrid(gridControl, itemId)) {
						newRowItem = this.buildGridItemFromModelItem(modelItem);

						if (newRowItem) {
							gridControl.enumerateItems(newRowItem);

							approvedItems.push(newRowItem);
							additionalItems[itemId] = modelItem;
						}
					}
				}

				if (approvedItems.length && workbenchItemsType === itemType) {
					var gridRowItems = gridControl.decorateRowItemsBeforeAdd(approvedItems, '', '');

					for (i = 0; i < gridRowItems.length; i++) {
						gridControl.items_Experimental.add(gridRowItems[i], '');
					}

					gridControl.grid_Experimental.refresh();
				}
			}
		},

		buildGridItemFromModelItem: function(modelItem) {
			if (modelItem && !modelItem.isBlocked()) {
				var modelItemType = modelItem.getType();
				var itemTypeName = Enums.getItemTypeFromModelType(modelItemType);

				if (itemTypeName) {
					var iconPath = this.getIconByItemType(itemTypeName);
					var fieldsData = [];
					var childrenData = [];
					var requiredProperties = this.getRequiredPropertiesByType(modelItemType);
					var resultData = {
						icon: iconPath,
						expandedIcon: iconPath,
						fields: fieldsData,
						userdata: {
							itemId: modelItem.Id()
						},
						children: childrenData
					};
					var childItems = modelItem.ChildItems().getAllItems();
					var propertyValue, propertyName, childRowData, i;

					if (modelItemType === Enums.ModelItemTypes.Part) {
						resultData.userdata.bomId = modelItem.getProperty('bom_id');
					}

					for (i = 0; i < requiredProperties.length; i++) {
						propertyName = requiredProperties[i];
						propertyValue = modelItem.getProperty(propertyName) || '';

						fieldsData.push(propertyValue);
					}

					for (i = 0; i < childItems.length; i++) {
						childRowData = this.buildGridItemFromModelItem(childItems[i]);

						if (childRowData) {
							childrenData.push(childRowData);
						}
					}

					return resultData;
				}
			}
		},

		deserealizeModelItemToRowItem: function(modelItem, customProperties) {
			if (modelItem) {
				var modelItemType = modelItem.getType();
				var requiredProperties = this.getRequiredPropertiesByType(modelItemType);

				return this._deserealizeItemToRowItem(modelItem, null, requiredProperties);
			}
		},

		getRequiredPropertiesByType: function(modelItemType) {
			var itemTypes = Enums.ModelItemTypes;
			var itemPropertyNames = ['item_number', 'name'];

			switch (modelItemType) {
				case itemTypes.Part:
					itemPropertyNames.push('major_rev', 'make_buy', 'classification', 'quantity');
					break;
				case itemTypes.Document:
					itemPropertyNames.push('major_rev');
					break;
				//Add by tengz 2019/6/4
				//Process Plan workbench 里添加对象类
				case itemTypes.CAD:
					itemPropertyNames.push('major_rev','classification');
					break;
				default:
					break;
			}

			return itemPropertyNames;
		},

		getIconByItemType: function(itemTypeName) {
			var typeIcon = this.typeIconCache[itemTypeName];

			if (!typeIcon) {
				var itemTypeDescriptor = this.datamodel.getItemTypeDescriptor(itemTypeName);

				typeIcon = itemTypeDescriptor.getProperty('open_icon');
				this.typeIconCache[itemTypeName] = typeIcon;
			}

			return typeIcon;
		},

		_deserealizeItemToRowItem: function(targetItem, parentItem, itemProperties) {
			if (targetItem) {
				var itemTypeName = targetItem.getItemType();
				var iconPath = this.getIconByItemType(itemTypeName);
				var childItems = targetItem.ChildItems().getAllItems();
				var fieldsData = [];
				var childrenData = [];
				var rowItem = {
					icon: iconPath,
					expandedIcon: iconPath,
					fields: fieldsData,
					parent: parentItem,
					children: childrenData,
					userdata: {
						itemId: targetItem.Id()
					}
				};
				var i;

				for (i = 0; i < itemProperties.length; i++) {
					fieldsData.push(targetItem.getProperty(itemProperties[i]) || '');
				}

				for (i = 0; i < childItems.length; i++) {
					childrenData.push(this._deserealizeItemToRowItem(childItems[i], rowItem, itemProperties));
				}

				return rowItem;
			}
		},

		destroyControl: function() {
			if (this.domNode) {
				var controls = this.uiControls;

				if (controls) {
					for (var i = 0; i < controls.handlers.length; i++) {
						var eventHandler = controls.handlers[i];
						eventHandler.remove();
					}

					if (controls.grid) {
						controls.grid.destroyRecursive(true);
					}

					if (controls.toolbar) {
						controls.toolbar.destroyRecursive(true);
					}

					if (controls.container) {
						controls.container.destroyRecursive(true);
					}

					this.uiControls = null;
				}

				this.domNode.parentNode.removeChild(this.domNode);
				this.domNode = null;
			}
		},

		createControl: function(initialArguments) {
			var containerId = initialArguments.containerId || 'WorkbenchContainer';
			var containerNode = containerId ? document.getElementById(containerId) : null;

			if (containerNode) {
				// cleanup before initialization
				this.destroyControl();

				switch (initialArguments.controlType) {
					case 'iframe':
						var iframeHtml = this.generateWorkbenchFrameHtml(this.idPrefix);
						containerNode.innerHTML = iframeHtml;
						var iframeNode = containerNode.firstChild;
						var iframeLoadHandler = function() {
							iframeNode.removeEventListener('load', iframeLoadHandler);
							iframeNode.contentWindow.initWorkbench(this, initialArguments);
						}.bind(this);
						iframeNode.addEventListener('load', iframeLoadHandler);
						break;
					default:
						this.fillNodeWithControls(containerNode, initialArguments);
						break;
				}
			}
		},

		fillNodeWithControls: function(targetNode, initialArguments) {
			var gridType = initialArguments.gridType || (this.supportedTypes.length && this.supportedTypes[0]) || 'Parts';
			// creating new HtmlStructure
			targetNode.innerHTML = this.generateWorkbenchControlHtml({title: initialArguments.title});
			this.domNode = targetNode.firstChild;

			// new control initialization
			parser.parse(this.domNode);

			this.uiControls = {
				toolbar: null,
				grid: null,
				container: dijit.getEnclosingWidget(this.domNode),
				handlers: []
			};
			var controlOptions = {connectId: 'WorkbenchToolbar' + this.idPrefix};
			var controlFactory = this.clientControlsFactory;
			controlFactory.createControl('Aras.Client.Controls.Public.Toolbar', controlOptions, function(toolbarControl) {
				controlFactory.on(toolbarControl, {
					onClick: this.toolbarEventHandler.bind(this),
					onChange: this.toolbarEventHandler.bind(this)
				});

				this.uiControls.toolbar = toolbarControl;
				this.uiControls.handlers.push(aspect.after(this.uiControls.container, 'resize', function() {
					this.uiControls.toolbar.RefreshToolbar_Experimental();
				}.bind(this)));

				toolbarControl.loadXml(this.aras.getI18NXMLResource('workbenchToolbar.xml', this.aras.getBaseURL() + '/Modules/aras.innovator.solutions.MPP/'));
				toolbarControl.show();

				// init supported types list
				var typeSelector = toolbarControl.getItem('item_types_list');

				for (var i = 0; i < this.supportedTypes.length; i++) {
					var typeName = this.supportedTypes[i];
					typeSelector.add(typeName, typeName === ' ' ? typeName : this.UIUtils.getResource('workbenchDropdown.' + typeName));
				}
			}.bind(this));

			// grid control creation
			controlFactory.createControl('MPP.UI.Workbench.WorkbenchGrid',
				{
					connectId: 'WorkbenchGrid' + this.idPrefix,
					canEdit_Experimental: function(rowId) {
						return false;
					},
					workbench: this,
					activeDnD: this.isEditable
				},
				function(gridControl) {
					aspect.after(gridControl, 'gridClick', this.onGridSelectItem.bind(this));

					if (!initialArguments.gridMultiselect) {
						gridControl.setMultiselect(false);
					}

					this.dndController.registerSource(gridControl);

					this.uiControls.grid = gridControl;
					this.initGrid(gridType);
				}.bind(this)
			);
		},

		onGridSelectItem: function() {
			this.refreshToolbar();
		},

		toolbarEventHandler: function(toolbarItem) {
			var toolbarItemId = toolbarItem.getId();
			var gridControl = this.uiControls.grid;
			var itemId, itemTypeName, modelItem, rowId, i;

			switch (toolbarItemId) {
				case 'add_items':
					var modelItemType = Enums.getModelTypeFromWorkbenchType(this.itemsType);

					itemTypeName = Enums.getItemTypeFromWorkbenchType(this.itemsType);

					this.UIUtils.showSearchDialog(itemTypeName, function(selectedItems) {
						if (selectedItems) {
							var elementFactory = this.datamodel.elementFactory;
							var addCandidates = [];
							var notPermittedItemIds = [];
							var itemNode;

							selectedItems = Array.isArray(selectedItems) ? selectedItems : (selectedItems.item ? [selectedItems.item.getAttribute('id')] : []);

							for (i = 0; i < selectedItems.length; i++) {
								itemId = selectedItems[i];
								itemNode = this.aras.getItemById(itemTypeName, itemId);

								if (itemNode) {
									modelItem = elementFactory.createElementFromItemNode(itemNode);
									if (modelItem.isBlocked()) {
										notPermittedItemIds.push(modelItem.Id());
									} else {
										addCandidates.push(modelItem);
									}
								}
							}

							// if user add part item, then additionally request mbom structure from server
							if (modelItemType === Enums.ModelItemTypes.Part && addCandidates.length) {
								var rootProcessPlan = this.datamodel.rootProcessPlan;
								var producedPart = rootProcessPlan && rootProcessPlan.getProducedPart();

								// additionally check if user selected produced part for current processPlan
								addCandidates = this.getPartMBomStructure(addCandidates, producedPart ? {producedPartId: producedPart.Id()} : {});
							}

							if (notPermittedItemIds.length) {
								this.aras.AlertError(this.UIUtils.getResource('warning.itemInsufficientPermissions') + '\n' + notPermittedItemIds.join(', '));
							}

							this.addModelItemsToGrid(addCandidates);
						}
					}.bind(this), {multiselect: true, dblclickclose: false});
					break;
				case 'view_item':
					rowId = gridControl.getSelectedId();
					itemId = gridControl.getUserData(rowId, 'itemId');

					if (itemId) {
						itemTypeName = Enums.getItemTypeFromWorkbenchType(this.itemsType);
						var showResult = this.aras.uiShowItem(itemTypeName, itemId);

						if (showResult === false) {
							this.aras.AlertError(this.aras.getResource('../Modules/aras.innovator.TDF', 'action.noitemfound'));
						}
					}
					break;
				case 'remove_items':
					var selectedItemIds = gridControl.getSelectedItemIds('|').split('|');

					if (selectedItemIds.length) {
						var additionalItems = this.getAdditionalItems(this.itemsType);
						var gridStore = gridControl.grid_Experimental.store;
						var isPartWorkbenchType = this.itemsType === 'Parts';
						var selectedIdsHash = {};
						for (i = 0; i < selectedItemIds.length; i++) {
							rowId = selectedItemIds[i];
							selectedIdsHash[rowId] = true;
						}

						for (i = 0; i < selectedItemIds.length; i++) {
							rowId = selectedItemIds[i];
							var storeItem = gridStore._itemsByIdentity[rowId];
							var isTopLevel = true;

							itemId = gridControl.getUserData(rowId, 'itemId');
							var partIdPath = [itemId];
							var parentRowId = gridStore.getValue(storeItem, 'parent');

							while (parentRowId) {
								if (selectedIdsHash[parentRowId]) {
									isTopLevel = false;
									break;
								} else {
									var parentItemId = gridControl.getUserData(parentRowId, 'itemId');
									partIdPath.push(parentItemId);

									storeItem = gridStore._itemsByIdentity[parentRowId];
									parentRowId = gridStore.getValue(storeItem, 'parent');
								}
							}

							if (isTopLevel) {
								if (partIdPath.length === 1) {
									itemId = isPartWorkbenchType ?
										gridControl.getUserData(rowId, 'bomId') || gridControl.getUserData(rowId, 'itemId') :
										partIdPath[0];

									delete additionalItems[itemId];
								} else {
									// reversing path, because it's direction 'child to parent'
									partIdPath.reverse();

									// remember root item
									var userData = storeItem.userData$Gm || {};
									itemId = isPartWorkbenchType ? userData.bomId || userData.itemId : partIdPath[0];
									var ownerModelItem = additionalItems[itemId];

									partIdPath.shift();

									// searching and removing child from root item
									modelItem = partIdPath.length === 1 ?
										ownerModelItem.getChildrenById(partIdPath[0])[0] :
										ownerModelItem.getChildByIdPath(partIdPath);

									if (modelItem) {
										modelItem.Parent.removeChildItem(modelItem);
									}
								}
							}
						}

						this.initGrid(this.itemsType, true);
					}
					break;
				case 'item_types_list':
					this.initGrid(toolbarItem.getSelectedItem());
					break;
				default:
					console.log('To be implemented.');
					break;
			}
		},

		generateWorkbenchControlHtml: function(templateOptions) {
			var titleText = templateOptions.title;

			return '<div data-dojo-type="dijit/layout/BorderContainer" id="WorkbenchContainer' + this.idPrefix +
				'" class="nonselectable" style="position:relative; padding:0px; width:100%; height:100%; overflow:hidden;" >' +
				(titleText ? '	<div id="WorkbenchTitle' + this.idPrefix + '" style="height:20px; background-color:#606060; padding:0px 0px 0px 10px;' +
				' line-height:20px; color:#FFFFFF;">' + titleText + '</div>' : '') +
				'	<div id="WorkbenchToolbar' + this.idPrefix + '" style="height:30px; padding:0px; width:100%; position: absolute;"></div>' +
				'	<div data-dojo-type="dijit/layout/ContentPane" data-dojo-props="region:\'center\'" id="WorkbenchGrid' + this.idPrefix +
				'" style="position:absolute; ' + (titleText ? 'top:49px;' : 'top:30px;') + 'bottom:0px; left:0px; right:0px; padding:0px;"></div>' +
				'</div>';
		},

		generateWorkbenchFrameHtml: function() {
			var frameSrc = this.aras.getBaseURL() + '/Modules/aras.innovator.solutions.MPP/Scripts/UI/Workbench/Workbench.html';

			return '<iframe id="workbenchFrame' + this.idPrefix + '" src="' + frameSrc + '" frameborder="0" style="width:100%; height:100%;">' +
				'</iframe>';
		},

		getGridHeader: function(gridType) {
			if (gridType) {
				var headerDescriptor = this.gridHeaders[gridType];

				if (!headerDescriptor) {
					var modelItemType = Enums.getModelTypeFromWorkbenchType(gridType);

					if (modelItemType === Enums.ModelItemTypes.Unknown) {
						headerDescriptor = '<table/>';
						this.gridHeaders[gridType] = headerDescriptor;
					} else {
						var requestItem = this.aras.newIOMItem('Method', 'mpp_getWorkbenchGridHeader');

						requestItem.setProperty('grid_type', gridType);
						requestItem = requestItem.apply();

						if (requestItem.isError()) {
							this.aras.AlertError(requestItem.getErrorString());
						} else {
							headerDescriptor = requestItem.getResult();
							this.gridHeaders[gridType] = headerDescriptor;
						}
					}
				}

				return headerDescriptor;
			}
		},

		getGridContent: function(gridType) {
			var additionalItems = this.getAdditionalItems(gridType);
			var resultContent = [];
			var itemId;

			for (itemId in additionalItems) {
				resultContent.push(this.buildGridItemFromModelItem(additionalItems[itemId]));
			}

			return resultContent;
		},

		getPartMBomStructure: function(targetItems, additionalOptions) {
			var resultItems = [];

			additionalOptions = additionalOptions || {};

			if (targetItems) {
				var requestItem = this.aras.newIOMItem('Part', 'mpp_GetWorkbenchPartStructure');
				var itemIds = [];

				targetItems = targetItems ? (Array.isArray(targetItems) ? targetItems : [targetItems]) : [];

				for (var i = 0; i < targetItems.length; i++) {
					itemIds.push(targetItems[i].Id());
				}

				requestItem.setProperty('part_ids', itemIds.join(','));
				requestItem = requestItem.apply();

				if (requestItem.isError()) {
					this.aras.AlertError(requestItem.getErrorString());
					return resultItems;
				}
				var foundPartsCount = requestItem.getItemCount();
				if (foundPartsCount > 0) {
					var partItemsHash = {};
					var firstItemsHash = {};
					var producedPartId = additionalOptions.producedPartId || 'noId';
					var partItemNode, partModelItem, partId, partBomId, sourceBomId, partLevel, sourceId,
						partItemData, bomItemsHash, firstBomItem, newBomItem;

					partItemNode = requestItem.node || requestItem.nodeList[0];

					while (partItemNode) {
						partItemNode.setAttribute('type', partConfig.part_it_name);
						partModelItem = this.datamodel.elementFactory.createElementFromItemNode(partItemNode);

						if (partModelItem) {
							partId = partModelItem.Id();
							partLevel = partModelItem.getProperty('level');
							partBomId = partModelItem.getProperty('bom_id');

							partItemsHash[partId] = partItemsHash[partId] || {};
							bomItemsHash = partItemsHash[partId];

							if (bomItemsHash[partBomId]) {
								partModelItem = bomItemsHash[partBomId].item;
							} else {
								firstBomItem = firstItemsHash[partId];

								if (firstBomItem) {
									newBomItem = {item: partModelItem, children: firstBomItem.children.slice(), childBomIds: {}};

									for (sourceBomId in firstBomItem.childBomIds) {
										newBomItem.childBomIds[sourceBomId] = true;
									}

									bomItemsHash[partBomId] = newBomItem;
								} else {
									newBomItem = {item: partModelItem, children: [], childBomIds: {}};

									firstItemsHash[partId] = newBomItem;
									bomItemsHash[partBomId] = newBomItem;
								}
							}

							sourceId = partModelItem.getProperty('source_part_id');
							bomItemsHash = partItemsHash[sourceId];

							if (bomItemsHash) {
								for (sourceBomId in bomItemsHash) {
									partItemData = bomItemsHash[sourceBomId];

									if (!partItemData.childBomIds[partBomId]) {
										partItemData.children.push(partModelItem);
										partItemData.childBomIds[partBomId] = true;
									}
								}
							}

							// for ProducedPart we should add first level childs instead of itself
							if ((partLevel === '0' && partId !== producedPartId) || (sourceId && (sourceId === producedPartId))) {
								resultItems.push(partModelItem);
							}
						}

						partItemNode = partItemNode.nextSibling;
					}

					// insert all found children into ChildItems
					for (partId in partItemsHash) {
						bomItemsHash = partItemsHash[partId];

						for (partBomId in bomItemsHash) {
							partItemData = bomItemsHash[partBomId];

							if (partItemData.children.length) {
								partItemData.item.ChildItems().initialize(partItemData.children);
							}
						}
					}
				}
			}

			return resultItems;
		},

		refreshToolbar: function() {
			if (this.uiControls) {
				var gridControl = this.uiControls.grid;
				var toolbarControl = this.uiControls.toolbar;
				var selectedItemIds = gridControl.getSelectedItemIds('|').split('|');
				var allToolbarItems = toolbarControl.getButtons('|').split('|');
				var toolbarItem, toolbarItemId, i;

				selectedItemIds = selectedItemIds.length > 1 || Boolean(selectedItemIds[0]) ? selectedItemIds : [];

				for (i = 0; i < allToolbarItems.length; i++) {
					toolbarItemId = allToolbarItems[i];
					toolbarItem = toolbarControl.getItem(toolbarItemId);

					switch (toolbarItemId) {
						case 'view_item':
							toolbarItem.setEnabled(selectedItemIds.length === 1);
							break;
						case 'remove_items':
							toolbarItem.setEnabled(selectedItemIds.length > 0);
							break;
						case 'explode':
							toolbarItem.setEnabled(false);
							break;
						default:
							break;
					}
				}
			}
		},

		saveGridExpandState: function(gridType) {
			var gridControl = this.uiControls && this.uiControls.grid;

			if (gridControl && gridType) {
				var gridStore = gridControl.grid_Experimental.store;
				var openedRowIds = gridControl.getOpenedItems();
				var expandStates = {};
				var rowId, itemId, storeItem, currentBranch, parentRowId, isValidState, i;

				for (i = 0; i < openedRowIds.length; i++) {
					rowId = openedRowIds[i];
					itemId = gridControl.getUserData(rowId, 'itemId');

					if (itemId) {
						storeItem = gridStore._itemsByIdentity[rowId];
						expandStates[itemId] = expandStates[itemId] || {};
						isValidState = true;

						currentBranch = expandStates[itemId];
						parentRowId = gridStore.getValue(storeItem, 'parent');

						while (parentRowId) {
							storeItem = gridStore._itemsByIdentity[parentRowId];

							if (storeItem) {
								itemId = gridControl.getUserData(parentRowId, 'itemId');

								currentBranch[itemId] = currentBranch[itemId] || {};
								currentBranch = currentBranch[itemId];

								parentRowId = gridStore.getValue(storeItem, 'parent');
							} else {
								isValidState = false;
								break;
							}
						}

						if (isValidState) {
							currentBranch.expanded = true;
						}
					}
				}

				this.expandStates[gridType] = expandStates;
			}
		},

		applyExpandState: function(targetItems, gridType) {
			var expandedItems = this.expandStates[gridType];

			if (targetItems && targetItems.length && expandedItems) {
				var currentItem, parentItem, itemId, parentItemId, i;

				for (i = 0; i < targetItems.length; i++) {
					currentItem = targetItems[i];
					itemId = currentItem.userdata && currentItem.userdata.itemId;

					if (expandedItems[itemId]) {
						parentItem = currentItem.parent;
						var currentBranch = expandedItems[itemId];
						var isBranchFound = true;

						while (parentItem) {
							parentItemId = parentItem.userdata && parentItem.userdata.itemId;

							if (!currentBranch[parentItemId]) {
								isBranchFound = false;
								break;
							}

							currentBranch = currentBranch[parentItemId];
							parentItem = parentItem.parent;
						}

						if (isBranchFound && currentBranch.expanded) {
							currentItem.expanded = 'true';
						}
					}

					this.applyExpandState(currentItem.children, gridType);
				}
			}
		},

		initGrid: function(gridType, forceInit) {
			var gridControl = this.uiControls && this.uiControls.grid;

			if (gridControl && gridType && (gridType !== this.itemsType || forceInit)) {
				var headerDescriptor = this.getGridHeader(gridType);

				if (headerDescriptor) {
					var rowItems;

					this.saveGridExpandState(this.itemsType);
					this.itemsType = gridType;

					// new grid structure should be setted before decorateRowItemsBeforeAdd method call
					gridControl.initXML(headerDescriptor);

					// content generation should follow save expand state to properly expand nodes
					// if user reloads same grid type
					rowItems = this.getGridContent(gridType);

					// should be called before decorateRowItemsBeforeAdd to set expanded flag on items
					this.applyExpandState(rowItems, gridType);

					// explicitly enum item to avoid base enumerator usage from GridModules
					gridControl.idGenerator.drop();
					gridControl.enumerateItems(rowItems);
					rowItems = gridControl.decorateRowItemsBeforeAdd(rowItems, '', '');

					// add items to grid
					for (var i = 0; i < rowItems.length; i++) {
						gridControl.items_Experimental.add(rowItems[i], '');
					}
					gridControl.grid_Experimental.render();
				}

				this.refreshToolbar();
			}
		}
	});
});
