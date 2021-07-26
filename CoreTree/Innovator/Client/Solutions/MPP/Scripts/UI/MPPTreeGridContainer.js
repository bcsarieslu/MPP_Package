define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'Aras/Client/Controls/Public/TreeGridContainer',
	'MPP/Model/ModelEnums',
	'./Find/TreeGridContainerExt'
],
function(declare, connect, TreeGridContainer, Enums, TreeGridContainerExt) {
	return declare('Aras.Client.Controls.MPP.MPPTreeGridContainer', [TreeGridContainer, TreeGridContainerExt], {
		idGenerator: null,

		constructor: function(initialArguments) {
			this.idGenerator = {
				previousId: 0,
				getId: function() {
					return ++this.previousId;
				},
				drop: function() {
					this.previousId = 0;
				},
				setStartIndex: function(startIndex) {
					if (typeof startIndex === 'number') {
						this.previousId = startIndex;
					}
				}
			};
		},

		// the original function of TreeGridContainer.js works wrong if column order of root column is not the first.
		// So, workaround applied. (see comment in original method: issue order)
		getColumnIndex: function(columnName) {
			switch (columnName) {
				case 'c_item_number_mbom':
					return 0;
				case 'c_conflict':
					return 1;
				default:
					return this.inherited(arguments);
			}
		},

		// the original function of TreeGridContainer.js works wrong if column order of root column is not the first.
		// So, workaround applied. (see comment in original method: issue order)
		getSelectedCell: function() {
			var focusManager = this.grid_Experimental.focus;
			var columnIndex = focusManager.cell.index;

			if (columnIndex === 0) {
				columnIndex = 1;
			}

			if (columnIndex === 1) {
				columnIndex = 0;
			}

			return this.cells2(focusManager.rowIndex, columnIndex);
		},

		addXMLRows_Experimental: function() {
			this.inherited(arguments);

			if (!this._store) {
				this._store = this.grid_Experimental.store;
			}
		},

		translateProperties: function(targetItems, translationDictionary) {
			if (targetItems && translationDictionary) {
				var propertyName, originName, propertyValue, currentItem, propertyTranslation, i;

				targetItems = Array.isArray(targetItems) ? targetItems : [targetItems];

				for (propertyName in translationDictionary) {
					propertyTranslation = translationDictionary[propertyName];
					originName = propertyTranslation.translation;

					for (i = 0; i < targetItems.length; i++) {
						currentItem = targetItems[i];
						propertyValue = currentItem[propertyName];

						if (propertyValue !== undefined) {
							if (propertyTranslation.subDictionary) {
								this.translateProperties([propertyValue], propertyTranslation.subDictionary);
							}

							currentItem[originName] = propertyValue;
							delete currentItem[propertyName];
						}
					}
				}
			}
		},

		decorateRowItemsBeforeAdd: function(rowItems, parentId, parentTreePath, translationDictionary) {
			var resultItems = [];
			var isTranslationRequired = Boolean(translationDictionary);

			rowItems = rowItems ? (Array.isArray(rowItems) ? rowItems : [rowItems]) : [];

			if (rowItems.length) {
				var expandosOpenStates = this.grid_Experimental.openedExpandos;
				var currentItem, treePath, decoratedItem,
					childItems, isRowExpanded, i;

				parentTreePath = parentTreePath ? parentTreePath + '/' : '';

				if (isTranslationRequired) {
					this.translateProperties(rowItems, translationDictionary);
				}

				for (i = 0; i < rowItems.length; i++) {
					currentItem = rowItems[i];
					treePath = parentTreePath + i;
					isRowExpanded = currentItem.expanded === 'true';

					decoratedItem = this._getRowItemFromJson_Experimental(currentItem, parentId, treePath);
					childItems = currentItem.children || [];

					if (childItems.length) {
						if (isRowExpanded) {
							expandosOpenStates[decoratedItem.uniqueId] = true;
						} else {
							delete expandosOpenStates[decoratedItem.uniqueId];
						}

						decoratedItem.children = this.decorateRowItemsBeforeAdd(childItems, decoratedItem.uniqueId, treePath, translationDictionary);
					}

					resultItems.push(decoratedItem);
				}
			}

			return resultItems;
		},

		importStoreItemsToJson: function(targetItems) {
			var resultItems = [];

			targetItems = targetItems ? (Array.isArray(targetItems) ? targetItems : [targetItems]) : this._store._arrayOfTopLevelItems;

			if (targetItems.length) {
				var gridFields = this.grid_Experimental.layout.cells;
				var storeItem, userData, propertyName, propertyValue, importedItem, fieldDescriptor, importedUserData, importedFields, i, j;

				for (i = 0; i < targetItems.length; i++) {
					storeItem = targetItems[i];

					userData = storeItem.userData$Gm;
					importedUserData = {};
					importedFields = [];
					var importedChildren = [];

					for (propertyName in userData) {
						propertyValue = userData[propertyName];

						if (propertyValue) {
							importedUserData[propertyName] = userData[propertyName];
						}
					}

					for (j = 0; j < gridFields.length; j++) {
						fieldDescriptor = gridFields[j];
						propertyValue = storeItem[fieldDescriptor.field][0];

						importedFields.push(typeof propertyValue === 'boolean' ? propertyValue : propertyValue.toString());
					}

					if (storeItem.children && storeItem.children.length) {
						importedChildren = this.importStoreItemsToJson(storeItem.children);
					}

					importedItem = {
						uniqueId: parseInt(storeItem.uniqueId),
						userdata: importedUserData,
						fields: importedFields,
						children: importedChildren
					};

					resultItems.push(importedItem);
				}
			}

			return resultItems;
		},

		updateRenderedRows: function(startRowIndex) {
			// updated version of dojox/grid/LazyTreeGrid._updateRenderedRows method
			var gridControl = this.grid_Experimental;

			startRowIndex = startRowIndex === undefined ? 0 : startRowIndex;

			if (gridControl._updateRenderedRows) {
				gridControl._updateRenderedRows(startRowIndex);
			} else {
				var renderedPages = gridControl.scroller.stack;
				var rowsPerPage = gridControl.rowsPerPage;
				var pageIndex, i;

				for (i = 0; i < renderedPages.length; i++) {
					pageIndex = renderedPages[i];

					if (pageIndex * rowsPerPage >= startRowIndex) {
						gridControl.updateRows(pageIndex * rowsPerPage, rowsPerPage);
					} else if ((pageIndex + 1) * rowsPerPage >= startRowIndex) {
						gridControl.updateRows(startRowIndex, (pageIndex + 1) * rowsPerPage - startRowIndex + 1);
					}
				}
			}
		},

		enumerateItems: function(targetItems, forceEnumeration) {
			targetItems = targetItems ? (Array.isArray(targetItems) ? targetItems : [targetItems]) : [];

			if (targetItems.length) {
				var currentItem, i;

				for (i = 0; i < targetItems.length; i++) {
					currentItem = targetItems[i];
					currentItem.id = (forceEnumeration || !currentItem.id) ? this.idGenerator.getId() : currentItem.id;
					currentItem.uniqueId = currentItem.id;

					if (currentItem.children) {
						this.enumerateItems(currentItem.children, forceEnumeration);
					}
				}
			}
		}
	});
});
