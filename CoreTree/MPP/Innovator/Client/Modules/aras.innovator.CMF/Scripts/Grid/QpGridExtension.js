/* global define, lang, CMF */
define([
	'dojo/_base/declare',
	'put-selector/put',
	'dojo/has',
	'dgrid/util/misc',
	'dojo/on',
	'dojo/query',
	'../CellEditors/CellEditor',
	'dojo/_base/kernel',
	'dijit/Tooltip',
	'dojox/html/entities'
], function (
	declare,
	put,
	has,
	miscUtil,
	on,
	query,
	CellEditor,
	kernel,
	Tooltip,
	entities
) {
	function replaceInvalidChars(str) {
		// Replaces invalid characters for a CSS identifier with hyphen,
		// as dgrid does for field names / column IDs when adding classes.
		return miscUtil.escapeCssIdentifier(str, '-');
	}

	var cellEditor = new CellEditor();

	function appendIfNode(parent, subNode) {
		if (subNode && subNode.nodeType) {
			parent.appendChild(subNode);
		}
	}

	function addRowSpan(table, span, startRow, column, id) {
		// loop through the rows of the table and add this column's id to
		// the rows' column
		for (var i = 1; i < span; i++) {
			table[startRow + i][column] = id;
		}
	}

	function subRowAssoc(subRows) {
		// Take a sub-row structure and output an object with key=>value pairs
		// The keys will be the column id's; the values will be the first-row column
		// that column's resizer should be associated with.

		var i = subRows.length;
		var l = i;
		var numCols = subRows[0].length;
		var table = new Array(i);

		// create table-like structure in an array so it can be populated
		// with row-spans and col-spans
		while (i--) {
			table[i] = new Array(numCols);
		}

		var associations = {};

		for (i = 0; i < l; i++) {
			var row = table[i];
			var subRow = subRows[i];

			// j: counter for table columns
			// js: counter for subrow structure columns
			for (var j = 0, js = 0; j < numCols; j++) {
				var cell = subRow[js];
				var k;

				// if something already exists in the table (row-span), skip this
				// spot and go to the next
				if (typeof row[j] !== 'undefined') {
					continue;
				}
				row[j] = cell.id;

				if (cell.rowSpan && cell.rowSpan > 1) {
					addRowSpan(table, cell.rowSpan, i, j, cell.id);
				}

				// colSpans are only applicable in the second or greater rows
				// and only if the colSpan is greater than 1
				if (i > 0 && cell.colSpan && cell.colSpan > 1) {
					for (k = 1; k < cell.colSpan; k++) {
						// increment j and assign the id since this is a span
						row[++j] = cell.id;
						if (cell.rowSpan && cell.rowSpan > 1) {
							addRowSpan(table, cell.rowSpan, i, j, cell.id);
						}
					}
				}
				associations[cell.id] = subRows[0][j].id;
				js++;
			}
		}

		return associations;
	}

	return declare('CmfGridExtension', null, {
		//		The minimum number of rows to request at one time.
		minRowsPerPage: 2,

		// farOffRemoval: Integer
		//		Defines the minimum distance (in pixels) from the visible viewport area
		//		rows must be in order to be removed.  Setting to Infinity causes rows
		//		to never be removed.
		//NOTE: farOffRemoval just was increased in 10 times. The bug was reproduced before increasing - scroll in IE 11 often -> IE hangs.
		//NOTE: There was infinite growing slow memory usage In Task Manager (perhaps it was fixed in 1d7c4f6353e3923dd9148efe94f1c7170e06bf36).
		farOffRemoval: 20000,

		bufferRows: 5,

		maxRowsPerPage: 2,

		_columnsSaved: [],

		// rowHeight: Number
		//		Average row height, computed in renderQuery during the rendering of
		//		the first range of data.
		rowHeight: 0,

		// minWidth: Number
		//		Minimum column width, in px.
		minWidth: 20,

		//we should override this dGrid property since we override styles to have "fixed" row widths, but not to stretch all columns
		adjustLastColumn: false,

		_selectedRowId: null,

		//to use in Grid.js, cellEditor is Singleton
		cellEditor: cellEditor,

		columnIdsOrdered: null,

		findObj: null,

		cmfTooltips: null,

		constructor: function () {},

		postCreate: function () {
			this.inherited(arguments);
			var self = this;
			this.on('td.dgrid-cell:dgrid-cellfocusin', function (event) {
				self._selectedRowId = event.cell.row.id;
			});

			this.cmfTooltips = new Tooltip({
				connectId: 'grid',
				selector:
					'td.referenced div.binding-area, td.stale-reference div.binding-area, td.missed-reference div.binding-area,' +
					'td.non-tracking-reference div.binding-area',
				position: ['below', 'above'],
				getContent: function (target) {
					return (
						'<span><pre>' +
						CMF.Utils.getResource(
							'tooltip_' + self.getCellBindingClass(target.parentNode)
						) +
						'</pre></span>'
					);
				}
			});
		},

		cellBySubIndex: function (target, columnId, subIndexOfSubRowIndex) {
			// summary:
			//		Get the cell object by node, or event, id, plus a columnId
			//
			//subRowIndex: int
			//	example: one cell in the column has 3 rowSpans and its subRowIndex = 0; The below cell in the column has 2 rowSpans. So, to calculate
			//	the below (we'll add + 1 at the end of calc.) cell subRowIndex we need to calculate: subRowIndex + (rowSpans - 1) + 1 = 0 + (3 - 1) + 1 = 3;
			//	so, let's introduce "subIndexOfSubRowIndex": all the numbers between sibling subRowIndexes including one of subRowIndex.
			//	Each subRow has count of subIndexes equal to its rowSpans.
			//	In the example above: 0, 1, 2 are subIndexes of the first subRow. 3, 4 are subIndexes of the second subRow.
			//	First subIndex always equals to subRowIndex, and the last subIndex always equals to (subRowIndex + rowSpan - 1).

			if (target.column && target.element) {
				return target;
			}

			if (target.target && target.target.nodeType) {
				// event
				target = target.target;
			}
			var element;
			var cell;

			if (target.nodeType) {
				do {
					if (this._rowIdToObject[target.id]) {
						break;
					}
					var colId = target.columnId;
					if (colId) {
						columnId = colId;
						element = target;
						break;
					}
					target = target.parentNode;
				} while (target && target !== this.domNode);
			}
			var row;
			if (!element && typeof columnId !== 'undefined') {
				row = this.row(target);
				var rowElement = row && row.element;
				var elem;

				if (rowElement) {
					var elements = rowElement.getElementsByTagName('td');
					var i;
					if (subIndexOfSubRowIndex !== 'last') {
						var isReturnFirstCell = subIndexOfSubRowIndex === 'first';
						var firstElemSubIndex;
						var lastElemSubIndex;
						var isElemContainsSubIndex;

						for (i = 0; i < elements.length; i++) {
							elem = elements[i];

							if (elem.columnId === columnId) {
								if (isReturnFirstCell) {
									element = elem;
									break;
								}

								firstElemSubIndex = elem.subRowIndex;
								lastElemSubIndex = elem.subRowIndex + elem.rowSpan - 1;
								isElemContainsSubIndex =
									firstElemSubIndex <= subIndexOfSubRowIndex &&
									subIndexOfSubRowIndex <= lastElemSubIndex;
								if (isElemContainsSubIndex) {
									element = elem;
									break;
								}
							}
						}
					} else {
						for (i = elements.length - 1; i >= 0; i--) {
							elem = elements[i];
							if (elem.columnId === columnId) {
								element = elem;
								break;
							}
						}
					}
				}
			}
			if (target !== null) {
				cell = {
					row: row || this.row(target),
					column: columnId && this.column(columnId),
					element: element
				};
				return cell;
			}
		},

		cellByCellId: function (row, cellId) {
			var element;
			var rowElement = row && row.element;
			var elem;
			var cell;

			if (rowElement) {
				var elements = rowElement.getElementsByTagName('td');
				for (var i = 0; i < elements.length; i++) {
					elem = elements[i];
					if (elem.cellId === cellId) {
						element = elem;
						break;
					}
				}
			}

			cell = {
				row: row,
				element: element,
				column: element && element.columnId && this.column(element.columnId)
			};
			return cell;
		},

		cellsByNodeId: function (rowId, nodeId) {
			var toReturn = [];

			if (!nodeId || !rowId) {
				return toReturn;
			}

			var elements;
			var row = this.row(rowId);
			var rowElement = row && row.element;
			var elem;

			if (rowElement) {
				elements = rowElement.getElementsByTagName('td');
				for (var i = 0; i < elements.length; i++) {
					elem = elements[i];
					if (elem.nodeId === nodeId) {
						toReturn.push(elem);
					}
				}
			}

			return toReturn;
		},

		selectCell: function (rowId, cellId, isMultiselect, isToUnselect) {
			var row = this.getRowObject(rowId);
			var cellToFocus = this.cellByCellId(row, cellId);
			if (cellToFocus.element) {
				this._focusOnNode(
					cellToFocus.element,
					false,
					null,
					isMultiselect,
					isToUnselect
				);
				this._selectedRowId = rowId;
			}
		},

		getRowObject: function (rowId) {
			var row = this.row(rowId);
			if (!row.element) {
				//logic to move to the row if not rendered (because of LazyRender)
				var storeIndex = this._renderedCollection.storage.index;
				var selectedRowId = this._selectedRowId;
				/* jshint ignore:start */
				if (!selectedRowId) {
					for (var any in storeIndex) {
						selectedRowId = any;
						break;
					}
				}
				/* jshint ignore:end */
				var rowIndexToSelect = storeIndex[rowId];
				var selectedRowIndex = storeIndex[selectedRowId] || 0;
				var selectedRow = this.row(selectedRowId);
				var steps = rowIndexToSelect - selectedRowIndex;

				this._move(selectedRow, steps, 'dgrid-row', true);
				row = this.row(rowId);
			}
			return row;
		},

		createSpecificRow: function (tag, each, subRows, object) {
			// summary:
			//		Generates the grid for each row (used by renderHeader and and renderRow)
			var row = put('table.dgrid-row-table[role=presentation]');
			var tbody = has('ie') < 9 ? put(row, 'tbody') : row;
			var tr;
			var si;
			var sl;
			var i; // iterators
			var subRowLength;
			var subRow;
			var column;
			var cell; // used inside loops
			var subRowField;
			var isHeader = tag === 'th';

			// Allow specification of custom/specific subRows, falling back to
			// those defined on the instance.
			subRows = subRows || this.subRows;

			if (!isHeader) {
				subRows = object.subrs;
			}

			for (si = 0, sl = subRows.length; si < sl; si++) {
				subRow = subRows[si];
				tr = put(tbody, 'tr');
				if (subRow.className) {
					put(tr, '.' + subRow.className);
				}

				subRowLength = subRow.length;
				if (!isHeader) {
					subRowLength = this._columnsSaved.length;
				}
				for (i = 0; i < subRowLength; i++) {
					// iterate through the columns
					column = !isHeader ? undefined : subRow[i];
					if (isHeader && si === 0) {
						this._columnsSaved[i] = column;
					}

					if (!column) {
						column = this._columnsSaved[i];
						subRowField = subRow[column.field];
						if (subRowField === undefined) {
							continue;
						}
					}
					cell = this.createRowCell(
						subRowField,
						column,
						si,
						isHeader,
						each,
						tag,
						object
					);

					// add the td to the tr at the end for better performance
					tr.appendChild(cell);
				}
			}

			return row;
		},

		getSubRowFieldBindingClass: function (subRowField) {
			if (subRowField._treeItem && subRowField._treeItem.isCandidate) {
				return '';
			}

			if (subRowField.isReferenced) {
				return '.referenced';
			}
			if (subRowField.isStaleReference) {
				return '.stale-reference';
			}
			if (subRowField.isMissedReference) {
				return '.missed-reference';
			}
			if (subRowField.isNonTrackingReference) {
				return '.non-tracking-reference';
			}
			return '';
		},

		getCellBindingClass: function (td) {
			var bindingClasses = [
				'referenced',
				'stale-reference',
				'missed-reference',
				'non-tracking-reference'
			];
			for (var i = 0; i < bindingClasses.length; i++) {
				if (td.classList.contains(bindingClasses[i])) {
					return bindingClasses[i];
				}
			}
			return '';
		},

		getFlaggedLabel: function (subRowField) {
			var label = '';
			if (subRowField.flagged.isBindingWrong) {
				label = CMF.Utils.getResource('tooltip_flagged_is_binding_wrong');
			}

			if (subRowField.flagged.isBindingNotExist) {
				label = CMF.Utils.getResource('tooltip_flagged_is_binding_not_exist');
			}

			if (subRowField.flagged.isStructureWrong) {
				label = CMF.Utils.getResource('tooltip_flagged_is_structure_wrong');
			}

			if (subRowField.flagged.isBadSortOrder) {
				label = CMF.Utils.getResource('tooltip_flagged_is_bad_sort_order');
			}

			if (subRowField.flagged.isBindingNeedRemove) {
				label = CMF.Utils.getResource('tooltip_flagged_is_binding_need_remove');
			}

			label =
				'<div style="font-size:12px; font-family:Tahoma;color:#444444;">' +
				label +
				'</div>';

			return label;
		},

		createRowCell: function (
			subRowField,
			column,
			si,
			isHeader,
			each,
			tag,
			object
		) {
			var id = column.id;
			var extraClasses = column.field
				? '.field-' + replaceInvalidChars(column.field)
				: '';
			var className =
				typeof column.className === 'function'
					? column.className(object)
					: column.className;
			if (className) {
				extraClasses += '.' + className;
			}
			var display = true;
			if (!isHeader) {
				if (subRowField.isCandidate) {
					extraClasses += '.candidate';
				}

				if (subRowField.flagged) {
					extraClasses += '.flagged';
				}

				if (subRowField.isEmpty) {
					extraClasses += '.emptyCell';
				} else {
					extraClasses += this.getSubRowFieldBindingClass(subRowField);
				}
			} else {
				extraClasses += column.isLowHeader ? ' lowHeader' : ' band';
				if (!column.isLowHeader && column.display === false) {
					display = false;
				}
			}
			var cell = put(
				tag +
					'.dgrid-cell' +
					(id ? '.dgrid-column-' + replaceInvalidChars(id) : '') +
					extraClasses.replace(/ +/g, '.') +
					'[role=' +
					(isHeader ? 'columnheader' : 'gridcell') +
					']' +
					(!isHeader ? '[data-cellId=' + subRowField.id + ']' : '')
			);
			cell.columnId = id;
			var colSpan = column.colSpan;
			if (colSpan) {
				cell.colSpan = colSpan;
			}
			var rowSpan = column.rowSpan;
			if (!display) {
				cell.style.display = 'none';
			}
			if (rowSpan) {
				cell.rowSpan = rowSpan;
			}

			if (!isHeader && subRowField.flagged) {
				var _self = this;
				cell.onmouseover = function (param) {
					var label = _self.getFlaggedLabel(subRowField);
					Tooltip.show(label, param.currentTarget);
				};
				cell.onmouseout = function (param) {
					Tooltip.hide(param.currentTarget);
				};
			}

			if (!isHeader) {
				this.setAdditionCellProperty(cell, si, subRowField);
			}

			if (isHeader) {
				each(cell, column, si);
			} else {
				this.renderSpecificCell(cell, subRowField, this, column);
			}

			return cell;
		},

		setAdditionCellProperty: function (cell, si, subRowField, updateMode) {
			cell.subRowIndex = si;
			cell.cellId = subRowField.id;
			cell.nodeId = subRowField.nodeId;
			cell.isEmpty = subRowField.isEmpty;
			cell.readOnly = subRowField.readOnly;
			cell.fieldId = subRowField.propertyId;
			cell.isCandidate = subRowField.isCandidate;
			var rspan = subRowField.rowSpan;

			if (subRowField.discoverOnly === '1') {
				cell.classList.add('restricted');
			} else if (
				subRowField.permissionId &&
				subRowField.hasPrivatePermission()
			) {
				cell.classList.add('alternative_permission');
			}

			if (rspan) {
				cell.rowSpan = rspan;
			}
			if (updateMode) {
				cell.classList.remove('dgrid-focus');
			}
			if (subRowField.isEmpty) {
				if (updateMode) {
					cell.classList.remove('editableCell');
				}

				if (subRowField.parentNodeId && !subRowField.parentIsCandidate) {
					cell.classList.add('editableCell');
				}
				cell.parentNodeId = subRowField.parentNodeId;
				cell.propertyId = subRowField.propertyId;
			}
		},

		renderSpecificCell: function (td, subRowField, self, column) {
			var style = subRowField ? subRowField.cmfStyleString : null;
			var data = subRowField ? subRowField.value : null;

			if (column && column.formatter) {
				data = column.formatter(data);
			}

			var escapedContent;
			var innerHTML;
			//self._defaultRenderCell.call(column, object, data, td, options);
			if (data && subRowField && self.findObj) {
				var lastMatchEnd = 0;
				var result = [];
				data.replace(self.findObj.regExp, function (
					match,
					offset,
					targetString
				) {
					if (lastMatchEnd < offset) {
						result.push({ value: targetString.slice(lastMatchEnd, offset) });
					}

					result.push({
						value: match,
						found: true,
						current:
							self.findObj.currentOffset === offset &&
							subRowField.id === self.findObj.currentFieldId
					});
					lastMatchEnd = offset + match.length;
					return match;
				});
				if (lastMatchEnd < data.length) {
					result.push({ value: data.slice(lastMatchEnd) });
				}
				escapedContent = result.reduce(function (previousContent, currentItem) {
					var content = entities.encode(currentItem.value);
					if (currentItem.found) {
						content =
							"<span class='found" +
							(currentItem.current ? ', currentFound' : '') +
							"'>" +
							content +
							'</span>';
					}
					return previousContent + content;
				}, '');
			} else {
				escapedContent = entities.encode(data);
			}

			if (style) {
				/*
				 * "replace" is used to make font-family working, e.g., with "Arial, 'Helvetica Neue',
				 * Helvetica, sans-serif". To remove if we forbid using ' inside font-family.
				 */
				style = style.replace(/'/g, '"');
				td.style.cssText = style;
			}
			//NOTE: "<span> + ..." can hurt perfomance, but this is to allow to show, e.g., background color of cell, make it selectable I don't see any other way.
			var dataType = self.getDataTypeFromCell(subRowField);
			if (dataType) {
				switch (dataType) {
					case 'file':
						innerHTML = self.renderFileCell(td, escapedContent);
						break;
					case 'image':
						innerHTML = self.renderImageCell(td, escapedContent);
						break;
					default:
						innerHTML = self.renderDefaultCell(td, escapedContent);
						break;
				}
			} else {
				innerHTML = self.renderDefaultCell(td, escapedContent);
			}

			if (this.getSubRowFieldBindingClass(subRowField)) {
				innerHTML += "<div class='binding-area'></div>";
			}
			td.innerHTML = innerHTML;
		},

		renderRow: function (object, options) {
			var row = this.createSpecificRow(
				'td',
				null,
				options && options.subRows,
				object
			);
			// row gets a wrapper div for a couple reasons:
			// 1. So that one can set a fixed height on rows (heights can't be set on <table>'s AFAICT)
			// 2. So that outline style can be set on a row when it is focused,
			// and Safari's outline style is broken on <table>
			return put('div[role=row]>', row);
		},

		getDataTypeFromCell: function (subRowField) {
			if (subRowField && subRowField._property) {
				return subRowField._property.dataType;
			} else {
				return null;
			}
		},

		updateCell: function (row, sourceTableItem) {
			var rowObject = this.getRowObject(row.id);
			var tableItem;
			var subrowIndex;
			var rowData = rowObject.data;
			for (var j = 0; j < rowData.subrs.length; j++) {
				tableItem = rowData.subrs[j][sourceTableItem.propertyId];
				if (tableItem && tableItem.id === sourceTableItem.id) {
					subrowIndex = j;
					break;
				}
			}

			if (rowObject.element) {
				var elements = rowObject.element.getElementsByTagName('td');
				for (var i = 0; i < elements.length; i++) {
					var elem = elements[i];
					if (elem.cellId === sourceTableItem.id) {
						var columnId = elem.columnId;
						var existColumn = this.columns[columnId];
						//elem.removeNode();
						var newElem = this.createRowCell(
							sourceTableItem,
							existColumn,
							subrowIndex,
							false,
							null,
							'td'
						);

						elem.parentNode.replaceChild(newElem, elem);
						break;
					}
				}
			}
		},

		findTdTagByField: function (tr, fieldId) {
			for (var i = 0; i < tr.children.length; i++) {
				if (tr.children[i].fieldId === fieldId) {
					return tr.children[i];
				}
			}
			return undefined;
		},

		findNextTdTag: function (tr, fieldId) {
			for (var i = 0; i < tr.children.length; i++) {
				if (tr.children[i].fieldId === fieldId) {
					if (i + 1 < tr.children.length) {
						return tr.children[i + 1];
					} else {
						return undefined;
					}
				}
			}
			return undefined;
		},

		updateStorage: function (updatedRow) {
			var index = this.collection.storage.index[updatedRow.id];
			this.collection.storage.fullData[index] = updatedRow;
			this._rowIdToObject['grid-row-' + updatedRow.id] = updatedRow;
		},

		craftyUpdateRow: function (updatedRow) {
			var rowObject = this.getRowObject(updatedRow.id);
			var trTags = rowObject.element.getElementsByTagName('tr');
			for (var i = 0; i < updatedRow.subrs.length; i++) {
				if (i < trTags.length) {
					var tr = trTags[i];
					var lastInsertTdTag = null;
					for (var j = 0; j < this.columnIdsOrdered.length; j++) {
						var column = this.columns[this.columnIdsOrdered[j]];
						var model = updatedRow.subrs[i][column.field];
						var td = this.findTdTagByField(tr, column.field);
						if (!td && column.additPropertyId) {
							td = this.findTdTagByField(tr, column.additPropertyId);
						}
						if (!model) {
							if (!td) {
								continue;
							}
							td.parentNode.removeChild(td);
							continue;
						}
						if (!td) {
							var newElem = this.createRowCell(
								model,
								column,
								i,
								false,
								null,
								'td'
							);
							if (!lastInsertTdTag) {
								if (tr.children.length > 0) {
									tr.insertBefore(newElem, tr.children[0]);
								} else {
									tr.appendChild(newElem);
								}
							} else {
								var beforeNode = lastInsertTdTag.nextSibling; //this.findNextTdTag(tr, lastInsertTdTag.fieldId);
								if (!beforeNode) {
									tr.appendChild(newElem);
								} else {
									tr.insertBefore(newElem, beforeNode);
								}
							}
							lastInsertTdTag = newElem;
							continue;
						}

						if (td.isEmpty && model.isEmpty) {
							// check only on rowSpan
							this.setAdditionCellProperty(td, i, model, true);
							lastInsertTdTag = td;
						} else {
							if (td.cellId === model.id) {
								// check only on rowSpan
								this.setAdditionCellProperty(td, i, model, true);
								lastInsertTdTag = td;
							} else {
								// generate new node and replace it
								var elem = this.createRowCell(
									model,
									column,
									i,
									false,
									null,
									'td'
								);
								td.parentNode.replaceChild(elem, td);
								lastInsertTdTag = elem;
							}
						}
					}
				} else {
					//insert new row
					this.insertLastRow(updatedRow, i, trTags[0].parentNode);
				}
			}
			if (updatedRow.subrs.length < trTags.length) {
				for (i = trTags.length - 1; i >= updatedRow.subrs.length; i--) {
					trTags[i].parentNode.removeChild(trTags[i]);
				}
			}
			this.updateStorage(updatedRow);
		},

		insertLastRow: function (updatedRow, subRowIndex, parentNode) {
			var newTr = document.createElement('tr');
			parentNode.appendChild(newTr);
			var lastSubrow = updatedRow.subrs[subRowIndex];
			if (lastSubrow.className) {
				put(newTr, '.' + lastSubrow.className);
			}

			for (var j = 0; j < this.columnIdsOrdered.length; j++) {
				var column = this.columns[this.columnIdsOrdered[j]];
				var model = updatedRow.subrs[subRowIndex][column.field];
				if (!model) {
					continue;
				}
				var newElem = this.createRowCell(
					model,
					column,
					subRowIndex,
					false,
					null,
					'td'
				);
				newTr.appendChild(newElem);
			}
		},

		renderFileCell: function (td, innerHTML) {
			if (innerHTML) {
				var fileItem = parent.aras.itemsCache.getItem(innerHTML);
				if (fileItem) {
					var xmldom = parent.aras.createXMLDocument();
					xmldom.loadXML(fileItem.xml);
					var text = xmldom.selectSingleNode('Item/filename').text;
					return (
						'<span style="text-decoration: underline; display: inline; cursor: pointer;color:#3668b1">' +
						text +
						'</span>'
					);
				}
			}
			return this.renderDefaultCell(td, innerHTML);
		},

		renderImageCell: function (td, innerHTML) {
			if (innerHTML) {
				var newImg = parent.aras.IomInnovator.getFileUrl(
					innerHTML,
					parent.aras.Enums.UrlType.SecurityToken
				);
				return (
					'<div><span><img src="' +
					newImg +
					'" height="100%" onload="this.style.maxWidth = this.width + &quot;px&quot;;' +
					'this.setAttribute(&quot;width&quot;,&quot;100%&quot;);"></img></span></div>'
				);
			} else {
				return this.renderDefaultCell(td, innerHTML);
			}
		},

		renderDefaultCell: function (td, innerHTML) {
			if (innerHTML) {
				return '<span><pre>' + innerHTML + '</pre></span>';
			} else {
				return '<span><pre></pre></span>';
			}
		},

		renderHeader: function () {
			// summary:
			//		Setup the headers for the grid

			//FYI copied from CompoundColumns.js and Grid.js of dGrid
			var columns = this.subRows[0];
			var headerColumns = this.subRows.headerRows[0];
			var grid = this;
			var headerNode = this.headerNode;
			var i = headerNode.childNodes.length;

			headerNode.setAttribute('role', 'row');

			// clear out existing header in case we're resetting
			while (i--) {
				put(headerNode.childNodes[i], '!');
			}

			var row = this.createSpecificRow(
				'th',
				function (th, column) {
					var contentNode = (column.headerNode = th);
					var field = column.field;
					if (field) {
						th.field = field;
					}
					// allow for custom header content manipulation
					if (column.renderHeaderCell) {
						appendIfNode(contentNode, column.renderHeaderCell(contentNode));
					} else if ('label' in column || column.field) {
						var label = 'label' in column ? column.label : column.field;
						if (
							!label &&
							(!column.parentColumn ||
								column.parentColumn.children.length > 1) &&
							column.columnName !== undefined
						) {
							label = column.columnName;
						}
						contentNode.appendChild(document.createTextNode(label));
					}
					contentNode.innerHTML = '<span>' + contentNode.innerHTML + '</span>';
					if (column.sortable !== false && field && field !== '_item') {
						th.sortable = true;
						th.className += ' dgrid-sortable';
					}
				},
				this.subRows && this.subRows.headerRows
			);
			this._rowIdToObject[(row.id = this.id + '-header')] = this.columns;
			headerNode.appendChild(row);

			// If the columns are sortable, re-sort on clicks.
			// Use a separate listener property to be managed by renderHeader in case
			// of subsequent calls.
			if (this._sortListener) {
				this._sortListener.remove();
			}
			this._sortListener = on(row, 'click,keydown', function (event) {
				// respond to click, space keypress, or enter keypress
				if (
					event.type === 'click' ||
					event.keyCode === 32 ||
					(!has('opera') && event.keyCode === 13)
				) {
					var target = event.target;
					var field;
					var sort;
					var newSort;
					var eventObj;
					do {
						if (target.sortable) {
							// If the click is on the same column as the active sort,
							// reverse sort direction
							newSort = [
								{
									property: (field = target.field || target.columnId),
									descending:
										(sort = grid.sort[0]) &&
										sort.property === field &&
										!sort.descending
								}
							];

							// Emit an event with the new sort
							eventObj = {
								bubbles: true,
								cancelable: true,
								grid: grid,
								parentType: event.type,
								sort: newSort
							};

							if (on.emit(event.target, 'dgrid-sort', eventObj)) {
								// Stash node subject to DOM manipulations,
								// to be referenced then removed by sort()
								grid._sortNode = target;
								grid.set('sort', newSort);
							}

							break;
						}
					} while ((target = target.parentNode) && target !== headerNode);
				}
			});

			// The object delegation performed in configStructure unfortunately
			// "protects" the original column definition objects (referenced by
			// columns and subRows) from obtaining headerNode information, so
			// copy them back in.
			for (i = columns.length; i--; ) {
				columns[i].headerNode = headerColumns[i].headerNode;
			}

			//FYI copied from ColumnResizer.js of dGrid
			var assoc;
			if (this.columnSets && this.columnSets.length) {
				var csi = this.columnSets.length;
				while (csi--) {
					assoc = lang.mixin(assoc || {}, subRowAssoc(this.columnSets[csi]));
				}
			} else if (this.subRows && this.subRows.length > 1) {
				assoc = subRowAssoc(this.subRows);
			}

			var colNodes = query('.dgrid-cell', grid.headerNode);

			i = colNodes.length;
			while (i--) {
				var colNode = colNodes[i];
				var id = colNode.columnId;
				var col = grid.columns[id];
				var childNodes = colNode.childNodes;
				var resizeHandle;

				if (!col || col.resizable === false) {
					continue;
				}

				var headerTextNode = put('div.dgrid-resize-header-container');
				colNode.contents = headerTextNode;

				// move all the children to the header text node
				while (childNodes.length > 0) {
					put(headerTextNode, childNodes[0]);
				}

				resizeHandle = put(
					colNode,
					headerTextNode,
					'div.dgrid-resize-handle.resizeNode-' +
						miscUtil.escapeCssIdentifier(id, '-')
				);
				resizeHandle.columnId = (assoc && assoc[id]) || id;
			}

			if (!grid.mouseMoveListen) {
				// establish listeners for initiating, dragging, and finishing resize
				on(
					grid.headerNode,
					'.dgrid-resize-handle:mousedown' +
						(has('touch') ? ',.dgrid-resize-handle:touchstart' : ''),
					function (e) {
						grid._resizeMouseDown(e, this);
						grid.mouseMoveListen.resume();
						grid.mouseUpListen.resume();
					}
				);
				grid._listeners.push(
					(grid.mouseMoveListen = on.pausable(
						document,
						'mousemove' + (has('touch') ? ',touchmove' : ''),
						miscUtil.throttleDelayed(function (e) {
							grid._updateResizerPosition(e);
						})
					))
				);
				grid._listeners.push(
					(grid.mouseUpListen = on.pausable(
						document,
						'mouseup' + (has('touch') ? ',touchend' : ''),
						function (e) {
							grid._resizeMouseUp(e);
							grid.mouseMoveListen.pause();
							grid.mouseUpListen.pause();
						}
					))
				);
				// initially pause the move/up listeners until a drag happens
				grid.mouseMoveListen.pause();
				grid.mouseUpListen.pause();
			}
		},

		isRowExist: function (id) {
			return this.collection.storage.index[id] !== undefined;
		},

		highlightRow: function () {
			//the function just override dojo hightlightRow not to hightlight it after each update of Row
		},

		_processScroll: function () {
			/*
			 * can be removed after dgrid v. later than 0.4.0. commit
			 * from master rep. was applied 6163f3eb12bf49f9c4e2d22cb8a41426c14655e0. rowHeight can be removed too. after v. 0.4.0.
			 */
			if (!this.rowHeight) {
				return;
			}
			return this.inherited(arguments);
		},

		_move: function (item, steps, targetClass, visible, elem) {
			var nextSibling;
			var current;
			var element;
			// Start at the element indicated by the provided row or cell object.
			element = current = item.element || elem;
			steps = steps || 1;

			do {
				// Outer loop: move in the appropriate direction.
				if (
					(nextSibling = current[steps < 0 ? 'previousSibling' : 'nextSibling'])
				) {
					do {
						// Inner loop: advance, and dig into children if applicable.
						current = nextSibling;
						if (
							current &&
							(current.className + ' ').indexOf(targetClass + ' ') > -1
						) {
							// Element with the appropriate class name; count step, stop digging.
							element = current;
							steps += steps < 0 ? 1 : -1;
							break;
						}
						// If the next sibling isn't a match, drill down to search, unless
						// visible is true and children are hidden.
					} while (
						(nextSibling =
							(!visible || !current.hidden) &&
							current[steps < 0 ? 'lastChild' : 'firstChild'])
					);
				} else {
					current = current.parentNode;
					if (
						!current ||
						current === this.bodyNode ||
						current === this.headerNode
					) {
						// Break out if we step out of the navigation area entirely.
						break;
					}
				}
			} while (steps);

			if (steps !== 0 && (!elem || elem.id !== element.id)) {
				this._ensureRowScroll(element);
				this._processScroll();
				return this._move({}, steps, targetClass, visible, element);
			}

			return element;
		},

		editFocusedCell: function (cell) {
			if (!this.qpGrid.isEditMode()) {
				return;
			}

			var propertyItem = this.qpGrid.getCellItem(cell.element.cellId);
			if (
				cell.element.readOnly ||
				cell.element.isEmpty ||
				cell.element.isCandidate ||
				this.qpGrid._collapseStyleSheets[cell.column.parentColumn.id] ||
				propertyItem.discoverOnly === '1'
			) {
				return;
			}

			//Modify by BCS Tengz 2022/6/22 MPP与PQD联动 不允许修改Operation
			if(parent.isPQD && parent.isUsedMPP && propertyItem.treeItem.documentElementType.name=="PQD Operation" && propertyItem.property.bindingType){
				return;
			}
			//End Modify

			var focusedCellData = {
				rowId: cell.row.id,
				nodeId: cell.element.nodeId,
				cellId: cell.element.cellId
			};

			cellEditor.show(cell, onCellEditorClosed.bind(this));

			var qpGrid = this.qpGrid;

			this._onCellEditorClosed = onCellEditorClosed;

			function onCellEditorClosed(isEscapePressed, isNextFocus) {
				if (cellEditor && cellEditor.isHidden()) {
					return;
				}

				if (isEscapePressed) {
					if (focusedCellData) {
						this.selectCell(focusedCellData.rowId, focusedCellData.cellId);
					}
					focusedCellData = null;
				}

				if (focusedCellData) {
					if (cellEditor.isValueValid()) {
						qpGrid.onCellUpdated(
							focusedCellData.rowId,
							focusedCellData.nodeId,
							focusedCellData.cellId,
							cellEditor.getValue()
						);
					}

					focusedCellData = null;
				}

				cellEditor.hide();

				if (isNextFocus) {
					this.moveFocusHorizontal(null, false, true);
				}
			}
		},

		_configColumns: function (prefix, rowColumns) {
			// configure the current column
			var subRow = [];
			var isArray = rowColumns instanceof Array;

			this.columnIdsOrdered = [];

			function configColumn(column, columnId) {
				if (typeof column === 'string') {
					rowColumns[columnId] = column = { label: column };
				}
				if (!isArray && !column.field) {
					column.field = columnId;
				}
				columnId = column.id =
					column.id || (isNaN(columnId) ? columnId : prefix + columnId);
				// allow further base configuration in subclasses
				if (this._configColumn) {
					this._configColumn(column, rowColumns, prefix);
					// Allow the subclasses to modify the column id.
					columnId = column.id;
				}
				if (isArray) {
					column.formatter = cellEditor.getFormatter(column.dataType);
					this.columns[columnId] = column;
					this.columnIdsOrdered.push(columnId);
				}

				// add grid reference to each column object for potential use by plugins
				column.grid = this;
				if (typeof column.init === 'function') {
					kernel.deprecated(
						'colum.init',
						'Column plugins are being phased out in favor of mixins for better extensibility. column.init may be removed in a future release.'
					);
					column.init();
				}

				subRow.push(column); // make sure it can be iterated on
			}

			miscUtil.each(rowColumns, configColumn, this);
			return isArray ? rowColumns : subRow;
		}
	});
});
