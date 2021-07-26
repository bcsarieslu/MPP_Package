/*global dojo*/
define(['dojo/_base/declare', 'dojo/_base/connect', 'dijit/form/TextBox', 'dojo/keys', 'dojo/aspect', 'dojo/dom-attr', 'dojo/dom-class',
	'MPP/UI/Utils/UIUtils', './MakeIconsDisabledHelper'],
function(declare, connect, TextBox, keys, aspect, domAttr, domClass, UIUtils, MakeIconsDisabledHelper) {
	var uiUtils = new UIUtils({aras: parent.aras});

	var btnCloseSizeInt;
	var pathToImgFolder = dojo.baseUrl + '/../../../images/';

	var clearElementBackground = function(elementStyle) {
		elementStyle.backgroundImage = '';
		elementStyle.backgroundRepeat = '';
		elementStyle.backgroundSize = '';
	};

	var addClearButton = function(textBoxControl, isWorkbenchOfMbomView, onClearHandler) {
		var element = textBoxControl.textbox;
		domClass.add(element, 'cleanable');

		var toggle = function(v) {
			return v ? domClass.add : domClass.remove;
		};

		element.addEventListener('input', function() {
			if (domClass.contains(this, 'cleanable')) {
				if (element.value) {
					element.style.backgroundImage = 'url(' + pathToImgFolder + 'Close.svg)';
					element.style.backgroundRepeat = 'no-repeat';
					element.style.backgroundPosition = (btnCloseSizeInt + 1).toString() + 'px 2px';
				} else {
					clearElementBackground(element.style);
				}
				toggle(element.value)(element, 'x');
			}
		});

		element.addEventListener('mousemove', function(evt) {
			if (domClass.contains(this, 'x')) {
				toggle(this.offsetWidth - 18 < evt.clientX - this.getBoundingClientRect().left)(this, 'onX');
			}
		});

		element.addEventListener('click', function(evt) {
			if (domClass.contains(this, 'onX')) {
				evt.preventDefault();
				clearElementBackground(this.style);
				domClass.remove(this, 'x onX');
				textBoxControl.value = '';
				this.value = '';
				if (onClearHandler) {
					onClearHandler();
				}
			}
		});
	};

	return declare(null, {
		_divFind: null,
		_btnFind: null,
		_btnUp: null,
		_btnDown: null,
		_txtBoxFind: null,
		_lblTotal: null,
		_grid: null,
		_matchCount: 0,
		_isNotFound: 0,
		_notFoundInputText: 0,
		_activeIndex: 0,
		_isHidden: true,
		//true when results are cleared and Grid doesn't contains regExp to find something
		_isActive: false,
		_searchValue: null,
		_isProcessPlanView: null,
		_isWorkbench: null,
		_makeIconsDisabledHelper: null,
		_controlLayout:
			'<div id="find" align="right" style="position:absolute; top:-1px; right: 0px;"> ' +
			'<span id="lblTotal"></span>' +
			'<input id="{txtBoxFind}" type="text" class="searchInput txt_box_find"/>' +
			'<div class="next_prev_btns" id="btnUp"></div>' +
			'<div class="next_prev_btns" id="btnDown"></div>' +
			'</div>',

		constructor: function(parentElement, isProcessPlanView, isWorkbench) {
			this._isProcessPlanView = isProcessPlanView;
			this._isWorkbench = isWorkbench;
			var container = document.createElement('div');

			var textBoxFindInputId = 'txtBoxFind_' + parentElement.parentElement.id;
			container.innerHTML = this._controlLayout.replace('{txtBoxFind}', textBoxFindInputId);
			this._divFind = container.firstChild;
			parentElement.appendChild(this._divFind);

			this._makeIconsDisabledHelper = new MakeIconsDisabledHelper();
			// button "up" setup
			this._btnUp = document.getElementById('btnUp');
			this._btnUp.disabled = true;
			this._btnUp.onclick = function() {
				this._findNext(true);
			}.bind(this);
			this._makeIconsDisabledHelper.addInlineBackgroundImage(this._btnUp, pathToImgFolder + 'FindPrevious.svg', '19px', '19px');

			// button "down" setup
			this._btnDown = document.getElementById('btnDown');
			this._btnDown.disabled = true;
			this._btnDown.onclick = function() {
				this._findNext(false);
			}.bind(this);
			this._makeIconsDisabledHelper.addInlineBackgroundImage(this._btnDown, pathToImgFolder + 'FindNext.svg', '19px', '19px');

			// search label setup
			this._lblTotal = document.getElementById('lblTotal');
			this._lblTotal.textContent = this._getFoundOfText(true);

			// textbox setup
			this._txtBoxFind = new TextBox({intermediateChanges: true, maxLength: 128, color: 'black'}, textBoxFindInputId);
			this._txtBoxFind.startup();
			this._txtBoxFind.textbox.classList.add('txt_box_find');
			var isWorkbenchOfMbomView = !isProcessPlanView && isWorkbench;
			addClearButton(this._txtBoxFind, isWorkbenchOfMbomView, function() {
				this.findAll(true);
			}.bind(this));

			domAttr.set(this._txtBoxFind, 'placeholder', uiUtils.getResource(this._isWorkbench ? 'find.search_placeholder_workbench' :
				'find.search_placeholder'));

			aspect.after(this._txtBoxFind, 'resize', function() {
				this._fixTextBoxWidth();
			}.bind(this));

			connect.connect(this._txtBoxFind, 'onChange', function() {
				this._onChangeValue();
			}.bind(this));

			connect.connect(this._txtBoxFind, 'onKeyPress', function(evt) {
				var textBoxValue = this._txtBoxFind.get('value');
				var isValueChanged = (textBoxValue !== this._searchValue);
				var searchAction;

				switch (evt.charOrCode) {
					case keys.ENTER:
						searchAction = (isValueChanged || !this._isActive) ? 'new' : 'next';
						break;
					case keys.DOWN_ARROW:
						searchAction = (!isValueChanged && this._matchCount) ? 'next' : undefined;
						break;
					case keys.UP_ARROW:
						searchAction = (!isValueChanged && this._matchCount) ? 'prev' : undefined;
						break;
					default:
						break;
				}

				switch (searchAction) {
					case 'new':
						this.findAll(!textBoxValue, false);
						break;
					case 'next':
					case 'prev':
						this._findNext(searchAction === 'prev');
						this._txtBoxFind.focus();
						break;
					default:
						break;
				}

				evt.stopPropagation();
			}.bind(this));
		},

		_onChangeValue: function() {
			var isToDisable = !this._txtBoxFind.get('value') || (this._isNotFound && this._notFoundInputText === this._txtBoxFind.get('value'));
			this._btnUp.disabled = isToDisable;
			this._btnDown.disabled = isToDisable;
			var grayImageCssClassName = 'grayImage';
			if (isToDisable) {
				this._btnUp.classList.add(grayImageCssClassName);
				this._btnDown.classList.add(grayImageCssClassName);
			} else {
				this._btnUp.classList.remove(grayImageCssClassName);
				this._btnDown.classList.remove(grayImageCssClassName);
			}
		},

		toggle: function() {
			var gridElement = this._grid.grid_Experimental.domNode;
			var findClassName = 'withFind';

			if (this._isHidden) {
				//show
				if (gridElement.className) {
					gridElement.className += ' ' + findClassName;
				} else {
					gridElement.className = findClassName;
				}

				this._divFind.style.display = 'block';
				this._isHidden = false;
				this._fixTextBoxWidth();

				this._searchValue = null;
				this._onChangeValue();
			} else {
				//hide
				//for now we remove a way to hide - see git history to restore if need.
			}
		},

		init: function(grid) {
			this.setGrid(grid);
			this.toggle();
		},

		_getFoundOfText: function(isOnlyToClear) {
			if (isOnlyToClear) {
				return '';
			}
			if (!this._matchCount) {
				return uiUtils.getResource('find.no_matches_found');
			}
			if (this._matchCount > 100) {
				return uiUtils.getResource('find.more_than_100_matches');
			}

			return uiUtils.getResource('find.found_of_matches', this._activeIndex.toString(), this._matchCount.toString());
		},

		reset: function(skipGridClear) {
			this.findAll(true, skipGridClear);
		},

		findAll: function(isOnlyToClear, skipGridClear) {
			if (isOnlyToClear && !this._isActive) {
				this._isNotFound = false;
				this._notFoundInputText = '';
				this._lblTotal.textContent = '';
				this._onChangeValue();
				return;
			}

			this._isActive = !isOnlyToClear;
			this._searchValue = this._txtBoxFind.value;
			this._matchCount = skipGridClear ? 0 : this._grid.findAll(this._searchValue, isOnlyToClear);
			this._activeIndex = 0;
			if (!this._matchCount) {
				this._isNotFound = true;
				this._notFoundInputText = this._txtBoxFind.get('value');
				this._onChangeValue();
			}
			this._lblTotal.textContent = this._getFoundOfText(isOnlyToClear);
		},

		_findNext: function(isUp) {
			var textBoxValue = this._txtBoxFind.get('value');
			var separator = '|';
			var isLimit,
				gridItemsIdsArray,
				i,
				rowId,
				selectedRowIds,
				selectedRowId,
				selectedGridItemIndex,
				closeToSelectedGridItemIndex,
				matchIndexesBasedOnSelection,
				matchIndexBasedOnSelection;

			if (this._searchValue !== textBoxValue || (textBoxValue && !this._isActive)) {
				//cannot find a case if this code is reachable
				this.findAll();
				isLimit = isUp ? true : this._matchCount === 1;
			} else {
				var resultMatchCount = isUp ? 1 : this._matchCount;
				isLimit = (this._activeIndex === resultMatchCount) || (isUp && this._activeIndex === 0);
			}

			if (!this._matchCount) {
				return;
			}

			if (isLimit) {
				this._activeIndex = isUp ? this._matchCount : 1;
			} else {
				this._activeIndex += isUp ? -1 : 1;
			}

			if (!this._grid.findObj.matchIndexesByGridItemIndex.isEmpty) {
				gridItemsIdsArray = this._grid.items_Experimental.getAllId();

				selectedRowIds = this._grid.getSelectedItemIDs(separator).split(separator);
				if (selectedRowIds.length === 1) {
					selectedRowId = selectedRowIds[0];
					if (selectedRowId || selectedRowId === 0) {
						for (i = 0; i < gridItemsIdsArray.length; i++) {
							rowId = gridItemsIdsArray[i];
							if (rowId.toString() === selectedRowId) {
								selectedGridItemIndex = i;
							}
						}
					}
				}

				closeToSelectedGridItemIndex = selectedGridItemIndex;
				if (isUp) {
					closeToSelectedGridItemIndex--;
				}
				if (closeToSelectedGridItemIndex !== undefined) {
					do {
						matchIndexesBasedOnSelection = this._grid.findObj.matchIndexesByGridItemIndex[closeToSelectedGridItemIndex];
						if (isUp) {
							matchIndexBasedOnSelection = matchIndexesBasedOnSelection && matchIndexesBasedOnSelection[matchIndexesBasedOnSelection.length - 1];
							closeToSelectedGridItemIndex--;
						} else {
							matchIndexBasedOnSelection = matchIndexesBasedOnSelection && matchIndexesBasedOnSelection[0];
							closeToSelectedGridItemIndex++;
						}
					} while (matchIndexesBasedOnSelection === undefined && closeToSelectedGridItemIndex > 0 &&
						closeToSelectedGridItemIndex < gridItemsIdsArray.length - 1);

					if (matchIndexBasedOnSelection !== undefined) {
						this._activeIndex = matchIndexBasedOnSelection;
						this._activeIndex++;
					}
				}
			}

			this._grid.findObj.matchIndexesByGridItemIndex = {isEmpty: true};
			this._grid.findNext(isUp, this._activeIndex - 1);
			this._lblTotal.textContent = this._getFoundOfText();
		},

		reload: function() {
			if (!this._isHidden) {
				this._fixTextBoxWidth();
			}

			this.findAll(true, true);
		},

		_fixTextBoxWidth: function() {
			var textBoxWidthInt;
			if (this._isProcessPlanView) {
				textBoxWidthInt = 125;
			} else {
				textBoxWidthInt = 310;
			}
			btnCloseSizeInt = textBoxWidthInt - 20;
			var textBoxWidthStr = textBoxWidthInt.toString() + 'px';
			this._txtBoxFind.focusNode.style.width = textBoxWidthStr;

			//fix for width, dojo TextBox here requires region for current layout and this region added parent.parent div which has wrong width (very large).
			this._txtBoxFind.focusNode.parentNode.parentNode.style.width = textBoxWidthStr;
			this._txtBoxFind.focusNode.parentNode.parentNode.style.position = 'relative';
		},

		setGrid: function(grid) {
			this._grid = grid;
		},

		isHidden: function() {
			//TODO: remove unused isHidden flag and its usages.
			return this._isHidden;
		}
	});
});
