define([
	'dojo/_base/declare'
],
function(declare) {
	return declare(null, {
		//TODO: rename to _findObj
		findObj: null,

		constructor: function() {
			this.overrideFormatterToHighlight();
		},

		overrideFormatterToHighlight: function() {
			var originalFormatHander = this.formatter_Experimental.formatHandler;
			var self = this;
			var currentRowIndex;
			this.formatter_Experimental.formatHandler = function(layoutCell, storeValue, rowIndex) {
				var value = originalFormatHander.apply(this, arguments);
				//check if contains '<', e.g., for checkboxes, for img tags in time of editing of Quantity
				if ((!value && value !== 0) || (value.indexOf && value.indexOf('<') !== -1) || !self.findObj) {
					return value;
				}

				//need to escape back the value cause TreeGrid has code line below escaping that
				//value = (value && value.replace && this.grid.escapeHTMLInData) ? value.replace(/&/g, '&amp;').replace(/</g, '&lt;') : value;
				value = (value && value.replace) ? value.replace(/&amp;/g, '&').replace(/&lt;/g, '<') : value;

				var stringValue = value.toString();
				var lastMatchEnd = 0;
				var result = [];
				stringValue.replace(self.findObj.regExp, function(match, offset, targetString) {
					if (lastMatchEnd < offset) {
						result.push({value: targetString.slice(lastMatchEnd, offset)});
					}

					currentRowIndex = self.getRowIndex(self.findObj.currentRowId);
					result.push({value: match, found: true, current: self.findObj.currentOffset === offset &&
							layoutCell.field === self.findObj.currentColumnName && rowIndex === currentRowIndex
					});
					lastMatchEnd = offset + match.length;
					return match;
				});
				if (lastMatchEnd < stringValue.length) {
					result.push({value: stringValue.slice(lastMatchEnd)});
				}

				var highlightedResult = result.reduce(function(previousContent, currentItem) {
					var content = currentItem.value;
					if (content && content.replace) {
						//repeat TreeGrid escaping logic
						content = content.replace(/&/g, '&amp;').replace(/</g, '&lt;');
					}
					if (currentItem.found) {
						content = '<span class=\'found' + (currentItem.current ? ', currentFound' : '') + '\'>' + content + '</span>';
					}
					return previousContent + content;
				}, '');

				return highlightedResult;
			};
		},

		_refreshRow: function(rowId) {
			if (!rowId && rowId !== 0) {
				return;
			}
			var rowIndex = this.getRowIndex(rowId);
			this.grid_Experimental.updateRow(rowIndex);
		},

		//see a comment 'in Future we need to use formatter'
		//_getLayoutCellByColumnName: function(columnName) {
		//	return this.grid_Experimental.layout.cells.filter(function(cell) {
		//		return cell.field === columnName;
		//	})[0];
		//},

		findAll: function(searchExpression, isOnlyToClear) {
			var subRowFieldsToClear = this.findObj && this.findObj.subRowFields;
			var isSearchRequired = !isOnlyToClear && searchExpression;
			//note that gridItemIndex is not the same as rowIndex. Because rowIndex depends on current expanded rows.
			//E.g., if everything in Grid of 1000 items is collapse, e.g, root have 5 childs. The rowIndex of the fifth child will be 5.
			var matchIndexesByGridItemIndex = {};
			var i,
				gridItemsIdsArray,
				matchResult,
				isRowRefreshed,
				columnFormatter,
				columnName,
				columnIndex,
				k,
				l,
				cellValue,
				searchController,
				refreshedRows,
				columnNamesToSkip;

			// refresh rows from previous search
			this.findObj = null;
			columnNamesToSkip = ['c_conflict', 'c_planned', 'c_rec_status1', 'c_rec_status2'];

			if (subRowFieldsToClear) {
				refreshedRows = {};

				for (i = 0; i < subRowFieldsToClear.length; i++) {
					if (!refreshedRows[subRowFieldsToClear[i].rowId]) {
						this._refreshRow(subRowFieldsToClear[i].rowId);

						refreshedRows[subRowFieldsToClear[i].rowId] = true;
					}
				}
			}

			if (isSearchRequired) {
				gridItemsIdsArray = this.items_Experimental.getAllId();

				this.findObj = searchController = {
					regExp: new RegExp(this._escapeRegExp(searchExpression), 'gi'),
					//TODO: rename subRowFields.
					subRowFields: [],
					foundMatches: [],
					activeIndex: -1,
					currentOffset: null,
					currentRowId: null,
					currentColumnName: null
				};

				for (i = 0; i < gridItemsIdsArray.length; i++) {
					isRowRefreshed = false;
					var rowId = gridItemsIdsArray[i];

					for (k = 0; k < this.grid_Experimental.nameColumns.length; k++) {
						columnName = this.grid_Experimental.nameColumns[k];
						if (columnNamesToSkip.indexOf(columnName) !== -1) {
							continue;
						}
						columnIndex = this.getColumnIndex(columnName);
						cellValue = this.getCellValue(rowId, columnIndex);
						if ((!cellValue && cellValue !== 0) || (this.isEbomOnlyAssembly && this.isEbomOnlyAssembly(columnName, cellValue))) {
							continue;
						}

						//TODO: in Future we need to use formatter, because getCellValue return a value without calling of formatter.
						//for now for float formatter is not working in grid for user. We haven't dates by default in MBOM
						//To test: using 1000000015 value (EBOM only rec. status), it has a formatter.
						//example to write a code using formatter below:
						//layoutCell = this._getLayoutCellByColumnName(columnName);
						//columnFormatter = layoutCell.formatter;
						//formattedValue = columnFormatter ? columnFormatter.apply(layoutCell, [cellValue, rowIndex]) : cellValue;
						//if to implement: check if contains '<', e.g., for checkboxes, for img tags. we need to skip find if '<'

						matchResult = cellValue.toString().match(searchController.regExp);

						if (matchResult && matchResult.length) {
							for (l = 0; l < matchResult.length; l++) {
								if (!matchIndexesByGridItemIndex[i]) {
									matchIndexesByGridItemIndex[i] = [];
								}
								matchIndexesByGridItemIndex[i].push(searchController.foundMatches.length);
								searchController.foundMatches.push({rowFieldIndex: searchController.subRowFields.length, matchIndex: l});
							}
							searchController.subRowFields.push({columnName: columnName, cellValue: cellValue, rowId: rowId,
								formatter: columnFormatter});

							if (!isRowRefreshed) {
								this._refreshRow(rowId);
								isRowRefreshed = true;
							}
						}
					}
				}

				searchController.matchIndexesByGridItemIndex = matchIndexesByGridItemIndex;
				return searchController.foundMatches.length;
			}

			return 0;
		},

		findNext: function(isUp, targetMatchIndex) {
			var searchController,
				matchCount,
				matchInfo,
				rowField,
				formattedValue,
				previousRowId,
				substringPosition,
				stringMatchIndex,
				searchResult,
				newActiveIndex,
				parentRowId,
				parentRowIdsOrdered;

			searchController = this.findObj;
			matchCount = searchController.foundMatches.length;
			if (!matchCount) {
				return;
			}
			if (searchController.activeIndex === null) {
				newActiveIndex = 0;
			} else {
				newActiveIndex = Math.max(0, Math.min(targetMatchIndex, matchCount));
			}
			matchInfo = searchController.foundMatches[newActiveIndex];
			rowField = searchController.subRowFields[matchInfo.rowFieldIndex];
			formattedValue = rowField.formatter ? rowField.formatter(rowField.cellValue) : rowField.cellValue;
			previousRowId = searchController.currentRowId;
			substringPosition = null;
			stringMatchIndex = 0;

			// finding searchValue position in fieldValue
			searchController.regExp.lastIndex = 0;

			while ((searchResult = searchController.regExp.exec(formattedValue)) !== null) {
				if (stringMatchIndex === matchInfo.matchIndex) {
					substringPosition = searchResult.index;
					break;
				}

				stringMatchIndex++;
			}

			searchController.activeIndex = newActiveIndex;
			searchController.currentRowId = rowField.rowId;
			searchController.currentColumnName = rowField.columnName;
			searchController.currentOffset = substringPosition;

			// cleanup previously selected match
			if ((previousRowId || previousRowId === 0) && previousRowId !== rowField.rowId) {
				this._refreshRow(previousRowId);
			}
			this._refreshRow(searchController.currentRowId);

			//expand found row and its parents
			parentRowIdsOrdered = [];
			parentRowId = searchController.currentRowId;
			while (parentRowId || parentRowId === 0) {
				parentRowId = this.getParentId(parentRowId);
				if (parentRowId || parentRowId === 0) {
					parentRowIdsOrdered.push(parentRowId);
				}
			}
			parentRowIdsOrdered.reverse();
			parentRowIdsOrdered.map(function(rowId) {
				this.grid_Experimental.expand(rowId);
			}.bind(this));

			//select found row and scroll to it
			this.setSelectedRow(searchController.currentRowId, false, true);
		},

		_escapeRegExp: function(str) {
			//escape function from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
			return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		}
	});
});
