define([
	'dojo/_base/declare',
	'MPP/UI/Utils/UIUtils',
	'MPP/Model/ModelEnums'
],
function(declare, UIUtils, Enums) {
	var waitPromises = {};
	var statusId;

	return declare('Aras.Client.Controls.MPP.UI.BOMGridCommon', null, {
		_grid: null,
		_columnIndexByName: {},
		_isHeaderCreated: false,
		_eventHandlers: null,
		controlsFactory: null,
		producedPartId: null,
		producedPartIsPhantom: null,
		datamodel: null,
		data: null,
		uiUtils: null,
		_expandedConsumedIds: null,
		
		//Modify by tengz
		constructor: function(initialArguments) {
			var initialData = initialArguments.data;

			this.aras = initialArguments.aras;
			this.datamodel = initialArguments.datamodel;
			this.controlsFactory = initialArguments.controlsFactory;

			this.itemToRequest = this.aras.newIOMItem('Part', 'bcs_mpp_GetTestWorkHourTreeGrid');
			this._eventHandlers = [];
			this._expandedConsumedIds = [];
			this.uiUtils = new UIUtils({aras: this.aras});

			if (initialData) {
				this.data = initialData;
				this.refreshItemsUidHash();
			}

			this.attachDataModelListeners();
		},

		attachDataModelListeners: function() {
		},

		removeDataModelListeners: function() {
			this.datamodel.removeEventListeners(this);
		},

		dropStashedData: function(dataType) {
			if (this.data) {
				switch (dataType) {
					case 'mbom':
						this.data.mbomItems = null;
						this.data.mbomItemsByUid = {};
						this.data.isPartlyLoaded = true;
						break;
					case 'ebom':
						this.data.ebomItems = null;
						this.data.ebomItemsByUid = {};
						this.data.isPartlyLoaded = true;
						break;
					default:
						this.data = null;
						break;
				}
			}
		},

		setRequestProperty: function(propertyName, propertyValue) {
			if (propertyName) {
				this.itemToRequest.setProperty(propertyName, propertyValue);
			}
		},

		removeEbomOnlyItems: function(targetItem) {
			var removedItems = [];

			if (targetItem) {
				var childItems = targetItem.children || [];
				var currentItem, i;

				for (i = childItems.length - 1; i >= 0; i--) {
					currentItem = childItems[i];

					if (currentItem.userdata.eonly === '1') {
						removedItems.unshift(childItems.splice(i, 1)[0]);
					}
				}
			}

			return removedItems;
		},
		
		//Modify by tengz
		refreshEnumerationIndex: function() {
			var bomData = this.data;
			var gridWidget = this._grid;

			if (bomData && gridWidget) {
				var maxIndex = 0;
				var itemIndex;

				for (itemIndex in bomData.testWorkHourItemsByUid) {
					itemIndex = parseInt(itemIndex);

					if (!isNaN(itemIndex)) {
						maxIndex = Math.max(itemIndex, maxIndex);
					}
				}

				for (itemIndex in bomData.ebomItemsByUid) {
					itemIndex = parseInt(itemIndex);

					if (!isNaN(itemIndex)) {
						maxIndex = Math.max(itemIndex, maxIndex);
					}
				}

				gridWidget.idGenerator.setStartIndex(maxIndex);
			}
		},

		updateReconciliationStatuses: function() {
			var activePromise = waitPromises.refreshStatuses;
			var rootMbomItem = this.data && this.data.mbomItems[0];
			var currentEbomOnlyItems, isEbomItemsRemoved;

			if (activePromise) {
				activePromise.isOutOfDate = true;
				isEbomItemsRemoved = activePromise.isEbomItemsRemoved;
			} else {
				statusId = this.aras.showStatusMessage('status', 'Updating reconciliation statuses', '../images/Progress.gif');

				currentEbomOnlyItems = this.removeEbomOnlyItems(rootMbomItem);
				isEbomItemsRemoved = Boolean(currentEbomOnlyItems.length);
			}

			this.setRequestProperty('post_mbom_json', JSON.stringify(this.data && this.data.mbomItems[0]));
			this.setRequestProperty('post_ebom_json', JSON.stringify(this.data && this.data.ebomItems[0]));

			activePromise = parent.ArasModules.soap(this.itemToRequest.node.xml, {async: true})
				.then(function(responceText) {
					if (activePromise.isOutOfDate) {
						return Promise.reject('Rejected. Request is out of date.');
					}

					var responceItem = this.aras.newIOMItem();

					responceItem.loadAML(responceText);
					return responceItem;
				}.bind(this))
				.then(function(responceItem) {
					var updatedMbomItems = this.parseJsonProperty(responceItem.getProperty('mbomDataJson'));
					var updatedEbomItems = this.parseJsonProperty(responceItem.getProperty('ebomDataJson'));
					var ebomOnlyItems = this.removeEbomOnlyItems(updatedMbomItems);
					var itemsByUid, updatedItemsHash, targetItem, sourceItem, uniqueId, sourceUserData, propertyName;

					// refreshing mbom items
					itemsByUid = this.data.mbomItemsByUid;
					updatedItemsHash = this.itemStructureToIdHash(updatedMbomItems);

					for (uniqueId in itemsByUid) {
						targetItem = itemsByUid[uniqueId];
						sourceItem = updatedItemsHash[uniqueId];

						if (sourceItem) {
							sourceUserData = sourceItem.userdata;
							targetItem.fields = sourceItem.fields.slice();

							for (propertyName in sourceUserData) {
								targetItem.userdata[propertyName] = sourceUserData[propertyName];
							}
						}
					}

					if (ebomOnlyItems.length) {
						this._grid.enumerateItems(ebomOnlyItems, true);
						rootMbomItem.children = rootMbomItem.children.concat(ebomOnlyItems);
					}

					// refreshing ebom items
					itemsByUid = this.data.ebomItemsByUid;
					updatedItemsHash = this.itemStructureToIdHash(updatedEbomItems);

					for (uniqueId in itemsByUid) {
						targetItem = itemsByUid[uniqueId];
						sourceItem = updatedItemsHash[uniqueId];

						if (sourceItem) {
							sourceUserData = sourceItem.userdata;
							targetItem.fields = sourceItem.fields.slice();
						}

						for (propertyName in sourceUserData) {
							targetItem.userdata[propertyName] = sourceUserData[propertyName];
						}
					}

					delete waitPromises.refreshStatuses;
					this.aras.clearStatusMessage(statusId);

					return {ebomOnlyItemsExist: Boolean(isEbomItemsRemoved || ebomOnlyItems.length)};
				}.bind(this))
				.catch(function(xhr) {
					if (!activePromise.isOutOfDate) {
						var itemError = this.aras.newIOMItem();

						itemError.loadAML(xhr.responseText);

						this.aras.AlertError(itemError);
						this.aras.clearStatusMessage(statusId);
					}
				}.bind(this));

			activePromise.isEbomItemsRemoved = isEbomItemsRemoved;
			waitPromises.refreshStatuses = activePromise;

			this.setRequestProperty('post_mbom_json', '');
			this.setRequestProperty('post_ebom_json', '');

			return activePromise;
		},

		parseJsonProperty: function(propertyValue) {
			if (propertyValue) {
				var parseResult;

				// trying to parse data
				try {
					parseResult = JSON.parse(propertyValue);
				} catch (ex) {
					this.aras.AlertError(ex);
				}

				return parseResult;
			}
		},

		setFieldValuesFromItems: function(targetFields, sourceItems, isRecursiveCall) {
			targetFields = targetFields ? (Array.isArray(targetFields) ? targetFields : [targetFields]) : [];
			sourceItems = sourceItems ? (Array.isArray(sourceItems) ? sourceItems : [sourceItems]) : [];

			if (targetFields.length && sourceItems.length) {
				var gridControl = this._grid;
				var gridStoreItemsById = gridControl.grid_Experimental.store._itemsByIdentity;
				var fieldIndexes = {};
				var storeItem, sourceItem, sourceValue, fieldName, fieldIndex, itemId, i, j;

				for (i = 0; i < targetFields.length; i++) {
					fieldName = targetFields[i];
					fieldIndexes[fieldName] = gridControl.getColumnIndex(fieldName);
				}

				for (i = 0; i < sourceItems.length; i++) {
					sourceItem = sourceItems[i];

					if (sourceItem.fields) {
						itemId = sourceItem.uniqueId || sourceItem.id;
						storeItem = itemId && gridStoreItemsById[itemId];

						if (storeItem) {
							for (j = 0; j < targetFields.length; j++) {
								fieldName = targetFields[j];

								if (storeItem[fieldName]) {
									fieldIndex = fieldIndexes[fieldName];
									sourceValue = sourceItem.fields[fieldIndex];

									if (sourceValue !== undefined) {
										storeItem[fieldName][0] = sourceValue;
									}
								}
							}
						}
					}

					if (sourceItem.children) {
						this.setFieldValuesFromItems(targetFields, sourceItem.children, true);
					}
				}

				if (!isRecursiveCall) {
					gridControl.grid_Experimental.render();
				}
			}
		},

		setUserDataFromItems: function(sourceItems, targetProperties, updateGrid, isRecursiveCall) {
			sourceItems = sourceItems ? (Array.isArray(sourceItems) ? sourceItems : [sourceItems]) : [];

			if (sourceItems.length) {
				var gridControl = this._grid;
				var gridStoreItemsById = gridControl.grid_Experimental.store._itemsByIdentity;
				var sourceUserData, targetUserData, copyProperties, storeItem, sourceItem, propertyName, itemId, i;

				if (targetProperties) {
					if (Array.isArray(targetProperties)) {
						targetProperties = targetProperties.reduce(function(result, item) {
							result[item] = true;
							return result;
						});
					}
				}

				for (i = 0; i < sourceItems.length; i++) {
					sourceItem = sourceItems[i];
					sourceUserData = sourceItem.userdata;

					if (sourceUserData) {
						itemId = sourceItem.uniqueId || sourceItem.id;
						storeItem = itemId && gridStoreItemsById[itemId];
						copyProperties = targetProperties || sourceUserData;

						if (storeItem) {
							targetUserData = storeItem.userData$Gm;

							if (!targetUserData) {
								targetUserData = [];
								storeItem.userData$Gm = targetUserData;
							}

							for (propertyName in copyProperties) {
								targetUserData[propertyName] = sourceUserData[propertyName];
							}
						}
					}

					if (sourceItem.children) {
						this.setUserDataFromItems(sourceItem.children, targetProperties, updateGrid, true);
					}
				}

				if (updateGrid && !isRecursiveCall) {
					this._grid.updateRenderedRows();
				}
			}
		},

		destroy: function() {
			if (this._grid) {
				var promiseName, itemId, activePromise, i;
				var gridWidget = this._grid.grid_Experimental;

				this._rememberExpanded();

				for (itemId in gridWidget.openedExpandos) {
					delete gridWidget.openedExpandos[itemId];
				}

				this._grid.destroy();
				this._grid.destroy_Experimental();

				// remove attached handlers
				for (i = 0; i < this._eventHandlers.length; i++) {
					this._eventHandlers[i].remove();
				}

				for (promiseName in waitPromises) {
					activePromise = waitPromises[promiseName];
					activePromise.isOutOfDate = true;
				}

				this._eventHandlers = [];
				this._isHeaderCreated = false;
				this._grid = null;
			}
		},

		containsPart: function(partId) {
			var gridControl = this._grid;

			if (gridControl) {
				var ids = gridControl.items_Experimental.getAllId();

				for (var i = 0; i < ids.length; i++) {
					if (partId === gridControl.getUserData(ids[i], 'id')) {
						return true;
					}
				}
			}
		},

		expandRows: function(targetIds) {
			targetIds = targetIds ? (Array.isArray(targetIds) ? targetIds : [targetIds]) : [];

			if (targetIds.length) {
				var gridWidget = this._grid.grid_Experimental;
				var gridView = gridWidget.views.views[0];
				var rowId, i;

				for (i = 0; i < targetIds.length; i++) {
					rowId = targetIds[i];
					rowId = typeof rowId === 'string' ? rowId : rowId.uniqueId;

					if (!gridWidget.openedExpandos[rowId]) {
						var expandoWidget = gridView._expandos[rowId];

						if (expandoWidget) {
							expandoWidget.setOpen(true);
							gridWidget.openedExpandos[rowId] = true;
						}
					}
				}
			}
		},

		getPartPathByRowId: function(rowId) {
			var gridControl = this._grid;
			var partPath = [];
			var currentPartId = gridControl.getUserData(rowId, 'id');

			if (currentPartId) {
				var parentId = gridControl.getParentId(rowId);

				partPath.push(currentPartId);

				while (parentId) {
					partPath.push(gridControl.getUserData(parentId, 'id'));
					parentId = gridControl.getParentId(parentId);
				}

				partPath.reverse();
			}

			return partPath;
		},

		itemStructureToArray: function(targetItems, resultArray) {
			targetItems = targetItems ? (Array.isArray(targetItems) ? targetItems : [targetItems]) : [];
			resultArray = resultArray || [];

			if (targetItems.length) {
				var currentItem, i;

				for (i = 0; i < targetItems.length; i++) {
					currentItem = targetItems[i];
					resultArray.push(currentItem);

					if (currentItem.children) {
						this.itemStructureToArray(currentItem.children, resultArray);
					}
				}
			}

			return resultArray;
		},

		itemStructureToIdHash: function(targetItems, resultHash) {
			targetItems = targetItems ? (Array.isArray(targetItems) ? targetItems : [targetItems]) : [];
			resultHash = resultHash || {};

			if (targetItems.length) {
				var currentItem, itemId, i;

				for (i = 0; i < targetItems.length; i++) {
					currentItem = targetItems[i];
					itemId = currentItem.id || currentItem.uniqueId;
					resultHash[itemId] = currentItem;

					if (currentItem.children) {
						this.itemStructureToIdHash(currentItem.children, resultHash);
					}
				}
			}

			return resultHash;
		},

		getRowIdByPartPath: function(partIdPath, searchItemList) {
			if (partIdPath) {
				var gridStore = this._grid.grid_Experimental.store;
				var searchPartId, storeItem, foundPartId, partId, i;

				searchItemList = searchItemList || gridStore._arrayOfAllItems;
				partIdPath = Array.isArray(partIdPath) ? partIdPath.slice() : [partIdPath];
				searchPartId = partIdPath.shift();

				for (i = 0; i < searchItemList.length; i++) {
					storeItem = searchItemList[i];
					partId = storeItem.userData$Gm && storeItem.userData$Gm.id;

					if (partId === searchPartId) {
						foundPartId = partIdPath.length ? this.getRowIdByPartPath(partIdPath, storeItem.children) : storeItem.uniqueId[0];

						if (foundPartId) {
							return foundPartId;
						}
					}
				}
			}
		},

		onDataChanged: function() {
		},

		getMBomItemsByUserData: function(parameterName, parameterValue) {
			var foundItems = [];

			if (parameterName && this.data) {
				var itemsByUid = this.data.mbomItemsByUid;
				var currentItem, itemUid;

				for (itemUid in itemsByUid) {
					currentItem = itemsByUid[itemUid];

					if (currentItem.userdata[parameterName] === parameterValue) {
						foundItems.push(currentItem);
					}
				}
			}

			return foundItems;
		},
		
		//Add by tengz
		getMBomItemByUserData: function(parameterName, parameterValue) {
			if (parameterName && this.data) {
				var itemsByUid = this.data.testWorkHourItemsByUid;
				var currentItem, itemUid;

				for (itemUid in itemsByUid) {
					currentItem = itemsByUid[itemUid];

					if (currentItem.userdata[parameterName] === parameterValue) {
						return currentItem;
					}
				}
			}

			return null;
		},
		
		//Modify by tengz
		getMbomItemPropertyNames: function(modelItem) {
			//tengz
			if(modelItem)
			{
				var modelItemType = modelItem.getType();
				var propertyNames = [];
				// searching ConsumedParts in sourceModelItem and corresponding MbomItems
				switch (modelItemType) {
					case Enums.ModelItemTypes.ProcessPlan:
						
						break;
					case Enums.ModelItemTypes.Operation:
						propertyNames.push("sort_order");
						propertyNames.push("name");
						propertyNames.push("bcs_hours");
						break;
					case Enums.ModelItemTypes.OperationTest:
						propertyNames.push("item_number");
						propertyNames.push("name");
						propertyNames.push("bcs_hours");
						break;
					default:
						break;
				}
				return propertyNames;
			}
			// if (this.data) {
				// var propertyNames = this.data.mbomItemPropertyNames;

				// if (!propertyNames) {
					// var mbomGridHeader = this.data.mbomGridHeader;
					// var headerXml = new XmlDocument();
					// var columnNodes, currentNode, i;

					// propertyNames = [];

					// headerXml.loadXML(mbomGridHeader);
					// columnNodes = headerXml.selectNodes('//column');

					// for (i = 0; i < columnNodes.length; i++) {
						// currentNode = columnNodes[i];
						// propertyNames.push(currentNode.getAttribute('colname'));
					// }

					// this.data.mbomItemPropertyNames = propertyNames;
				// }

				// return propertyNames;
			// }

			return [];
		},
		
		//Modify by tengz
		createMBomItemFromModelItem: function(modelItem) {
			if (modelItem) {
				var processPlanModelItem = this.datamodel.getParentProcessPlan(modelItem);
				var partModelItem;
				var operationModelItem;
				var userData;
				var propertys;
				if(modelItem.getType()==Enums.ModelItemTypes.Operation)
				{
					partModelItem=modelItem;
					operationModelItem=modelItem;
					userData = {
						id: partModelItem.Id(),
						// ocid: modelItem.Id(),
						// oid: operationModelItem ? operationModelItem.Id() : '',
						pid: processPlanModelItem ? processPlanModelItem.Id() : ''
						// cpid: modelItem.getRelatedProcessPlanId() || '',
						// buy: partModelItem.getProperty('make_buy', '').toLowerCase() === 'buy' ? '1' : '',
						// gen: partModelItem.isNew() ? 1 : partModelItem.getProperty('generation', 1),
						// rev: partModelItem.getProperty('major_rev', ''),
						// conf: partModelItem.isNew() ? partModelItem.Id() : partModelItem.getProperty('config_id', ''),
						// level: 0
					};
					propertys={
						uniqueId:this.data.uniqueId++,
						expanded:"true",
						icon:"../images/ProcessOperation.svg",
						expandedIcon:"../images/ProcessOperation.svg"
					};
				}
				else
				{
					partModelItem= modelItem.getRelatedItem();
					operationModelItem = modelItem.Parent;
					userData = {
						id: partModelItem.Id(),
						ocid: modelItem.Id(),
						oid: operationModelItem ? operationModelItem.Id() : ''
						// pid: processPlanModelItem ? processPlanModelItem.Id() : ''
						// cpid: modelItem.getRelatedProcessPlanId() || '',
						// buy: partModelItem.getProperty('make_buy', '').toLowerCase() === 'buy' ? '1' : '',
						// gen: partModelItem.isNew() ? 1 : partModelItem.getProperty('generation', 1),
						// rev: partModelItem.getProperty('major_rev', ''),
						// conf: partModelItem.isNew() ? partModelItem.Id() : partModelItem.getProperty('config_id', ''),
						// level: 0
					};
					propertys={
						uniqueId:this.data.uniqueId++,
						expanded:"true",
						icon:"../images/ViewWorkflow.svg",
						expandedIcon:"../images/ViewWorkflow.svg"
					};
				}
				
				var fieldsData = [];
				var propertyNames = this.getMbomItemPropertyNames(modelItem);
				var fieldName, fieldValue, i;

				for (i = 0; i < propertyNames.length; i++) {
					fieldName = propertyNames[i];
					
					switch (fieldName) {
						case 'c_item_number_mbom':
							fieldValue = partModelItem.getProperty('item_number', '');
							break;
						case 'c_name':
							fieldValue = partModelItem.getProperty('name', '');
							break;
						case 'c_classification':
							fieldValue = partModelItem.getProperty('classification', '');
							break;
						case 'c_quantity':
							fieldValue = modelItem.getProperty('quantity', '');
							break;
						case 'c_oper_sort_order':
							fieldValue = operationModelItem ? operationModelItem.getProperty('sort_order', '') : '';
							break;
						case 'c_planned':
							fieldValue = Boolean(userData.cpid);
							break;
						default:
							fieldValue = partModelItem.getProperty(fieldName, '');
							break;
					}

					fieldsData.push(fieldValue);
				}
				
				propertys.userdata=userData;
				propertys.fields= fieldsData;
				return propertys;
			}
		},
		
		//Modify by tengz
		refreshItemsUidHash: function() {
			var bomData = this.data;

			if (bomData) {
				bomData.testWorkHourItemsByUid = this.itemStructureToIdHash(bomData.testWorkHourItems);
				// bomData.ebomItemsByUid = this.itemStructureToIdHash(bomData.ebomItems);
			}
		},
		
		//Modify by tengz
		loadNestedPlansIntoDataModel: function(optionalParameters) {
			var itemsByUid = (this.data && this.data.testWorkHourItemsByUid) || {};
			var registeredProcessPlans = this.datamodel.getRegisteredProcessPlans();
			var foundPlanIds = {};
			var processPlanId, itemUid, mbomItem, i;

			optionalParameters = optionalParameters || {};

			for (itemUid in itemsByUid) {
				mbomItem = itemsByUid[itemUid];
				processPlanId = mbomItem.userdata.cpid;

				if (processPlanId) {
					foundPlanIds[processPlanId] = true;
				}
			}

			delete foundPlanIds[this.datamodel.rootProcessPlan.Id()];

			for (i = 0; i < registeredProcessPlans.length; i++) {
				var processPlan = registeredProcessPlans[i];

				if (processPlan.isModified() || !optionalParameters.reloadExisting) {
					delete foundPlanIds[processPlan.Id()];
				}
			}

			var loadedProcessPlans = this.datamodel.loadProcessPlans(Object.keys(foundPlanIds));

			for (processPlanId in loadedProcessPlans) {
				this.datamodel.registerProcessPlan(loadedProcessPlans[processPlanId]);
			}
		},
		
		//Modify by tengz
		refreshFromModelItem: function(sourceModelItem) {
			if (sourceModelItem) {
				var processPlanModelItem = this.datamodel.getParentProcessPlan(sourceModelItem);
				var refreshCandidates = sourceModelItem.getChildrenByType('Operation');
				var processPlanItem = this.getMBomItemByUserData('id', processPlanModelItem.Id());
				var currentModelItem;
				var childItem,childItems,newchildItem,oldchildItem,itemId,newOperaiton,oldOperation,operationItem;
				for(var i=0;i<refreshCandidates.length;i++)
				{
					currentModelItem = refreshCandidates[i];
					itemId=currentModelItem.Id();
					oldOperation=this.getMBomItemByUserData('id',itemId);
					newOperaiton = this.createMBomItemFromModelItem(currentModelItem);
					if(currentModelItem.isNew()&&!oldOperation)
					{
						this._grid.enumerateItems(newOperaiton, true);
						if(processPlanItem.children)
						{
							processPlanItem.children.push(newOperaiton);
						}
						else
						{
							processPlanItem.children=[newOperaiton];
						}
						operationItem=newOperaiton;
					}
					else if(currentModelItem.isDeleted())
					{
						for (var k = processPlanItem.children.length - 1; k >= 0; k--) {
							childItem = processPlanItem.children[k];

							if (childItem.userdata.id === itemId) {
								processPlanItem.children.splice(k, 1);
							}
						}
						continue;
					}
					else
					{
						oldOperation.fields=newOperaiton.fields;
						operationItem=oldOperation;
					}
					
					childItems=currentModelItem.getChildrenByItemType('mpp_OperationTest');
					for(var j=0;j<childItems.length;j++)
					{
						childItem=childItems[j];
						itemId=childItem.Id();
						newchildItem=this.createMBomItemFromModelItem(childItem);
						oldchildItem=this.getMBomItemByUserData('ocid',itemId);
						if(childItem.isNew()&&!oldchildItem)
						{
							this._grid.enumerateItems(newchildItem, true);
							if(operationItem.children)
							{
								operationItem.children.push(newchildItem);
							}
							else
							{
								operationItem.children=[newchildItem];
							}
						}
						else if(childItem.isDeleted())
						{
							for (var k = operationItem.children.length - 1; k >= 0; k--) {
								childItem = operationItem.children[k];

								if (childItem.userdata.ocid === itemId) {
									operationItem.children.splice(k, 1);
								}
							}
							continue;
						}
						else
						{
							oldchildItem.fields=newchildItem.fields;
						}
					}
					
				}
				
				this.refreshItemsUidHash();
				this.initTree();
				//this.updateReconciliationStatuses();
				return;
			}
		}
	});
});
