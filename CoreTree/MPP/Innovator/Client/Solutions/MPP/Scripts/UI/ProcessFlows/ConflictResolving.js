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

	

		_getCellValue: function(iconName, conflict) {
			return '<img class="status" src="../images/' + iconName + '.svg" ' + (conflict ? 'title=\'' + conflict.tooltip + '\'' : '') + '/>';
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

		_isEnableMy: function(conflict) {
			return conflict && conflict.state !== ConflictStates.UseMy;
		},

		_isEnableOther: function(conflict) {
			return conflict && conflict.state !== ConflictStates.UseOthers;
		},


		clickUseMy: function(rowId) {
			this._resolveConflict(rowId, true);
		},

		clickUseOthers: function(rowId) {
			this._resolveConflict(rowId, false);
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
