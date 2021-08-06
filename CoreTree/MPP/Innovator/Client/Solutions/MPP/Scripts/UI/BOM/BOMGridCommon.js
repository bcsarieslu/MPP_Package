define([
	'dojo/_base/declare',
	'MPP/UI/Utils/UIUtils',
	'MPP/Model/ModelEnums',
	'MPP/UI/Find/BOMGridExt',
	'MPP/Model/PartConfig'
],
function(declare, UIUtils, Enums, BOMGridExt, partConfig) {
	var waitPromises = {};
	var statusId;

	return declare('Aras.Client.Controls.MPP.UI.BOMGridCommon', [BOMGridExt], {
		_grid: null,
		_columnIndexByName: {},
		_isHeaderCreated: false,
		eventHandlers: null,
		controlsFactory: null,
		producedPartId: null,
		producedPartIsPhantom: null,
		datamodel: null,
		data: null,
		uiUtils: null,
		_expandedConsumedIds: null,

		constructor: function(initialArguments) {
			var initialData = initialArguments.data;

			this.aras = initialArguments.aras;
			this.datamodel = initialArguments.datamodel;
			this.controlsFactory = initialArguments.controlsFactory;

			this.itemToRequest = this.aras.newIOMItem('Part', 'mpp_GetBomTreeGrid');
			this.eventHandlers = [];
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

		refreshEnumerationIndex: function() {
			var bomData = this.data;
			var gridWidget = this._grid;

			if (bomData && gridWidget) {
				var maxIndex = 0;
				var itemIndex;

				for (itemIndex in bomData.mbomItemsByUid) {
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
				for (i = 0; i < this.eventHandlers.length; i++) {
					this.eventHandlers[i].remove();
				}

				for (promiseName in waitPromises) {
					activePromise = waitPromises[promiseName];
					activePromise.isOutOfDate = true;
				}

				this.eventHandlers = [];
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

		getMbomItemPropertyNames: function() {
			if (this.data) {
				var propertyNames = this.data.mbomItemPropertyNames;

				if (!propertyNames) {
					var mbomGridHeader = this.data.mbomGridHeader;
					var headerXml = new XmlDocument();
					var columnNodes, currentNode, i;

					propertyNames = [];

					headerXml.loadXML(mbomGridHeader);
					columnNodes = headerXml.selectNodes('//column');

					for (i = 0; i < columnNodes.length; i++) {
						currentNode = columnNodes[i];
						propertyNames.push(currentNode.getAttribute('colname'));
					}

					this.data.mbomItemPropertyNames = propertyNames;
				}

				return propertyNames;
			}

			return [];
		},

		createMBomItemFromModelItem: function(modelItem) {
			if (modelItem && modelItem.is('ConsumedPart')) {
				var processPlanModelItem = this.datamodel.getParentProcessPlan(modelItem);
				var partModelItem = modelItem.getRelatedItem();
				var operationModelItem = modelItem.Parent;
				var userData = {
					id: partModelItem.Id(),
					ocid: modelItem.Id(),
					oid: operationModelItem ? operationModelItem.Id() : '',
					pid: processPlanModelItem ? processPlanModelItem.Id() : '',
					cpid: modelItem.getRelatedProcessPlanId() || '',
					buy: partModelItem.getProperty(partConfig.make_buy_p_name, '').toLowerCase() === 'buy' ? '1' : '',
					gen: partModelItem.isNew() ? 1 : partModelItem.getProperty('generation', 1),
					rev: partModelItem.getProperty('major_rev', ''),
					conf: partModelItem.isNew() ? partModelItem.Id() : partModelItem.getProperty('config_id', ''),
					level: 0
				};
				var fieldsData = [];
				var propertyNames = this.getMbomItemPropertyNames();
				var fieldName, fieldValue, i;

				for (i = 0; i < propertyNames.length; i++) {
					fieldName = propertyNames[i];

					switch (fieldName) {
						case 'c_item_number_mbom':
							fieldValue = partModelItem.getProperty(partConfig.item_number_p_name, '');
							break;
						case 'c_name':
							fieldValue = partModelItem.getProperty(partConfig.name_p_name, '');
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
							fieldValue = '';
							break;
					}

					fieldsData.push(fieldValue);
				}

				return {
					userdata: userData,
					fields: fieldsData
				};
			}
		},

		refreshItemsUidHash: function() {
			var bomData = this.data;

			if (bomData) {
				bomData.mbomItemsByUid = this.itemStructureToIdHash(bomData.mbomItems);
				bomData.ebomItemsByUid = this.itemStructureToIdHash(bomData.ebomItems);
			}
		},

		loadNestedPlansIntoDataModel: function(optionalParameters) {
			var itemsByUid = (this.data && this.data.mbomItemsByUid) || {};
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

		refreshFromModelItem: function(sourceModelItem) {
			if (sourceModelItem) {
				var processPlanModelItem = this.datamodel.getParentProcessPlan(sourceModelItem);
				var parentMbomItems = this.getMBomItemsByUserData('cpid', processPlanModelItem.Id());
				var refreshCandidates = [];
				var existingMbomItems = [];
				var modelItemType = sourceModelItem.getType();

				// searching ConsumedParts in sourceModelItem and corresponding MbomItems
				switch (modelItemType) {
					case Enums.ModelItemTypes.ProcessPlan:
						refreshCandidates = sourceModelItem.getChildrenByType('ConsumedPart');
						existingMbomItems = this.getMBomItemsByUserData('pid', sourceModelItem.Id());
						break;
					case Enums.ModelItemTypes.Operation:
						refreshCandidates = sourceModelItem.getChildrenByType('ConsumedPart');
						existingMbomItems = this.getMBomItemsByUserData('oid', sourceModelItem.Id());
						break;
					case Enums.ModelItemTypes.ConsumedPart:
						refreshCandidates.push(sourceModelItem);
						break;
					default:
						break;
				}

				// if items were found, then update Mbom structure to correspond DataModel structure
				if (refreshCandidates.length || existingMbomItems.length) {
					var newMbomItemsHash = {};
					var modelItemsHash = {};
					var newPartIdHash = {};
					var currentModelItem, foundMbomItems, targetMbomItem, currentMbomItem,
						childItem, i, j, k, partId, itemStructureJson, itemId, childItems;

					for (i = refreshCandidates.length - 1; i >= 0; i--) {
						currentModelItem = refreshCandidates[i];

						if (currentModelItem.isBlocked()) {
							refreshCandidates.splice(i, 1);
						} else {
							itemId = currentModelItem.Id();
							modelItemsHash[itemId] = currentModelItem;
						}
					}

					// delete Mbom items, if they are currently removed from DataModel
					for (i = existingMbomItems.length - 1; i >= 0; i--) {
						currentMbomItem = existingMbomItems[i];
						itemId = currentMbomItem.userdata.ocid;
						currentModelItem = modelItemsHash[itemId];

						if (!currentModelItem || currentModelItem.isDeleted() || currentModelItem.isParentDeleted()) {
							for (j = 0; j < parentMbomItems.length; j++) {
								targetMbomItem = parentMbomItems[j];
								childItems = targetMbomItem.children || [];

								for (k = childItems.length - 1; k >= 0; k--) {
									childItem = childItems[k];

									if (childItem.userdata.ocid === itemId) {
										childItems.splice(k, 1);
									}
								}
							}

							existingMbomItems.splice(i, 1);
						}
					}

					// refresh existing Mbom items from DataModel items
					for (i = 0; i < refreshCandidates.length; i++) {
						currentModelItem = refreshCandidates[i];
						itemId = currentModelItem.Id();
						foundMbomItems = [];

						var sourceMbomItem = this.createMBomItemFromModelItem(currentModelItem);
						sourceMbomItem.userdata.level = 1;

						// search corresponding mbom items
						for (j = 0; j < existingMbomItems.length; j++) {
							currentMbomItem = existingMbomItems[j];

							if (currentMbomItem.userdata.ocid === itemId) {
								foundMbomItems.push(currentMbomItem);
							}
						}

						// if item is new and not found in MBom, then it should be added
						if (currentModelItem.isNew() && !foundMbomItems.length) {
							newMbomItemsHash[sourceMbomItem.userdata.ocid] = sourceMbomItem;
							newPartIdHash[sourceMbomItem.userdata.id] = sourceMbomItem;
						} else {
							// in this case we should update only data
							for (j = 0; j < foundMbomItems.length; j++) {
								targetMbomItem = foundMbomItems[j];

								targetMbomItem.userdata.oid = sourceMbomItem.userdata.oid;
								targetMbomItem.fields = sourceMbomItem.fields.slice();
							}
						}
					}

					var newPartIds = Object.keys(newPartIdHash);

					// if new consumed parts were found, then
					if (newPartIds.length) {
						var requestItem = this.aras.newIOMItem('Part', 'mpp_GetBomTreeGrid');

						// setting separate 'post_mbom_json' property for items in request
						for (partId in newPartIdHash) {
							requestItem.setProperty('post_mbom_json_' + partId, JSON.stringify(newPartIdHash[partId]));
						}

						requestItem.setAttribute('idlist', newPartIds.join(','));
						requestItem.setProperty('get_mbom_node_without_reconc', 1);
						requestItem.setProperty('parent_part_id', parentMbomItems[0].userdata.id);
						requestItem.setProperty('get_only_rows', 1);
						requestItem = requestItem.apply();

						var responceItemsCount = requestItem.isError() ? 0 : requestItem.getItemCount();

						if (responceItemsCount && responceItemsCount === newPartIds.length) {
							var responceJsonHash = {};

							foundMbomItems = this.getMBomItemsByUserData('cpid', processPlanModelItem.Id());

							for (i = 0; i < responceItemsCount; i++) {
								var resultItem = requestItem.getItemByIndex(i);
								partId = resultItem.getId();
								responceJsonHash[partId] = resultItem.getProperty('mbomDataJson');
							}

							for (var consumedPartId in newMbomItemsHash) {
								currentMbomItem = newMbomItemsHash[consumedPartId];
								partId = currentMbomItem.userdata.id;

								if (responceJsonHash[partId]) {
									var mbomItemFromResponce = this.parseJsonProperty(responceJsonHash[partId]);
									mbomItemFromResponce.userdata.ocid = currentMbomItem.userdata.ocid;
									mbomItemFromResponce.fields = currentMbomItem.fields;

									itemStructureJson = JSON.stringify(mbomItemFromResponce);
								} else {
									itemStructureJson = JSON.stringify(currentMbomItem);
								}

								//insert part structure into all target items
								for (j = 0; j < foundMbomItems.length; j++) {
									targetMbomItem = foundMbomItems[j];
									childItems = targetMbomItem.children;

									if (!childItems) {
										childItems = [];
										targetMbomItem.children = childItems;
									}

									var newMBomItems = this.parseJsonProperty(itemStructureJson);
									this._grid.enumerateItems(newMBomItems, true);

									childItems.push(newMBomItems);
								}
							}
						}
					}

					this.refreshItemsUidHash();
					this.initTree();
					this.updateReconciliationStatuses();
				}
			}
		}
	});
});
