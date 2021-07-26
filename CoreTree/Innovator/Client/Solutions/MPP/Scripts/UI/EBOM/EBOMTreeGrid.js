define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'MPP/UI/BOM/BOMGridCommon',
	'MPP/Model/PartConfig'
],
function(declare, connect, BOMGridCommon, partConfig) {
	var connectId = 'ebom_grid';

	return declare('Aras.Client.Controls.MPP.EBOMGrid', [BOMGridCommon], {
		constructor: function(initialArguments) {
		},

		initTree: function(forceRequest, optionalParameters) {
			this.inherited(arguments);
			var gridInitialDataXml, errorString;

			optionalParameters = optionalParameters || {};

			if (this._grid) {
				this._rememberExpanded();
			} else {
				this.createTree();
			}

			this.itemToRequest.setID(this.producedPartId);
			this.itemToRequest.setProperty('is_phantom', this.producedPartIsPhantom ? '1' : '0');
			
			//Modify by tengz
			//在检验项目与工时定额页面会实例化data变量,但不会读取MBOM与EBOM数据,所以此处要增加判断this.data.ebomItems
			//if (forceRequest || !this.data) {
			if (forceRequest || !this.data||!this.data.ebomItems) {
				if (this._expandedConsumedIds.length) {
					this.itemToRequest.setProperty('ebom_expanded_item_numbers', this._expandedConsumedIds.join('|'));
				} else {
					this.itemToRequest.setProperty('ebom_expanded_item_numbers', null);
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

						// set MBomGrid data from responce
						this.data = {
							mbomGridHeader: responceItem.getProperty('mbomGridHeader'),
							ebomGridHeader: responceItem.getProperty('ebomGridHeader'),
							mbomItems: mbomItems,
							ebomItems: ebomItems
						};

						this.refreshItemsUidHash();
						this.loadNestedPlansIntoDataModel({reloadExisting: !optionalParameters.isViewReload});

						errorString = responceItem.getProperty('execution_error');
					}.bind(this))
					.catch(function(xhr) {
						var itemError = this.aras.newIOMItem();

						itemError.loadAML(xhr.responseText);
						this.aras.AlertError(itemError);
					}.bind(this));
			}

			gridInitialDataXml = this.data.ebomGridHeader;

			if (gridInitialDataXml) {
				if (this._isHeaderCreated) {
					this._grid.removeAllRows();
					this._grid.addXMLRows(gridInitialDataXml);
				} else {
					this._grid.initXML(gridInitialDataXml);
					//itemToRequest.setProperty('get_only_rows', '1');
					this._isHeaderCreated = true;
				}

				// error code is here, because it allows to show user empty grid before alertDialog
				if (errorString) {
					this.aras.AlertError(errorString);
				}
			}
		},

		createTree: function() {
			this.controlsFactory.createControl('MPP.UI.MPPTreeGridContainer', {
				connectId: connectId, canEdit_Experimental: function() {
					return false;
				}
			}, function(control) {
				//disable sorting
				control.grid_Experimental.doheaderclick = function() { };

				this._grid = control;
				control.setMultiselect(false);

				this.controlsFactory.on(control, {
					gridXmlLoaded: function(rowId) {
						var rowItems = this.data.ebomItems || [];

						if (rowItems.length) {
							var decoratedItems = this._grid.decorateRowItemsBeforeAdd(rowItems, '', '', true);
							var i;

							for (i = 0; i < decoratedItems.length; i++) {
								this._grid.items_Experimental.add(decoratedItems[i], '');
							}
							this._grid.grid_Experimental.render();
						}
					}.bind(this),
					gridDoubleClick: function(rowId) {
						this._onOpenRowItem(rowId);
					}.bind(this),
					gridMenuInit: function() {
						this._onGridMenuInit();
					}.bind(this)
				});

				this.refreshEnumerationIndex();
			}.bind(this));

			this.eventHandlers.push(connect.connect(this._grid.grid_Experimental, 'onStyleRow', this, function(row) {
				var storeItem = this._grid.grid_Experimental.getItem(row.index);

				if (storeItem && storeItem.userData$Gm) {
					var userData = storeItem.userData$Gm;
					var parentItemIndex = storeItem.parent && storeItem.parent[0] && this._grid.getRowIndex(storeItem.parent[0]);
					var parentItem = parentItemIndex !== null && parentItemIndex !== undefined && this._grid.grid_Experimental.getItem(parentItemIndex);
					var parentUserData = parentItem && parentItem.userData$Gm;

					if (parentUserData && parentUserData.buy === '1') {
						row.customClasses += ' forBuy';
					}

					if (userData.bad === '1') {
						row.customClasses += ' bad';
					}

					if (userData.removed === '1') {
						row.customClasses += ' removed';
					}
				}
			}));

			this.inherited(arguments);
		},

		updateReconciliationStatuses: function() {
			var updatePromise = this.inherited(arguments);

			updatePromise.then(function() {
				this.setFieldValuesFromItems(['c_rec_status1', 'c_rec_status2'], this.data.ebomItems);
			}.bind(this));
		},

		_rememberExpanded: function() {
			//id isn't persistent between refreshes, to make it unique, need to collect all parents, e.g., itemNumbers and we can calculate hash of all
			// parent ids in Future (ItemNumber isn't unique if one part with PP exists in several places). And itemNumberId can be the same for different
			// generation, so, better to use PartBOM id.
			var gridContainer = this._grid;
			var gridControl = gridContainer.grid_Experimental;
			var expandedRowIds = gridContainer.getOpenedItems();
			var itemsByUid = (this.data && this.data.ebomItemsByUid) || {};
			var itemsByIdentity = gridControl.store._itemsByIdentity;
			var itemNumberColumnIndex = gridContainer.getColumnIndex('c_item_number');
			var itemNumber, ebomItem, rowId, i;

			this._expandedConsumedIds = [];

			for (i = 0; i < expandedRowIds.length; i++) {
				rowId = expandedRowIds[i];
				ebomItem = itemsByUid[rowId];
				itemNumber = ebomItem ? ebomItem.fields[itemNumberColumnIndex] :
					(itemsByIdentity[rowId] && gridContainer.getCellValue_Experimental(rowId, 'c_item_number'));

				if (itemNumber) {
					this._expandedConsumedIds.push(itemNumber);
				}

				if (ebomItem) {
					this._expandedConsumedIds.push(ebomItem.fields[itemNumberColumnIndex]);
					ebomItem.expanded = 'true';
				}
			}
		},

		_onOpenRowItem: function(rowId) {
			rowId = rowId || this._grid.getSelectedId();

			if (rowId) {
				var partId = this._grid.getUserData(rowId, 'id');

				this.aras.uiShowItem(partConfig.part_it_name, partId);
			}
		},

		_onGridMenuInit: function() {
			var contextMenu = this._grid.getMenu();

			contextMenu.removeAll();

			contextMenu.add(null, this.uiUtils.getResource('EBOMTreeGridMenu.viewPart'), null, {
				onClick: function(rowId) {
					this._onOpenRowItem(rowId);
				}.bind(this)
			});

			contextMenu.menu.startup();
		}
	});
});
