define([
	'dojo/_base/declare',
	'MPP/UI/Utils/UIUtils'
],
function(declare, UIUtils) {
	var aras = parent.aras;
	var uiUtils = new UIUtils({aras: aras});
	var ConflictStates = {
		UnResolved: 0,
		UseMy: 1,
		UseOthers: 2
	};
	var ConflictCases = {
		CpNotFound: 1,
		QtyChanged: 2
	};

	return declare(null, {
		_columnConflictIndex: null,
		_allConflicts: {},
		conflictDetailsStrOnInit: null,
		_toolbarItemUseMy: null,
		_toolbarItemUseOther: null,

		initTree: function() {
			var consumedPartId;

			this.inherited(arguments);

			for (consumedPartId in this._allConflicts) {
				if (this._allConflicts.hasOwnProperty(consumedPartId)) {
					var conflict = this._allConflicts[consumedPartId];
					this._setIconInGrid(consumedPartId, conflict);
				}
			}

			if (this.conflictDetailsStrOnInit) {
				this.setConflict(this.conflictDetailsStrOnInit);
				this.conflictDetailsStrOnInit = null;
			}
		},

		setToolbarItemUseMy: function(toolbarItem) {
			this._toolbarItemUseMy = toolbarItem;
		},

		setToolbarItemUseOther: function(toolbarItem) {
			this._toolbarItemUseOther = toolbarItem;
		},

		clearAllConflicts: function(isToClearGrid) {
			var allRowIds,
				i,
				cell,
				columnIndex;

			this._allConflicts = {};

			if (isToClearGrid && this._grid) {
				columnIndex = this._grid.getColumnIndex('c_conflict');
				allRowIds = this._grid.items_Experimental.getAllId();
				for (i = 0; i < allRowIds.length; i++) {
					cell = this._grid.cells(allRowIds[i], columnIndex);
					cell.setValue('');
				}
			}
		},

		setConflict: function(conflictDetailsStr) {
			if (!this._grid) {
				this.conflictDetailsStrOnInit = conflictDetailsStr;
				return;
			}
			var conflictDetails = aras.newIOMItem();
			conflictDetails.loadAML(conflictDetailsStr);
			var conflictsRels = conflictDetails.getRelationships('mpp_OperationConsumedPart');
			var conflictRelsCount = conflictsRels.getItemCount();
			for (var i = 0; i < conflictRelsCount; i++) {
				var conflictsRel = conflictsRels.getItemByIndex(i);
				var conflict = this._getConflictFromItem(conflictsRel);
				this._allConflicts[conflictsRel.getID()] = conflict;
				this._setIconInGrid(conflictsRel.getID(), conflict);
			}

			this.manageToolbarItems();
		},

		_getConflictFromItem: function(conflictItem) {
			var dbQuantity = conflictItem.getProperty('quantity');
			var newQuantity = conflictItem.getPropertyAttribute('quantity', 'new_value');
			var newOperationNumber = conflictItem.getPropertyAttribute('mpp_crf_data', 'mpp_new_operation_number');
			var conflictCase, tooltip;

			switch (conflictItem.getPropertyAttribute('mpp_crf_data', 'mpp_conflict_case')) {
				case 'qty_changed':
					tooltip = uiUtils.getResource('crf.qty_changed_tooltip', newQuantity, dbQuantity);
					conflictCase = ConflictCases.QtyChanged;
					break;
				case 'cp_not_found':
					tooltip = uiUtils.getResource('crf.cp_not_found_tooltip', newQuantity, newOperationNumber);
					conflictCase = ConflictCases.CpNotFound;
					break;
				default:
					break;
			}

			return {
				state: ConflictStates.UnResolved,
				conflictCase: conflictCase,
				tooltip: tooltip,
				dbQuantity: dbQuantity,
				oldQuantity: conflictItem.getPropertyAttribute('quantity', 'old_value'),
				newQuantity: newQuantity,
				newOperationNumber: newOperationNumber
			};
		},

		_childUnresolvedConflictExists: function(rowId) {
			//note that a conflict in the spec means a conflict from _allConflicts in code only with state UnResolved.
			var childRowIds = this._grid.getChildItemsId(rowId, true, '|').split('|');
			var childConsumedPartId, childConflict, i;

			for (i = 0; i < childRowIds.length; i++) {
				childConsumedPartId = this._grid.getUserData(childRowIds[i], 'ocid');
				childConflict = this._allConflicts[childConsumedPartId];

				if (childConflict && childConflict.state === ConflictStates.UnResolved) {
					return true;
				}
			}

			return false;
		},

		_getCellValue: function(iconName, conflict) {
			return '<img class="status" src="../images/' + iconName + '.svg" ' + (conflict ? 'title=\'' + conflict.tooltip + '\'' : '') + '/>';
		},

		_setIconInGrid: function(consumedPartId, conflict) {
			var targetMbomItems = this.getMBomItemsByUserData('ocid', consumedPartId);
			var parentId, rowId, childUnresolvedConflictExists, mbomItem, cell, iconName, i;

			for (i = 0; i < targetMbomItems.length; i++) {
				mbomItem = targetMbomItems[i];
				rowId = mbomItem.id || mbomItem.uniqueId;
				cell = this._grid.cells(rowId, this._grid.getColumnIndex('c_conflict'));
				iconName = '';

				childUnresolvedConflictExists = this._childUnresolvedConflictExists(rowId);

				switch (conflict.state) {
					case ConflictStates.UnResolved:
						parentId = this._grid.getParentId(rowId);
						if (parentId || parentId === 0) {
							this._addGlyphToParentIconRecursively(parentId);
						}

						iconName = childUnresolvedConflictExists ? 'UnresolvedPlusLower' : 'Unresolved';
						break;
					case ConflictStates.UseMy:
						iconName = childUnresolvedConflictExists ? 'ResolvedMyEditsPlusLower' : 'ResolvedMyEdits';
						break;
					case ConflictStates.UseOthers:
						iconName = childUnresolvedConflictExists ? 'ResolvedOtherEditsPlusLower' : 'ResolvedOtherEdits';
						break;
					default:
						break;
				}

				cell.setValue(this._getCellValue(iconName, conflict));
			}

			this._grid.grid_Experimental.update();
		},

		_addGlyphToParentIconRecursively: function(rowId) {
			var cell = this._grid.cells(rowId, this._grid.getColumnIndex('c_conflict'));
			var consumedPartId = this._grid.getUserData(rowId, 'ocid');
			var conflict = this._allConflicts[consumedPartId];
			var cellValue = cell.getValue() || '';
			var iconName, parentId;

			if (cellValue.indexOf('UnresolvedPlusLower.svg') !== -1 || cellValue.indexOf('ResolvedMyEditsPlusLower.svg') !== -1 ||
				cellValue.indexOf('ResolvedOtherEditsPlusLower.svg') !== -1 || cellValue.indexOf('LowerConflicts.svg') !== -1) {
				//no need to add because the Gryph has already existed
				return;
			}

			if (conflict) {
				switch (conflict.state) {
					case ConflictStates.UnResolved:
						iconName = 'UnresolvedPlusLower';
						break;
					case ConflictStates.UseMy:
						iconName = 'ResolvedMyEditsPlusLower';
						break;
					case ConflictStates.UseOthers:
						iconName = 'ResolvedOtherEditsPlusLower';
						break;
					default:
						break;
				}
			} else {
				iconName = 'LowerConflicts';
			}

			cell.setValue(this._getCellValue(iconName, conflict));
			parentId = this._grid.getParentId(rowId);

			if (parentId || parentId === 0) {
				this._addGlyphToParentIconRecursively(parentId);
			}
		},

		_removeGlyphFromParentIconRecursively: function(rowId) {
			var cell = this._grid.cells(rowId, this._grid.getColumnIndex('c_conflict'));
			var consumedPartId = this._grid.getUserData(rowId, 'ocid');
			var conflict = this._allConflicts[consumedPartId];
			var cellValue = cell.getValue() || '';
			var iconName, parentId;

			if (cellValue.indexOf('UnresolvedPlusLower.svg') === -1 && cellValue.indexOf('ResolvedMyEditsPlusLower.svg') === -1 &&
				cellValue.indexOf('ResolvedOtherEditsPlusLower.svg') === -1 && cellValue.indexOf('LowerConflicts.svg') === -1) {
				//no need to remove because the glyph hasn't existed.
				return;
			}

			if (this._childUnresolvedConflictExists(rowId)) {
				return;
			}

			if (conflict) {
				switch (conflict.state) {
					case ConflictStates.UnResolved:
						iconName = 'Unresolved';
						break;
					case ConflictStates.UseMy:
						iconName = 'ResolvedMyEdits';
						break;
					case ConflictStates.UseOthers:
						iconName = 'ResolvedOtherEdits';
						break;
					default:
						break;
				}

				cell.setValue(this._getCellValue(iconName, conflict));
			} else {
				cell.setValue('');
			}

			parentId = this._grid.getParentId(rowId);
			if (parentId || parentId === 0) {
				this._removeGlyphFromParentIconRecursively(parentId);
			}
		},

		removeGlyphForSeveralRows: function(childRowIdsArray) {
			var parentId, i;

			for (i = 0; i < childRowIdsArray.length; i++) {
				parentId = this._grid.getParentId(childRowIdsArray[i]);

				if (parentId || parentId === 0) {
					this._removeGlyphFromParentIconRecursively(parentId);
				}
			}

			this._grid.grid_Experimental.update();
		},

		onGridRowSelect: function(rowId) {
			this.manageToolbarItems(rowId);

			this.inherited(arguments);
		},

		onDeleteModelItemHandler: function() {
			this._toolbarItemUseMy.setEnabled(false);
			this._toolbarItemUseOther.setEnabled(false);

			this.inherited(arguments);
		},

		manageToolbarItems: function(rowId) {
			var consumedPartId,
				conflict;

			rowId = rowId || (this._grid && this._grid.getSelectedId());
			if (rowId) {
				consumedPartId = this._grid.getUserData(rowId, 'ocid');
				conflict = this._allConflicts[consumedPartId];
			}

			this._toolbarItemUseMy.setEnabled(rowId || rowId === 0 ? this._isEnableMy(conflict) : false);
			this._toolbarItemUseOther.setEnabled(rowId || rowId === 0 ? this._isEnableOther(conflict) : false);
		},

		_isEnableMy: function(conflict) {
			return conflict && conflict.state !== ConflictStates.UseMy;
		},

		_isEnableOther: function(conflict) {
			return conflict && conflict.state !== ConflictStates.UseOthers;
		},

		_onGridMenuInit: function(rowId) {
			this.inherited(arguments);

			var consumedPartId = this._grid.getUserData(rowId, 'ocid');
			var conflict = this._allConflicts[consumedPartId];

			if (!conflict) {
				return;
			}

			var isEnableMy = this._isEnableMy(conflict);
			var isEnableOther = this._isEnableOther(conflict);
			var contextMenu = this._grid.getMenu();
			var self = this;

			if (isEnableMy || isEnableOther) {
				contextMenu.addSeparator();
			}

			contextMenu.add(null, uiUtils.getResource('crf.use_my'), null, {
				onClick: function(rowId) {
					self.clickUseMy(rowId);
				},
				icon: '../../images/ResolvedMyEdits.svg',
				disable: !isEnableMy
			});

			contextMenu.add(null, uiUtils.getResource('crf.use_other'), null, {
				onClick: function(rowId) {
					self.clickUseOthers(rowId);
				},
				icon: '../../images/ResolvedOtherEdits.svg',
				disable: !isEnableOther
			});
		},

		clickUseMy: function(rowId) {
			this._resolveConflict(rowId, true);
		},

		clickUseOthers: function(rowId) {
			this._resolveConflict(rowId, false);
		},

		_resolveConflict: function(rowId, useMy) {
			var consumedPartId,
				conflict,
				value,
				valueInGrid,
				consumedPartModelItem,
				relatedId,
				parentRowId,
				siblingRowIdsStrBeforeAdd,
				newConsumedPartId,
				newRowId;

			rowId = rowId || this._grid.getSelectedId();
			consumedPartId = this._grid.getUserData(rowId, 'ocid');
			conflict = this._allConflicts[consumedPartId];

			switch (conflict.conflictCase) {
				case ConflictCases.QtyChanged:
					value = useMy ? conflict.newQuantity : conflict.dbQuantity;
					valueInGrid = aras.convertFromNeutral(value, 'float');
					this.applyQuantityChange(rowId, valueInGrid, true, conflict.dbQuantity);
					this._resolveConflictAfter(useMy, conflict, consumedPartId);
					break;
				case ConflictCases.CpNotFound:
					parentRowId = this._grid.getParentId(rowId);
					consumedPartModelItem = this.getConsumedPartModelItem(rowId);
					var processPlanId = consumedPartModelItem.Parent.Parent.Id();

					if (useMy) {
						var dbProcessPlan = this.datamodel.getDbProcessPlan(processPlanId);
						if (!dbProcessPlan) {
							aras.AlertWarning(uiUtils.getResource('crf.processPlanWasDeleted'));
							return;
						}
						if (!dbProcessPlan.getChildByIdPath([this._grid.getUserData(rowId, 'oid')])) {
							aras.AlertWarning(uiUtils.getResource('crf.operationWasDeleted'));
							return;
						}
					}

					relatedId = consumedPartModelItem.getProperty('related_id');
					this.datamodel.deleteItem(consumedPartModelItem, {ignoreForWorkbench: true});
					this._resolveConflictAfter(useMy, conflict, consumedPartId);

					if (useMy) {
						siblingRowIdsStrBeforeAdd = this._grid.getChildItemsId(parentRowId, false, '|');
						// we should change consumedPartId because several users can have the same conflicts and
						// add CP of each user should be with unique id of Consumed Part.
						this.addPartItemToMBom(parentRowId, relatedId, {refreshGrid: true, refreshStatuses: true})
							.then(function() {
								newRowId = this._getNewRowIdAfterAdd(parentRowId, siblingRowIdsStrBeforeAdd);
								newConsumedPartId = this.getConsumedPartModelItem(newRowId);
								this._allConflicts[newConsumedPartId] = conflict;

								this._fixOperationAndQuantity(parentRowId, siblingRowIdsStrBeforeAdd, conflict.newQuantity, conflict.newOperationNumber);

								this._resolveConflictAfter(useMy, conflict, newConsumedPartId);
							}.bind(this))
							.catch(function(ex) {
								aras.AlertError(ex);
							});
					}
					break;
				default:
					break;
			}

			this.manageToolbarItems(rowId);
		},

		_resolveConflictAfter: function(useMy, conflict, consumedPartId) {
			var targetMbomItems = this.getMBomItemsByUserData('ocid', consumedPartId);
			var rowIdsToUpdateConflicts = [];
			var rowId, mbomItem, i;

			conflict.state = useMy ? ConflictStates.UseMy : ConflictStates.UseOthers;

			this._setIconInGrid(consumedPartId, conflict);

			for (i = 0; i < targetMbomItems.length; i++) {
				mbomItem = targetMbomItems[i];
				rowId = mbomItem.id || mbomItem.uniqueId;
				rowIdsToUpdateConflicts.push(rowId);
			}

			this.removeGlyphForSeveralRows(rowIdsToUpdateConflicts);
		}
	});
});
