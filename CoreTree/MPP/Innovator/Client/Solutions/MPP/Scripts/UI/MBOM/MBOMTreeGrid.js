define([
	'dojo/_base/declare',
	'MPP/UI/ProcessPlan/DnD/DndSourceTarget/DndTarget',
	'dojo/_base/connect',
	'MPP/UI/BOM/BOMGridCommon',
	'MPP/Model/ModelEnums',
	'MPP/Model/PartConfig'
],
function(declare, DndTarget, connect, BOMGridCommon, Enums, partConfig) {
	var connectId = 'mbom_grid';

	return declare('Aras.Client.Controls.MPP.MBOMGrid', [DndTarget, BOMGridCommon], {
		waitTearoffWindows: null,
		isEditable: null,

		constructor: function(initialArguments) {
			var dragController = initialArguments.dragController;

			this.waitTearoffWindows = {};
			this.isEditable = this.datamodel.isEditable();

			if (dragController) {
				dragController.registerTarget(this);
			}
		},

		attachDataModelListeners: function() {
			this.datamodel.addEventListener(this, null, 'onDeleteItem', this.onDeleteModelItemHandler);
		},

		onDeleteModelItemHandler: function(modelItem) {
			if (modelItem && modelItem.is('ConsumedPart')) {
				var processPlanModelItem = this.datamodel.getParentProcessPlan(modelItem);
				var parentMbomItems = this.getMBomItemsByUserData('cpid', processPlanModelItem.Id());
				var consumedPartId = modelItem.Id();
				var wasDeleted = false;
				var rowIdsToUpdateConflicts = [];

				for (var i = 0; i < parentMbomItems.length; i++) {
					var targetMbomItem = parentMbomItems[i];
					var childItems = targetMbomItem.children || [];

					for (var j = childItems.length - 1; j >= 0; j--) {
						var childItem = childItems[j];
						if (childItem.userdata.ocid === consumedPartId) {
							var rowId = childItem.id || childItem.uniqueId;
							rowIdsToUpdateConflicts.push(rowId);

							childItems.splice(j, 1);
							wasDeleted = true;
						}
					}
				}

				if (wasDeleted) {
					this.refreshItemsUidHash();
					this.initTree();
					this.updateReconciliationStatuses();

					this.onDataChanged();

					this.removeGlyphForSeveralRows(rowIdsToUpdateConflicts);
				}
			}
		},

		dragEnter: function(dndEvent) {
			if (this.isRegistered()) {
				var dragController = this.dndData.controller;
				var dragData = dragController.getDragData();

				if (typeof dragData === 'object' && dragData.dataType === 'WorkbenchItem') {
					this.dndData.dragData = dragData;
				}
			}
		},

		dragOver: function(dndEvent) {
			dndEvent.preventDefault();

			if (this.dndData.dragData) {
				var gridWidget = this._grid.grid_Experimental;
				var gridView = gridWidget.views.views[0];

				var previousPosition = this.dndData.dropboxData;
				gridView.content.decorateEvent(dndEvent);

				// if cursor above the row
				if (dndEvent.rowNode) {
					var isAboveExpando = dndEvent.target.className.indexOf('dojoxGridExpandoNode') !== -1;
					var treeItem = gridWidget.getItem(dndEvent.rowIndex);

					if (isAboveExpando) {
						var expandoWidget = gridView._expandos[treeItem.uniqueId];
						var isOpened = gridWidget._treeCache.items[dndEvent.rowIndex].opened;

						// expand row, if it was collapsed
						if (expandoWidget && !isOpened) {
							this.cleanupDropbox();

							expandoWidget.setOpen(true);
						}
					} else {
						var dropboxData = this.searchDropPosition(dndEvent);

						if (dropboxData) {
							if (!previousPosition || (dropboxData.item !== previousPosition.item || dropboxData.action !== previousPosition.action)) {
								var dropboxCssClass = '';
								if (dropboxData.isValid) {
									dropboxCssClass += 'dragOverRowValid';
									dropboxCssClass += dropboxData.action === 'insert' ? ' insertDropbox' : ' addDropbox';
								} else {
									dropboxCssClass += 'dragOverRowInvalid';
								}
								this.drawDropbox(dropboxData, dropboxCssClass);
							}
						} else {
							this.cleanupDropbox();
						}
					}
				} else if (previousPosition) {
					this.cleanupDropbox();
				}
			}
		},

		searchDropPosition: function(dndEvent) {
			var gridWidget = this._grid.grid_Experimental;
			var gridView = gridWidget.views.views[0];
			var treeItem = gridWidget.getItem(dndEvent.rowIndex);

			if (treeItem) {
				var childItemCount = treeItem.children ? treeItem.children.length : 0;
				var isExpanded = childItemCount ? gridWidget._treeCache.items[dndEvent.rowIndex].opened : false;
				var isDropAllowed = treeItem.userData$Gm.comp !== '1';
				var dropNode, dropAction, dropMessage;

				// determine target domNode
				if (isExpanded) {
					var currentItem = treeItem;

					while (currentItem && gridWidget.openedExpandos[currentItem.uniqueId[0]]) {
						childItemCount = currentItem.children ? currentItem.children.length : 0;

						if (childItemCount) {
							currentItem = currentItem.children[childItemCount - 1];
							continue;
						}

						break;
					}

					dropNode = gridView.getRowNode(gridWidget.getItemIndex(currentItem));
				} else {
					dropNode = dndEvent.rowNode;
				}

				// adding dropMessage and dropAction to result
				if (isDropAllowed) {
					if (isExpanded) {
						dropAction = 'add';
						dropMessage = this.uiUtils.getResource('MBOMTreeGrid.insertItemInto', treeItem.c_item_number_mbom[0]);
					} else {
						dropAction = 'insert';
						dropMessage = this.uiUtils.getResource('MBOMTreeGrid.insertItemInto', treeItem.c_item_number_mbom[0]);
					}
				} else {
					dropMessage = this.uiUtils.getResource('MBOMTreeGrid.cantBeAddedToComponent');
				}

				return {
					item: treeItem,
					domNode: dropNode,
					action: dropAction,
					isValid: isDropAllowed,
					message: dropMessage
				};
			}

			return null;
		},

		dragEndTarget: function(dragSource, dndEvent) {
			this.inherited(arguments);
			this.cleanupDropbox();
		},

		drawDropbox: function(dropboxData, cssClass) {
			if (dropboxData) {
				var gridWidget = this._grid.grid_Experimental;
				var gridView = gridWidget.views.views[0];
				var contentHeight;

				this.cleanupDropbox();

				contentHeight = parseInt(gridView.contentNode.style.height);
				this.dndData.contentOriginHeight = contentHeight;
				gridView.contentNode.style.height = (contentHeight + 30) + 'px';

				if (dropboxData.message) {
					var tableNode = dropboxData.domNode.querySelector('.dojoxGridRowTable');

					tableNode.setAttribute('dropMessage', dropboxData.message);
					dropboxData.messageNode = tableNode;
				}

				// add css classes to dropNode
				dropboxData.cssClass = cssClass;
				this.toggleCssClass(dropboxData.domNode, cssClass, true);

				this.dndData.dropboxData = dropboxData;
			}
		},

		cleanupDropbox: function() {
			var dropboxData = this.dndData.dropboxData;

			if (dropboxData) {
				this.toggleCssClass(dropboxData.domNode, dropboxData.cssClass);

				if (this.dndData.contentOriginHeight) {
					var gridWidget = this._grid.grid_Experimental;
					var gridView = gridWidget.views.views[0];

					gridView.contentNode.style.height = this.dndData.contentOriginHeight + 'px';
					this.dndData.contentOriginHeight = null;
				}

				if (dropboxData.messageNode) {
					dropboxData.messageNode.removeAttribute('dropMessage');
				}

				this.dndData.dropboxData = null;
			}
		},

		drop: function(dndEvent) {
			var dropboxData = this.dndData.dropboxData;

			dndEvent.preventDefault();
			this.cleanupDropbox();

			if (dropboxData && dropboxData.isValid) {
				var dragData = this.dndData.dragData;

				if (dragData) {
					var targetItem = dropboxData.item;
					var parentItemId = targetItem.uniqueId[0];
					var dropItemId = dragData.itemIds[0];

					if (this.addPartItemToMBom(parentItemId, dragData.itemIds, {refreshGrid: true, refreshStatuses: true})) {
						var gridWidget = this._grid.grid_Experimental;

						// open parent item tree node
						this.expandRows(parentItemId);

						// select just-added item (in timeout because need to wait row sorting after "setOpen")
						setTimeout(function() {
							var parentItem = gridWidget.store._getItemByIdentity(parentItemId);

							if (parentItem) {
								var childItems = parentItem.children || [];
								var currentItem, i;

								for (i = childItems.length - 1; i >= 0; i--) {
									currentItem = childItems[i];

									if (currentItem.userData$Gm && currentItem.userData$Gm.id === dropItemId) {
										this._grid.setSelectedRow(currentItem.uniqueId, false, true);
										break;
									}
								}
							}
						}.bind(this), 0);
					}
				}
			}
		},

		toggleCssClass: function(/*domNode*/ targetNode, /*String*/ toggleClassName, /*Boolean*/ addClass) {
			if (targetNode && toggleClassName) {
				var toggleClasses = toggleClassName.split(' ');
				var i;

				for (i = 0; i < toggleClasses.length; i++) {
					if (addClass) {
						targetNode.classList.add(toggleClasses[i]);
					} else {
						targetNode.classList.remove(toggleClasses[i]);
					}
				}
			}
		},

		initTree: function(forceRequest, optionalParameters) {
			this.inherited(arguments);
			var bomData = this.data;
			var gridInitialDataXml, errorString, errorNotResolvedFull;

			optionalParameters = optionalParameters || {};

			if (this._grid) {
				this._rememberExpanded();
			} else {
				this.createTree();
			}

			this.itemToRequest.setID(this.producedPartId);
			this.itemToRequest.setProperty('is_phantom', this.producedPartIsPhantom ? '1' : '0');

			//Modify by tengz
			//在检验项目与工时定额页面切换Location后会导致重新实例化bomData变量,导致虽然bomData有值但mbomItems没值,所以这里要增加判断bomData.mbomItems
			//if (forceRequest || !bomData || bomData.isPartlyLoaded) {
			if (forceRequest || !bomData || bomData.isPartlyLoaded || !bomData.mbomItems) {
				if (this._expandedConsumedIds.length) {
					this.itemToRequest.setProperty('mbom_expanded_op_cons_ids', this._expandedConsumedIds.join('|'));
				} else {
					this.itemToRequest.setProperty('mbom_expanded_op_cons_ids', null);
				}

				if (bomData && bomData.isPartlyLoaded) {
					this.setRequestProperty('post_mbom_json', bomData.mbomItems ? JSON.stringify(bomData.mbomItems[0]) : '');
					this.setRequestProperty('post_ebom_json', bomData.ebomItems ? JSON.stringify(bomData.ebomItems[0]) : '');
				}

				parent.ArasModules.soap(this.itemToRequest.node.xml)
					.then(function(responceText) {
						var responceItem = this.aras.newIOMItem();
						var mbomItems, ebomItems;

						responceItem.loadAML(responceText);

						mbomItems = this.parseJsonProperty(responceItem.getProperty('mbomDataJson'));
						mbomItems = mbomItems ? (Array.isArray(mbomItems) ? mbomItems : [mbomItems]) : [];

						ebomItems = this.parseJsonProperty(responceItem.getProperty('ebomDataJson'));
						ebomItems = ebomItems ? (Array.isArray(ebomItems) ? ebomItems : [ebomItems]) : [];

						// explicitly enum item to avoid base enumerator usage from GridModules
						this._grid.idGenerator.drop();
						this._grid.enumerateItems(mbomItems);
						this._grid.enumerateItems(ebomItems);

						// if bomData exists, then replace current properties
						if (bomData) {
							bomData.mbomGridHeader = responceItem.getProperty('mbomGridHeader');
							bomData.ebomGridHeader = responceItem.getProperty('ebomGridHeader');
							bomData.mbomItems = mbomItems;
							bomData.ebomItems = ebomItems;

							bomData.isPartlyLoaded = false;
						} else {
							bomData = {
								mbomGridHeader: responceItem.getProperty('mbomGridHeader'),
								ebomGridHeader: responceItem.getProperty('ebomGridHeader'),
								mbomItems: mbomItems,
								ebomItems: ebomItems
							};

							this.data = bomData;
						}

						this.refreshItemsUidHash();
						this.loadNestedPlansIntoDataModel(optionalParameters.isViewReload ? undefined : {reloadExisting: true});

						errorString = responceItem.getProperty('execution_error');
						errorNotResolvedFull = responceItem.getProperty('error_not_resolved_full');
					}.bind(this))
					.catch(function(xhr) {
						var itemError = this.aras.newIOMItem();

						itemError.loadAML(xhr.responseText);
						this.aras.AlertError(itemError);
					});
			}

			gridInitialDataXml = bomData.mbomGridHeader;

			if (gridInitialDataXml) {
				if (this._isHeaderCreated) {
					this._grid.removeAllRows();
					this._grid.addXMLRows(gridInitialDataXml);
				} else {
					this._grid.initXML(gridInitialDataXml);

					//itemToRequest.setProperty('get_only_rows', '1');
					var originalFormatHander = this._grid.formatter_Experimental.formatHandler;
					this._grid.isEbomOnlyAssembly = function(columnName, value) {
						//was set a big value to put rows with the status at the bottom of TreeGrid
						return columnName === 'c_oper_sort_order' && (value === 1000000015 || value === '1000000015');
					};
					var isEbomOnlyAssembly = this._grid.isEbomOnlyAssembly;
					this._grid.formatter_Experimental.formatHandler = function(layoutCell, storeValue) {
						if (isEbomOnlyAssembly(layoutCell.field, storeValue)) {
							return '';
						}
						return originalFormatHander.apply(this, arguments);
					};

					this._isHeaderCreated = true;
				}

				// error code is here, because it allows to show user empty grid before alertDialog
				if (errorString) {
					if (errorNotResolvedFull) {
						this.uiUtils.customAlertInternal(errorNotResolvedFull, errorString);
					} else {
						this.aras.AlertError(errorString);
					}
				}
			}
		},

		_onApplyEdit: function(rowId, fieldName, newValue) {
			if (newValue === this.originCellValue) {
				return true;
			}

			switch (fieldName) {
				case 'c_oper_sort_order':
					this.applyOperationNumberChange(rowId, newValue);
					break;
				case 'c_quantity':
					this.applyQuantityChange(rowId, newValue);
					break;
				default:
					break;
			}
		},

		getConsumedPartModelItem: function(rowId, optionalParameters) {
			optionalParameters = optionalParameters || {};

			var processPlanId = this.getMBomItemUserData(rowId, 'pid');
			var operationId = this.getMBomItemUserData(rowId, 'oid');
			var consumedPartId = this.getMBomItemUserData(rowId, 'ocid');
			var parameters = {loadPermitted: true, trackChanges: true, isFromServer: undefined};
			var processPlanModelItem = this.datamodel.getProcessPlan(processPlanId, parameters);

			optionalParameters.isFromServer = parameters.isFromServer;

			return processPlanModelItem && processPlanModelItem.getChildByIdPath([operationId, consumedPartId]);
		},

		applyOperationNumberChange: function(rowId, newValue) {
			var gridControl = this._grid;
			var columnIndex = gridControl.getColumnIndex('c_oper_sort_order');
			var processPlanId = this.getMBomItemUserData(rowId, 'pid');
			var operationId = this.getMBomItemUserData(rowId, 'oid');
			var consumedPartId = this.getMBomItemUserData(rowId, 'ocid');
			var mbomItem, targetOperationModelItem, i;

			var processPlanModelItem = this.datamodel.getProcessPlan(processPlanId, {loadPermitted: true, trackChanges: true});
			var consumedPartModelItem = processPlanModelItem.getChildByIdPath([operationId, consumedPartId]);

			if (!consumedPartModelItem) {
				return;
			}
			var existingOperations = processPlanModelItem.getChildrenByType(Enums.ModelItemTypes.Operation);
			var targetMbomItems = this.getMBomItemsByUserData('ocid', consumedPartId);

			// searching for existing operation with 'sort_order' = newValue
			for (i = 0; i < existingOperations.length; i++) {
				var operationModelItem = existingOperations[i];
				var newValueStr = (newValue || newValue === 0) && newValue.toString && newValue.toString();

				if (operationModelItem.getProperty('sort_order') === newValueStr) {
					targetOperationModelItem = operationModelItem;
					break;
				}
			}

			// if operation wasn't found, then creating new
			if (!targetOperationModelItem) {
				var newOperationIomItem = this.aras.newIOMItem('mpp_Operation', 'add');

				newOperationIomItem.setProperty('sort_order', newValue);
				targetOperationModelItem = this.datamodel.elementFactory.createElementFromItemNode(newOperationIomItem.node);
				processPlanModelItem.addChildItem(targetOperationModelItem);
			}

			// updating MBom items with new values
			for (i = 0; i < targetMbomItems.length; i++) {
				mbomItem = targetMbomItems[i];

				gridControl.setCellValue(mbomItem.id || mbomItem.uniqueId, columnIndex, newValue);
				mbomItem.fields[columnIndex] = newValue;
				mbomItem.userdata.oid = targetOperationModelItem.Id();
			}

			// if item not new, then we should explicitly delete old relationship and create new
			if (!consumedPartModelItem.isNew()) {
				var clonedConsumedPartItem = consumedPartModelItem.Clone();
				var newConsumedPartId = this.aras.generateNewGUID();

				for (i = 0; i < targetMbomItems.length; i++) {
					mbomItem = targetMbomItems[i];
					mbomItem.userdata.ocid = newConsumedPartId;
				}

				this.datamodel.deleteItem(consumedPartModelItem, {ignoreForWorkbench: true});

				clonedConsumedPartItem.setAttribute('action', 'add', {forceUpdate: true});
				clonedConsumedPartItem.Id(newConsumedPartId);
				clonedConsumedPartItem.setRelatedItem(consumedPartModelItem.getRelatedItem());

				consumedPartModelItem = clonedConsumedPartItem;
			}

			var previousOperationModelItem = processPlanModelItem.getChildByIdPath([operationId]);
			if (previousOperationModelItem) {
				var isOperationEmpty = function(operation) {
					if (!operation.isNew()) {
						return false;
					}
					var properties = Object.keys(operation.internal.itemData.properties);

					if (properties.length !== 0 && !(properties.length === 1 && properties[0] === 'sort_order')) {
						return false;
					}
					var childrens = operation.ChildItems && operation.ChildItems().getAllItems() || [];
					if (childrens.length === 0 || (childrens.length === 1 && childrens[0].is('ConsumedPart') && childrens[0].Id() === consumedPartId)) {
						return true;
					}
					return false;
				};

				if (isOperationEmpty(previousOperationModelItem)) {
					this.datamodel.deleteItem(previousOperationModelItem);
				}
			}

			targetOperationModelItem.addChildItem(consumedPartModelItem);
			this.onDataChanged();
		},

		applyQuantityChange: function(rowId, newValue, forceUpdateOldValue, oldValue) {
			var parameters = {};
			var consumedPartModelItem = this.getConsumedPartModelItem(rowId, parameters);

			if (consumedPartModelItem) {
				var gridControl = this._grid;
				var columnIndex = gridControl.getColumnIndex('c_quantity');
				var consumedPartId = this.getMBomItemUserData(rowId, 'ocid');
				var targetMbomItems = this.getMBomItemsByUserData('ocid', consumedPartId);
				var neutralValue = this.aras.convertToNeutral(newValue, 'float');
				var mbomItem, i;

				if (parameters.isFromServer) {
					forceUpdateOldValue = true;
					oldValue = this.aras.convertToNeutral(this.originCellValue, 'float');
				}

				for (i = 0; i < targetMbomItems.length; i++) {
					mbomItem = targetMbomItems[i];

					gridControl.setCellValue(mbomItem.id || mbomItem.uniqueId, columnIndex, newValue);
					mbomItem.fields[columnIndex] = neutralValue;
				}

				consumedPartModelItem.setProperty('quantity', neutralValue, undefined, forceUpdateOldValue, oldValue);

				this.updateReconciliationStatuses();
				this.onDataChanged();
			}
		},

		updateReconciliationStatuses: function() {
			var updatePromise = this.inherited(arguments);

			updatePromise.then(function(updateResult) {
				var ebomOnlyItemsExist = Boolean(updateResult && updateResult.ebomOnlyItemsExist);

				if (ebomOnlyItemsExist) {
					var rowId = this._grid.getSelectedId();
					this.initTree();
					if (rowId || rowId === 0) {
						this._grid.setSelectedRow(rowId, false, true);
					}
				}

				this.setUserDataFromItems(this.data.mbomItems);
				this.setFieldValuesFromItems(['c_rec_status1', 'c_rec_status2'], this.data.mbomItems);
			}.bind(this));
		},

		createTree: function() {
			this.controlsFactory.createControl('MPP.UI.MPPTreeGridContainer', {
				connectId: connectId,
				canEdit_Experimental: function(rowId) {
					if (this.isEditable) {
						return Boolean(this.getMBomItemUserData(rowId, 'ocid'));
					}

					return false;
				}.bind(this),
				validateCell_Experimental: function(rowId, field, value) {
					return this._validateCell(rowId, field, value);
				}.bind(this),
				gridRowSelect: function(rowId) {
					this.onGridRowSelect(rowId);
				}.bind(this)
			}, function(control) {
				//disable sorting
				control.grid_Experimental.doheaderclick = function() { };

				this._grid = control;
				control.setMultiselect(false);

				this.controlsFactory.on(control, {
					gridMenuInit: function(rowId) {
						this._onGridMenuInit(rowId);
					}.bind(this),
					gridXmlLoaded: function(rowId) {
						var rowItems = (this.data && this.data.mbomItems) || [];

						if (rowItems.length) {
							rowItems = this._grid.decorateRowItemsBeforeAdd(rowItems, '', '');

							for (var i = 0; i < rowItems.length; i++) {
								this._grid.items_Experimental.add(rowItems[i], '');
							}
							this._grid.grid_Experimental.render();
						}
					}.bind(this),
					onApplyEdit_Experimental: function(rowId, fieldName, value) {
						this._onApplyEdit(rowId, fieldName, value);
					}.bind(this),
					onStartEdit_Experimental: function(rowId, fieldName) {
						this.originCellValue = this._grid.getCellValue_Experimental(rowId, fieldName);
					}.bind(this)
				});

				this.refreshEnumerationIndex();
				this.dndData.domNode = control.grid_Experimental.domNode;
				this.activateDnD(true);
			}.bind(this));

			this.eventHandlers.push(connect.connect(this._grid.grid_Experimental, 'onStyleRow', this, function(row) {
				var storeItem = this._grid.grid_Experimental.getItem(row.index);
				var userData = storeItem && storeItem.userData$Gm;

				if (userData) {
					row.customClasses +=
						(userData.bad === '1' ? ' bad' : '') +
						(userData.comp === '1' ? ' component' : '') +
						(userData.eonly === '1' ? ' removed' : '');
				}
			}));

			this.inherited(arguments);
		},

		_rememberExpanded: function() {
			var expandedRowIds = this._grid.getOpenedItems();
			var itemsByUid = (this.data && this.data.mbomItemsByUid) || {};
			var gridControl = this._grid;
			var consumedPartId, rowId, mbomItem, i;

			this._expandedConsumedIds = [];

			for (i = 0; i < expandedRowIds.length; i++) {
				rowId = expandedRowIds[i];
				mbomItem = itemsByUid[rowId];
				consumedPartId = mbomItem ? mbomItem.userdata.ocid : gridControl.getUserData(rowId, 'ocid');

				if (consumedPartId) {
					this._expandedConsumedIds.push(consumedPartId);
				}

				if (mbomItem) {
					mbomItem.expanded = 'true';
				}
			}
		},

		destroy: function() {
			if (this._grid) {
				this.activateDnD(false);

				this.inherited(arguments);
			}
		},

		getPartPathByRowId: function(rowId) {
			var gridControl = this._grid;
			var partPath = [];
			var currentPartId = this.getMBomItemUserData(rowId, 'id');

			if (currentPartId) {
				var parentId = gridControl.getParentId(rowId);

				partPath.push(currentPartId);

				while (parentId) {
					partPath.push(this.getMBomItemUserData(parentId, 'id'));
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
				var searchPartId, storeItem, foundPartId, i;

				searchItemList = searchItemList || gridStore._arrayOfAllItems;
				partIdPath = Array.isArray(partIdPath) ? partIdPath.slice() : [partIdPath];
				searchPartId = partIdPath.shift();

				for (i = 0; i < searchItemList.length; i++) {
					storeItem = searchItemList[i];
					var partId = storeItem.userData$Gm && storeItem.userData$Gm.id;

					if (partId === searchPartId) {
						foundPartId = partIdPath.length ? this.getRowIdByPartPath(partIdPath, storeItem.children) : storeItem.uniqueId[0];

						if (foundPartId) {
							return foundPartId;
						}
					}
				}
			}
		},

		_validateCell: function(rowId, field, value) {
			if (field === 'c_oper_sort_order' || field === 'c_quantity') {
				if (!value) {
					this._grid.edit_Experimental.setErrorMessage('property is required');
					return false;
				}

				if (!this.aras.isPropertyValueValid({data_type: (field === 'c_oper_sort_order' ? 'integer' : 'float')}, value)) {
					this._grid.edit_Experimental.setErrorMessage(this.aras.ValidationMsg);
					return false;
				}
			}

			return true;
		},

		onGridRowSelect: function() {
			//used to override it in ConflictResolving Extention (a part of Mixin)
		},

		onDataChanged: function() {
		},

		//Modify by tengz 2019/7/25
		//在MBOM中插入Part时带入地区
		addPartItemToMBom: function(targetItem, partItemIds, optionalParameters) {
			return (new Promise(function(resolve, reject) {
				optionalParameters = optionalParameters || {};
				targetItem = typeof targetItem === 'object' ? targetItem : (this.data && this.data.mbomItemsByUid[targetItem]);
				partItemIds = partItemIds ? (Array.isArray(partItemIds) ? partItemIds : [partItemIds]) : [];

				if (targetItem && partItemIds.length) {
					var sourcePartId = targetItem.userdata.id;
					var ancestorParts = this.getPartPathByRowId(targetItem.uniqueId);
					var isRecursiveStructure = false;
					var partId, i, j, newMbomItem;

					// recursive elements check
					for (i = 0; i < partItemIds.length; i++) {
						partId = partItemIds[i];

						if (partId === sourcePartId || ancestorParts.indexOf(partId) > -1) {
							isRecursiveStructure = true;
							break;
						}
					}

					//if there is no recursive elements
					if (isRecursiveStructure) {
						this.aras.AlertError(this.uiUtils.getResource('error.circularReferenceProducedConsumedPart'));
					} else {
						var processPlanId = targetItem.userdata.cpid;
						var processPlanModelItem = this.datamodel.getProcessPlan(processPlanId, {loadPermitted: true, trackChanges: true});

						if (processPlanModelItem) {
							var requestItem = this.aras.newIOMItem('Part', 'mpp_GetBomTreeGrid');
							var newItemsData = [];
							var postJsonData = {};
							var notPermittedItemIds = [];
							var approvedItems = [];
							for (i = 0; i < partItemIds.length; i++) {
								partId = partItemIds[i];
								var partItemNode = this.aras.getItemById(partConfig.part_it_name, partId);

								// prepare item node (removing relationships, converting to IOMItem)
								if (partItemNode) {
									if (partItemNode.getAttribute('discover_only') === '1') {
										notPermittedItemIds.push(partId);
									} else {
										var operationItem = this.aras.newIOMItem('mpp_Operation', 'add');
										var consumedItem = this.aras.newIOMItem('mpp_OperationConsumedPart', 'add');
										
										//Modify by tengz
										operationItem.setProperty('bcs_location',this.datamodel.filterParameters.locationId);
										consumedItem.setProperty('bcs_location',this.datamodel.filterParameters.locationId);
										
										partItemNode = partItemNode.cloneNode(true);
										var relationshipsNode = partItemNode.selectSingleNode('Relationships');

										if (relationshipsNode) {
											relationshipsNode.parentNode.removeChild(relationshipsNode);
										}

										var partItem = this.uiUtils.convertNodeToIomItem(partItemNode);

										consumedItem.setRelatedItem(partItem);
										var quantity = typeof optionalParameters.partQuantity === 'number' ? optionalParameters.partQuantity : 1;
										consumedItem.setProperty('quantity', quantity);
										operationItem.addRelationship(consumedItem);

										var newOperationModelItem = this.datamodel.elementFactory.createElementFromItemNode(operationItem.node);
										newMbomItem = this.createMBomItemFromModelItem(newOperationModelItem.getChildByIdPath(consumedItem.getID()));

										if (newMbomItem) {
											// explicitly set ProcessPlan id, because during createMBomItemFromModelItem call part isn't in process plan
											newMbomItem.userdata.pid = processPlanModelItem.Id();
											newMbomItem.userdata.level = parseInt(targetItem.userdata.level) + 1;

											//request MBom structure for new part item
											postJsonData[newMbomItem.userdata.id] = JSON.stringify(newMbomItem);
										}

										newItemsData.push({
											modelItem: newOperationModelItem,
											mbomItem: newMbomItem
										});

										approvedItems.push(partId);
									}
								}
							}

							if (notPermittedItemIds.length) {
								this.aras.AlertError(this.uiUtils.getResource('warning.itemInsufficientPermissions') + '\n' + notPermittedItemIds.join(', '));
							}

							if (approvedItems.length) {
								if (approvedItems.length > 1) {
									requestItem.setAttribute('idlist', approvedItems.join(','));
								} else {
									requestItem.setID(approvedItems[0]);
								}

								// setting separate 'post_mbom_json' property for items in request
								for (partId in postJsonData) {
									requestItem.setProperty('post_mbom_json_' + partId, postJsonData[partId]);
								}

								requestItem.setProperty('get_mbom_node_without_reconc', 1);
								requestItem.setProperty('parent_part_id', sourcePartId);
								requestItem.setProperty('get_only_rows', 1);
								requestItem.setProperty('location_id', this.itemToRequest.getProperty('location_id'));
								requestItem = requestItem.apply();

								var resultItemsCount = requestItem.isError() ? 0 : requestItem.getItemCount();

								if (resultItemsCount && resultItemsCount === approvedItems.length) {
									var allTargetItems = this.getMBomItemsByUserData('cpid', processPlanId);
									for (i = 0; i < resultItemsCount; i++) {
										var resultItem = requestItem.getItemByIndex(i);
										var itemData = newItemsData[i];
										var itemStructureJson = resultItem.getProperty('mbomDataJson') || JSON.stringify(itemData.mbomItem);

										//insert part structure into all target items
										for (j = 0; j < allTargetItems.length; j++) {
											var currentMbomItem = allTargetItems[j];
											var childItems = currentMbomItem.children;

											if (!childItems) {
												childItems = [];
												currentMbomItem.children = childItems;
											}

											var newMBomItems = this.parseJsonProperty(itemStructureJson);
											this._grid.enumerateItems(newMBomItems, true);

											childItems.push(newMBomItems);
										}

										processPlanModelItem.addChildItem(itemData.modelItem);
									}

									this.expandRows(allTargetItems);
									this.refreshItemsUidHash();
									this.onDataChanged();
									this.loadNestedPlansIntoDataModel();

									if (optionalParameters.refreshGrid) {
										this.initTree();
									}

									if (optionalParameters.refreshStatuses) {
										setTimeout(function() {
											this.updateReconciliationStatuses();
										}.bind(this), 0);
									}

									resolve();
								}
							}
						} else {
							this.uiUtils.showConfirmDialog('Related process plan doesn\'t exist. Create new?').then(function(selectedOption) {
								if (selectedOption === 'btnYes') {
									var gridControl = this._grid;
									var producedPart = this.aras.newIOMItem('mpp_ProcessPlanProducedPart', 'add');
									var processPlanItem = this.aras.newIOMItem('mpp_ProcessPlan', 'add');
									var numberColumnIndex = gridControl.getColumnIndex('c_item_number_mbom');
									var currentLocationId = this.datamodel.filterParameters.locationId;
									var sourcePartIomItem = this.uiUtils.convertNodeToIomItem(this.aras.getItemById(partConfig.part_it_name, sourcePartId));

									processPlanId = processPlanItem.getID();
									processPlanItem.setProperty('item_number', targetItem.fields[numberColumnIndex]);

									producedPart.setRelatedItem(sourcePartIomItem);
									processPlanItem.addRelationship(producedPart);

									if (currentLocationId) {
										var locationRelationship = this.aras.newIOMItem('mpp_ProcessPlanLocation', 'add');

										locationRelationship.setProperty('related_id', currentLocationId);
										processPlanItem.addRelationship(locationRelationship);
									}

									var registerTearoffHandlers = function() {
										var tearoffWindow = this.aras.uiFindWindowEx(processPlanId);
										var onSaveProcessPlanHandler = function() {
											var createdProcessPlan = this.datamodel.getProcessPlan(processPlanId, {loadPermitted: true, trackChanges: true});

											// refresh sourcePartId in dataModel
											this.datamodel.replaceRegisteredItemsFromNode(sourcePartId,
												this.aras.getItemById(partConfig.part_it_name, sourcePartId));

											// if process plan was saved, than it will be available through getProcessPlan call
											if (createdProcessPlan) {
												var producedPart = createdProcessPlan.getProducedPart();

												// check, that produced part matches with sourcePartId (user can change it during work)
												if (producedPart && producedPart.Id() === sourcePartId) {
													var plannedColumnIndex = gridControl.getColumnIndex('c_planned');
													var allTargetItems = this.getMBomItemsByUserData('id', sourcePartId);

													targetItem.expanded = 'true';

													for (i = 0; i < allTargetItems.length; i++) {
														var currentMbomItem = allTargetItems[i];

														currentMbomItem.userdata.cpid = processPlanId;
														currentMbomItem.fields[plannedColumnIndex] = true;
													}

													this.addPartItemToMBom(targetItem, partItemIds, optionalParameters).then(resolve());
												} else {
													createdProcessPlan.unregisterItem();
												}
											}
										}.bind(this);

										if (tearoffWindow && tearoffWindow.registerCommandEventHandler) {
											var unregisterCommandEventHandler = tearoffWindow.unregisterCommandEventHandler;
											var key = tearoffWindow.registerCommandEventHandler(tearoffWindow, function() {
												unregisterCommandEventHandler(key);
												onSaveProcessPlanHandler();
											}, 'after', 'save');
										}
									}.bind(this);

									setTimeout(function() {
										this.aras.uiShowItemEx(processPlanItem.node, 'new').then(registerTearoffHandlers);
									}.bind(this), 0);
								}
							}.bind(this));
						}
					}
				}
			}.bind(this)))
				.catch(function(ex) {
					var itemError = this.aras.newIOMItem();
					itemError.loadAML(ex.responseText);
					this.aras.AlertError(itemError);
				}.bind(this));
		},

		removeWaitTearoffListeners: function() {
			var tearoffWindow, itemId, unloadWindowHandler;

			for (itemId in this.waitTearoffWindows) {
				tearoffWindow = this.aras.uiFindWindowEx(itemId);

				if (tearoffWindow) {
					unloadWindowHandler = this.waitTearoffWindows[itemId];
					tearoffWindow.removeEventListener('beforeunload', unloadWindowHandler);
				}
			}

			this.waitTearoffWindows = {};
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

		getMBomItemUserData: function(rowId, key) {
			var mbomItem = this.data.mbomItemsByUid[rowId];
			if (mbomItem) {
				return mbomItem.userdata[key];
			}
		},

		setEditable: function(doEditable) {
			this.isEditable = doEditable === undefined ? true : Boolean(doEditable);
		},

		_updateVersion: function(rowId, newGenerationPartId) {
			var consumedPartModelItem = this.getConsumedPartModelItem(rowId);
			var parentRowId = this._grid.getParentId(rowId);
			var siblingRowIdsStrBeforeAdd = this._grid.getChildItemsId(parentRowId, false, '|');
			var quantity = consumedPartModelItem.getProperty('quantity');
			var operationNumber = consumedPartModelItem.Parent.getProperty('sort_order');

			this.datamodel.deleteItem(consumedPartModelItem, {ignoreForWorkbench: true});

			this.addPartItemToMBom(parentRowId, newGenerationPartId, {refreshGrid: true, refreshStatuses: true})
				.then(function() {
					this._fixOperationAndQuantity(parentRowId, siblingRowIdsStrBeforeAdd, quantity, operationNumber);
				}.bind(this))
				.catch(function(ex) {
					var itemError = this.aras.newIOMItem();
					itemError.loadAML(ex.responseText);
					this.aras.AlertError(itemError);
				}.bind(this));
		},

		_getNewRowIdAfterAdd: function(parentRowId, siblingRowIdsStrBeforeAdd) {
			var i,
				siblingRowIdsAfterAdd,
				newRowId;

			siblingRowIdsAfterAdd = this._grid.getChildItemsId(parentRowId, false, '|').split('|');
			for (i = 0; i < siblingRowIdsAfterAdd.length; i++) {
				newRowId = siblingRowIdsAfterAdd[i];
				if (siblingRowIdsStrBeforeAdd.indexOf(newRowId) === -1) {
					break;
				}
			}

			return newRowId;
		},

		_fixOperationAndQuantity: function(parentRowId, siblingRowIdsStrBeforeAdd, newQuantity, newOperationNumber) {
			var newRowId = this._getNewRowIdAfterAdd(parentRowId, siblingRowIdsStrBeforeAdd);

			//we can try to use optional parameter partQuantity  of addPartItemToMBom,
			//but it doesn't work for now properly, no proper quantity in Grid.
			var valueInGrid = this.aras.convertFromNeutral(newQuantity, 'float');
			this.applyQuantityChange(newRowId, valueInGrid);
			this.applyOperationNumberChange(newRowId, newOperationNumber);
		},

		_addMenuItemUpdateVersion: function(rowId) {
			var newGenerationPartId = this.getMBomItemUserData(rowId, 'ngen');

			if (newGenerationPartId) {
				var contextMenu = this._grid.getMenu();

				contextMenu.add(null, this.uiUtils.getResource('MBOMTreeGridMenu.updateVersion'), null, {
					onClick: function(targetRowId) {
						this._updateVersion(targetRowId, newGenerationPartId);
					}.bind(this)
				});
			}
		},

		_onGridMenuInit: function(rId) {
			var gridControl = this._grid;
			var noChilds = this.getMBomItemUserData(rId, 'comp') === '1';
			var processPlanId = this.getMBomItemUserData(rId, 'cpid');
			var contextMenu = this._grid.getMenu();

			contextMenu.removeAll();

			if (this.isEditable) {
				this._addMenuItemUpdateVersion(rId);

				if (!noChilds) {
					contextMenu.add(null, this.uiUtils.getResource('MBOMTreeGridMenu.insertPart'), null, {
						onClick: function(rowId) {
							this.uiUtils.showSearchDialog(partConfig.part_it_name, function(selectedItemIds) {
								var copiedSelectedIds = [];

								// this copy required to avoid 'code from freed script exception'
								copiedSelectedIds = copiedSelectedIds.concat(selectedItemIds);

								this.addPartItemToMBom(rowId, copiedSelectedIds, {refreshGrid: true, refreshStatuses: true});
							}.bind(this), {multiselect: true});
						}.bind(this),
						icon: '../../images/Part.svg'
					});

					contextMenu.add(null, this.uiUtils.getResource('MBOMTreeGridMenu.insertPhantom'), null, {
						onClick: function(rowId) {
							var partItem = this.aras.newIOMItem(partConfig.part_it_name, 'add');
							var partId = partItem.getID();
							var addPartPromise;

							partItem.setProperty('classification', partConfig.phantom_class_path);
							this.aras.itemsCache.addItem(partItem.node);
							addPartPromise = this.addPartItemToMBom(rowId, partId, {refreshGrid: true});

							addPartPromise.then(function() {
								// setTimeout is required to wait grid refresh, which is needed for getRowNode
								setTimeout(function() {
									var parentMbomItem = this.data.mbomItemsByUid[rowId];
									var gridWidget = gridControl.grid_Experimental;
									var gridView = gridWidget.views.views[0];
									var newMbomItem, targetDomNode, childItem, i;

									for (i = 0; i < parentMbomItem.children.length; i++) {
										childItem = parentMbomItem.children[i];

										if (childItem.userdata.id === partId) {
											newMbomItem = childItem;
										}
									}

									gridControl.setSelectedRow(newMbomItem.uniqueId, false, true);

									targetDomNode = gridView.getRowNode(gridControl.getRowIndex(newMbomItem.uniqueId));
									targetDomNode = targetDomNode && targetDomNode.querySelectorAll('td')[1];

									this.uiUtils.showTooltipDialog(partItem.node, {around: targetDomNode}, {
										callbacks: {
											onClose: function() {
												var newMbomItems = this.getMBomItemsByUserData('id', partId);
												var optionalParameters = {loadPermitted: true, trackChanges: true};
												var processPlanModelItem = this.datamodel.getProcessPlan(newMbomItem.userdata.pid, optionalParameters);
												var partItem = this.aras.getItemById(partConfig.part_it_name, partId);
												if (!this.aras.checkItem(partItem, this.aras.getMostTopWindowWithAras(window))) {
													return true;
												}
												this.datamodel.replaceRegisteredItemsFromNode(partId, partItem);
												var idPath = [newMbomItem.userdata.oid, newMbomItem.userdata.ocid];
												var consumedPartModelItem = processPlanModelItem.getChildByIdPath(idPath);
												var updatedMBomItem = this.createMBomItemFromModelItem(consumedPartModelItem);

												for (var i = 0; i < newMbomItems.length; i++) {
													newMbomItem = newMbomItems[i];

													newMbomItem.fields = updatedMBomItem.fields.slice();
												}

												this.initTree();

												setTimeout(function() {
													this.updateReconciliationStatuses();
												}.bind(this), 0);

												gridControl.setSelectedRow(newMbomItem.uniqueId, false, true);
											}.bind(this),
											onCancel: function() {
												var optionalParameters = {loadPermitted: true, trackChanges: true};
												var processPlanModelItem = this.datamodel.getProcessPlan(newMbomItem.userdata.pid, optionalParameters);
												var idPath = [newMbomItem.userdata.oid, newMbomItem.userdata.ocid];
												var consumedPartModelItem = processPlanModelItem.getChildByIdPath(idPath);

												if (consumedPartModelItem) {
													this.datamodel.deleteItem(consumedPartModelItem);
												}

												gridControl.setSelectedRow(parentMbomItem.id && parentMbomItem.uniqueId, false, true);
											}.bind(this)
										}
									});
								}.bind(this), 0);
							}.bind(this));
						}.bind(this),
						icon: '../../images/Phantom.svg'
					});
				}

				contextMenu.add(null, this.uiUtils.getResource('MBOMTreeGridMenu.removePart'), null, {
					onClick: function(rowId) {
						var itemsByUid = this.data.mbomItemsByUid;
						var selectedMbomItem = itemsByUid[rowId];

						if (selectedMbomItem) {
							var userData = selectedMbomItem.userdata;
							var processPlanModelItem = this.datamodel.getProcessPlan(userData.pid, {loadPermitted: true, trackChanges: true});

							if (processPlanModelItem) {
								var consumedPartModelItem = processPlanModelItem.getChildByIdPath([userData.oid, userData.ocid]);

								if (consumedPartModelItem) {
									this.datamodel.deleteItem(consumedPartModelItem);
								}
							}
						}
					}.bind(this)
				});
			}

			contextMenu.add(null, this.uiUtils.getResource('MBOMTreeGridMenu.viewPart'), null, {
				onClick: function(rowId) {
					rowId = rowId || gridControl.getSelectedId();

					if (rowId) {
						var partId = this.getMBomItemUserData(rowId, 'id');

						this.aras.uiShowItem(partConfig.part_it_name, partId);
					}
				}.bind(this)
			});

			if (processPlanId && this.itemToRequest.getID() !== processPlanId) {
				contextMenu.add(null, this.uiUtils.getResource('MBOMTreeGridMenu.viewProcessPlan'), null, {
					onClick: function(rowId) {
						this.aras.uiShowItem('mpp_ProcessPlan', processPlanId);
					}.bind(this)
				});
			}
		}
	});
});
