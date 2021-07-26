define([
	'dojo/_base/declare',
	'dijit/Editor',
	'dojo/keys',
	'dojo/aspect',
	'dojo/dom-construct',
	'dojo/dom-class',
	'dojo/_base/sniff',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/DOMRange',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/DOM',
	'MPP/UI/ProcessPlan/DOMRenderer',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/_ArasTableXmlSchemaElement/editor/plugins/ResizeTableColumn',
	'Aras/Client/Controls/Experimental/ContextMenu',
	'MPP/Model/WIModel/WIModelEnums',
	'dijit/popup',
	'dojo/on',
	'dojo/_base/array'
],
function(declare, DijitEditor, keys, aspect, domConstruct, domClass, has, DOMRange, DOMapi, DOMRenderer, ResizeTableColumn, ContextMenu, Enums,
	popup, on, array) {
	return declare('Aras.Client.Controls.MPP.UI.WorkInstructions.Editor', DijitEditor, {
		viewmodel: null,
		datamodel: null,
		actionsHelper: null,
		contentNode: null,
		_clipboard: null,
		_allowedKeydownKeys: {}, //the list of buttons to create child elements
		_specialKeypressCodes: {
			13: true, /*Enter*/
			32: true  /*Space*/
		},
		_environment: null,
		_passedKeyDownCheck: null,
		_contextMenu: null,
		_contextMenuKey: null,
		_isExplicitHeight: false,
		_currentSelection: null,
		_waitLoadCounter: null,
		_invalidateIteration: null,
		_isContentLoaded: null,
		_defferedMethodCalls: null,
		_currentCoordForMenuX: null,
		_currentCoordForMenuY: null,

		constructor: function(args) {
			var aras = args.structuredDocument ? args.structuredDocument._aras : null;
			var keydownKeyIntervals = ['32', '48-57', '65-90', '96-111', '186-222'];// space, number, letters, num pad, (; = , - . / ~ [ \ ] ')
			var keyInterval, lowerBound, upperBound;

			this.aras = aras;
			this.uiUtils = args.uiUtils;
			this.viewmodel = args.structuredDocument;
			this.datamodel = this.viewmodel.datamodel;
			this.actionsHelper = this.viewmodel.ActionsHelper();
			this._clipboard = this.viewmodel.Clipboard();
			this.plugins = [{
				name: 'Aras.Client.Controls.TechDoc.ViewModel.Aras._ArasTableXmlSchemaElement.editor.plugins.ResizeTableColumn',
				command: 'ResizeTableColumn'
			}];
			this._currentSelection = [];
			this._invalidateIteration = 0;
			this._isContentLoaded = true;
			this._defferedMethodCalls = [];
			this._environment = {
				isMacOS: /mac/i.test(navigator.platform),
				isFirefox: aras ? aras.Browser.isFf() : has('ff'),
				isChrome: aras ? aras.Browser.isCh() : has('ch'),
				isIE: aras ? aras.Browser.isIe() : has('ie'),
				isIE11: aras ? (aras.Browser.isIe() && aras.Browser.getMajorVersionNumber() === 11) : false
			};
			this._contextMenuKey = 0;

			for (var i = 0; i < keydownKeyIntervals.length; i++) {
				keyInterval = keydownKeyIntervals[i].split('-');

				if (keyInterval.length === 1) {
					this._allowedKeydownKeys[keyInterval[0]] = true;
				} else {
					lowerBound = Math.min(parseInt(keyInterval[0]), parseInt(keyInterval[1]));
					upperBound = Math.max(parseInt(keyInterval[0]), parseInt(keyInterval[1]));

					for (var j = lowerBound; j <= upperBound; j++) {
						this._allowedKeydownKeys[j] = true;
					}
				}
			}

			Object.defineProperty(this, 'scrollNode', {get: function() {
				return (this._environment.isChrome || this._environment.isFirefox || this._environment.isIE11) ? this.editNode : this.editNode.parentNode;
			}});

			// cltr + key handlers
			this.addKeyHandler(66, true, false, this.handleCtrlB); //Ctlr + B
			this.addKeyHandler(67, true, false, this.handleCtrlC); //Ctrl + C
			this.addKeyHandler(73, true, false, this.handleCtrlI); //Ctlr + I
			this.addKeyHandler(83, true, false, this.handleCtrlS); //Ctrl + S
			this.addKeyHandler(85, true, false, this.handleCtrlU); //Ctlr + U
			this.addKeyHandler(86, true, false, this.handleCtrlV); //Ctrl + V
			this.addKeyHandler(88, true, false, this.handleCtrlX); //Ctrl + X
		},

		syncModelWithHTML: function(element, e) {
			if (element) {
				if (element.is('ArasTextXmlSchemaElement')) {
					element.syncTextStash(this.domapi);
				} else if (element.is('XmlSchemaText')) {
					element.Text(e.target.textContent);
				}
			}
		},

		syncBeforeAction: function(e) {
			//save data from range
			this.domRange.refresh();
			var modelCursor = this.viewmodel.Cursor();
			var cursorData = {
				start: modelCursor.start,
				startOffset: modelCursor.startOffset,
				end: modelCursor.end,
				endOffset: modelCursor.endOffset
			};

			this.syncModelWithHTML(modelCursor.commonAncestor, e);

			//restore range
			this.domRange.setCursorTo(cursorData.start, cursorData.startOffset, cursorData.end, cursorData.endOffset);

			if (modelCursor.commonAncestor && modelCursor.commonAncestor.is('ArasTextXmlSchemaElement')) {
				modelCursor.commonAncestor.InvalidRange(this.viewmodel.Cursor());
			}
		},

		blurTextNode: function(e) {
			var id = e.target.getAttribute('id');
			var element = this.viewmodel.GetElementById(id);

			this.syncModelWithHTML(element, e);
		},

		handleShortcuts: function(keyEvent) {
			var keyCode = keyEvent.which || keyEvent.keyCode;
			var keyHandlers = this._keyHandlers[keyCode];
			var isEventSuppressed = false;

			if (keyHandlers && !keyEvent.altKey) {
				var isCtrlPressed = this._environment.isMacOS ? keyEvent.metaKey : keyEvent.ctrlKey;
				var eventHandler, i;

				for (i = 0; i < keyHandlers.length; i++) {
					eventHandler = keyHandlers[i];

					if ((eventHandler.shift === keyEvent.shiftKey) && (eventHandler.ctrl === isCtrlPressed)) {
						if (eventHandler.handler.apply(this, arguments) === false) {
							isEventSuppressed = true;
						}
					}
				}
			}

			return isEventSuppressed;
		},

		handleCtrlV: function(e) {
			this.syncBeforeAction(e);
			var text = this._clipboard.getData('Text') || '';
			// +++ IR-029149 +++
			text = text.replace(/\r/g, '');
			// --- IR-029149 ---
			this.domRange.refresh();

			this.viewmodel.SuspendInvalidation();

			var _cursor = this.viewmodel.Cursor();
			var isCollapsed = _cursor.collapsed;
			var startItem = _cursor.start;
			var ancesstorItem = _cursor.commonAncestor;

			if (ancesstorItem && ancesstorItem.is('ArasTextXmlSchemaElement')) {
				var content = this._clipboard.getData('ArasTextXmlSchemaElement');

				if (content && content.plaintText === text) {
					ancesstorItem.InsertEmphs(content.formattedText);
				} else {
					ancesstorItem.InsertText(text);
				}
			} else if (ancesstorItem || startItem) {
				if (!isCollapsed) {
					_cursor.DeleteContents();
				}

				if (_cursor.collapsed) {
					var selectedItem = _cursor.commonAncestor;

					if (selectedItem && selectedItem.is('XmlSchemaText')) {
						var insertPosition = _cursor.startOffset;
						var stringBeforeEditing = selectedItem.Text();
						var stringAfterEditing = [stringBeforeEditing.slice(0, insertPosition), text, stringBeforeEditing.slice(insertPosition)].join('');

						selectedItem.Text(stringAfterEditing);
						_cursor.Set(selectedItem, insertPosition + text.length, selectedItem, insertPosition + text.length);
					}
				}
			}

			this.viewmodel.ResumeInvalidation();

			//we handle all dom modifications manually
			return false;
		},

		handleCtrlC: function(e) {
			this.syncBeforeAction(e);
			this._copyToClipboard();

			return false;
		},

		handleCtrlX: function(e) {
			this.syncBeforeAction(e);

			var plainText;

			this.domRange.refresh();
			plainText = this.domRange.plainText;

			if (plainText) {
				var viewCursor = this.viewmodel.Cursor();
				var ancesstorItem = viewCursor.commonAncestor;

				this._clipboard.setData(plainText, 'Text');
				this._copyToClipboard();

				//delete selection
				this.viewmodel.SuspendInvalidation();

				if (ancesstorItem && ancesstorItem.is('ArasTextXmlSchemaElement')) {
					if (!viewCursor.collapsed) {
						ancesstorItem.DeleteText();
					}
				} else {
					var startItem = viewCursor.start;
					var endItem = viewCursor.end;
					var startPosition = viewCursor.startOffset;
					var endPosition = viewCursor.endOffset;

					if (startItem && endItem && startPosition !== -1) {
						if ((startItem === endItem) && startItem.is('XmlSchemaText')) {
							var stringBeforeEditing = startItem.Text();
							var stringAfterEditing = [stringBeforeEditing.slice(0, startPosition), stringBeforeEditing.slice(endPosition)].join('');

							startItem.Text(stringAfterEditing);
							viewCursor.Set(startItem, startPosition, startItem, startPosition);
						}
					}
				}

				this.viewmodel.ResumeInvalidation();
			}

			return false;
		},

		onBeforeDeactivate: function() {
			// error is triggered for some reasons in IE when perform text formating
		},

		onBeforeActivate: function() {
			// error is triggered for some reasons in IE when perform text formating
		},

		startup: function() {
			this.inherited(arguments);

			if (this._tablePluginHandler) {
				this._tablePluginHandler.connectDraggable = function() {
					/*deactivate the old code to drag&drop in old IE*/
				};
			}
			//get rid of toolbar from editor
			domConstruct.destroy(this.toolbar.domNode.parentNode);
		},

		onLoad: function(html) {
			//Modify by tengz 2019/5/10
			//MPP产品包
			this.iframe.src="../../scripts/WebEditor/ueditor/default.html";
			
			this.inherited(arguments);

			this.domapi = new DOMapi({document: this.document, viewmodel: this.viewmodel});
			this.domRenderer = new DOMRenderer({domapi: this.domapi, viewmodel: this.viewmodel});
			this.domRange = new DOMRange({window: this.window, viewmodel: this.viewmodel, domapi: this.domapi});

			aspect.after(this.domRange, 'onRefresh', this._onDOMRangeRefresh.bind(this), true);
			aspect.after(this.viewmodel, 'OnInvalidate', this._onViewModelInvalidate.bind(this), true);
			aspect.after(this.viewmodel, 'onSelectionChanged', this.selectionChangeHandler.bind(this), true);
			aspect.after(this.actionsHelper.getAction('addelement'), 'Execute', this.focus.bind(this));

			// replace editor innerHTML content with root node, which will be used as storage for documentContent
			this.editNode.innerHTML = '<div class="editorContentNode"></div>';
			this.contentNode = this.editNode.firstChild;

			//prevent context menu on editable grid
			this.editNode.spellcheck = false;
			this.editNode.setAttribute('contentEditable', 'false');

			this.editNode.oncontextmenu = this.onContextMenuShow.bind(this);
			if (this._environment.isIE) {
				this.domNode.ownerDocument.oncontextmenu = this.onContextMenuShow.bind(this);
				//disable auto insert <a> after typing URL in IE for contentEditable block
				this.domNode.ownerDocument.execCommand('AutoUrlDetect', false, false);
			}
			this.scrollNode.addEventListener('scroll', this.dropExplicitContentHeight.bind(this));

			this._contextMenu = new ContextMenu(this.editNode, true);
			aspect.after(this._contextMenu, 'onItemClick', this._onMenuItemClick.bind(this), true);

			this.iframe.onfocus = function() {
				//it was pulled from RichText.js it breaks contextmenu on TOC
				//_this.editNode.setActive();
			};

			if (this.setValueDeferred) {
				this.setValueDeferred.cancel();
			}

			this.set('value', this.domRenderer.RenderHtml(this.viewmodel.Dom()));
			this.selectionChangeHandler(this.viewmodel, this.viewmodel.GetSelectedItems());

			this.applySchemaSettings();

			on(this.editNode, '.ArasTextXmlSchemaElement:focusout', this.blurTextNode.bind(this));
			on(this.editNode, '.XmlSchemaText:focusout', this.blurTextNode.bind(this));
		},

		getCss: function() {
			var schemaHelper = this.viewmodel.Schema();
			var editorSettings = schemaHelper.getEditorSettings();
			var fullCssStyleStr = '';

			var classification = this.viewmodel.ItemClassification();
			var classificationSettings = editorSettings[classification] || editorSettings.global;

			if (classificationSettings) {
				for (var i = 0; i < classificationSettings.length; i++) {
					var setting = classificationSettings[i];
					if (setting.cssStyle) {
						fullCssStyleStr += (fullCssStyleStr ? '\n\n' : '') + '/* ' + setting.name + ' */\n' + setting.cssStyle;
					}
				}
			}
			return fullCssStyleStr;
		},

		applySchemaSettings: function() {
			var fullCssStyleStr = this.getCss();

			if (fullCssStyleStr) {
				var ownerDocument = this.editNode.ownerDocument;
				var styleNode = ownerDocument.createElement('style');
				var cssTextNode = ownerDocument.createTextNode(fullCssStyleStr);

				styleNode.appendChild(cssTextNode);
				ownerDocument.head.appendChild(styleNode);
			}
		},

		_onMenuItemClick: function(cmdId, itemId) {
			this.actionsHelper.hideContextMenu(this._contextMenu);

			if (cmdId === 'add_parent_sibling') {
				var modelCursor = this.viewmodel.Cursor();
				var targetElement = this.viewmodel.GetElementById(itemId);
				var parentElement = targetElement.Parent;

				this.viewmodel.SetSelectedItems(parentElement);
				modelCursor.Set(parentElement, 0, parentElement, 0);

				setTimeout(function() {
					this.showSiblingCreateMenu(parentElement);
				}.bind(this), 0);
			} else {
				var selectedNode = this.domapi.getNodeById(itemId);
				var tooltipDialogArguments = {
					langCode: this.viewmodel._currentLanguageCode,
					getPosition: function() {
						var selectedItems = this.viewmodel.GetSelectedItems();

						selectedNode = this.domapi.getNodeById(itemId);

						if (selectedItems.length) {
							var elementId = selectedItems[0].Id();
							var elementNode = this.domapi.getNodeById(elementId) || selectedNode;

							if (elementNode) {
								var elementBoundingRect = elementNode.getBoundingClientRect();
								var editorBoundingRect = this.domNode.getBoundingClientRect();

								return {
									x: editorBoundingRect.left + elementBoundingRect.left + 20,
									y: elementBoundingRect.top + 50
								};
							}
						}

						return {x: this._currentCoordForMenuX, y: this._currentCoordForMenuY, around: selectedNode};
					}.bind(this)
				};

				this.actionsHelper.onMenuItemClick(cmdId, itemId, tooltipDialogArguments);

				if (cmdId.split(':')[0] === 'pasteelement') {
					selectedNode.focus();
				}
			}
		},

		_copyToClipboard: function() {
			this.domRange.refresh();
			//copy paste formatted text
			var content = this.domRange.cloneContents();

			if (content) {
				this._clipboard.setData(content.data, content.type);
			}
		},

		_onDOMRangeRefresh: function(sender, earg) {
			var cursor = this.viewmodel.Cursor();

			cursor.Reinitialize(sender);

			if (cursor.commonAncestor && cursor.commonAncestor.is('ArasTextXmlSchemaElement')) {
				cursor.commonAncestor.InvalidRange(cursor);
			}
		},

		setExplicitContentHeight: function(/*Integer*/ value) {
			var contentHeight = parseInt(value);

			if (!isNaN(contentHeight) && contentHeight > 0) {
				this.contentNode.style.height = contentHeight + 'px';
				this._isExplicitHeight = true;
			}
		},

		dropExplicitContentHeight: function() {
			if (this._isExplicitHeight && this._isContentLoaded) {
				this.contentNode.style.height = 'auto';
				this._isExplicitHeight = false;
			}
		},

		_onViewModelInvalidate: function(sender, earg) {
			var originContentHeight = this.contentNode.scrollHeight;
			var originScrollTop = this.scrollNode.scrollTop;
			var incompleteImages = [];
			var invalidationList = earg.invalidationList || [];
			var modelCursor = earg.cursor;
			var imageNodes, imageNode, invalidObject, i;

			for (i = 0; i < invalidationList.length; i++) {
				invalidObject = invalidationList[i];
				this.domRenderer.invalidate(invalidObject);
			}

			this._savedScrollPosition = originScrollTop;
			this.setExplicitContentHeight(originContentHeight);

			this.domRenderer.refresh();
			this.highlightItems(this._currentSelection, true);

			this._invalidateIteration += 1;

			imageNodes = this.editNode.querySelectorAll('img');
			for (i = 0; i < imageNodes.length; i++) {
				imageNode = imageNodes[i];

				if (!imageNodes[i].complete) {
					incompleteImages.push(imageNode);
				}
			}

			this._isContentLoaded = (incompleteImages.length === 0);
			this._waitLoadCounter = incompleteImages.length;

			if (!this._isContentLoaded) {
				var iterationNumber = this._invalidateIteration;
				var imageLoadHandler = function() {
					if (this._invalidateIteration === iterationNumber) {
						if (this._waitLoadCounter > 1) {
							this._waitLoadCounter -= 1;
						} else {
							this.onContentLoaded();
							this._isContentLoaded = true;
						}
					}
				}.bind(this);

				for (i = 0; i < incompleteImages.length; i++) {
					incompleteImages[i].onload = imageLoadHandler;
				}
			}
			this.callWhenContentLoaded(this, this.dropExplicitContentHeight);

			if (modelCursor.IsModified()) {
				this.domRange.setCursorTo(modelCursor.start, modelCursor.startOffset, modelCursor.end, modelCursor.endOffset);

				// during setCursorTo call content can be scrolled
				if (this.scrollNode.scrollTop !== originScrollTop) {
					this.scrollNode.scrollTop = originScrollTop;
				}
			}
		},
		
		selectViewMode:null,
		/**
		*  Process Plan Tree 点击后触发事件
		*  Modify by tengz
		*  点击Operation切换编辑器内容
		*/
		selectionChangeHandler: function(sender, selectedItems) {
			/// <summary>
			/// Handler for Model 'selectionChange' event.
			/// </summary>
			/// <param name="sender" type="StructuredDocument">Event source object.</param>
			/// <param name="selectedItems" type="Array of WrappedObjects">Currently selected items.</param>

			// turn off previous selection highlightning
			//this.highlightItems(this._currentSelection, false);

			// turn on current selection highlightning
			//if (selectedItems.length) {
			//	this.highlightItems(selectedItems, true);
			//	this._currentSelection = selectedItems.slice();

			//	this.callWhenContentLoaded(this, this.scrollToSelection, [this._currentSelection, this.viewmodel._isInvalidating]);
			//}
			if(selectedItems.length!=1){return;}
			
			var selectedItem=selectedItems[0].Item();
			var selectedSameMode=this.selectViewMode==selectedItem;
			var viewmodel=this.viewmodel;
			
			var win=this.iframe.contentWindow;
			switch(selectedItem.getType())
			{
				case 20://mpp_Operation
					if(win.initContent)
					{
						win.selectedItem=selectedItem;
						win.initContent(this.viewmodel);
					}
					else
					{
						win.location=aras.getScriptsURL()+"WebEditor/ueditor/default.html";
						
						setTimeout(ueditorOnLoad,1000);

						function ueditorOnLoad()
						{
							if(win.document.readyState == "complete")
							{
								win.selectedItem=selectedItem;
								win.initContent(viewmodel);
							}
							else
							{
								win.document.onreadystatechange = ueditorOnReady;
							}
						}
						
						function ueditorOnReady()
						{
							if(win.document.readyState == "complete")
							{
								win.selectedItem=selectedItem;
								win.initContent(viewmodel);
							}
						}
						
					}
					break;
				case 10://mpp_ProcessPlan
					//Modify by tengz 2020/4/26
					if(win.reload)
					{
						win.selectedItem=selectedItem;
						win.reload();
					}else{
						win.location="./ViewsHTML/OperationsGrid.html";
						setTimeout(operationsGridOnLoad,100);
						function operationsGridOnLoad()
						{
							if(win.gridReady)
							{
								win.selectedItem=selectedItem;
								win.reload();
							}
							else
							{
								setTimeout(operationsGridOnLoad,100);
							}
						}
					}
					break;
				default:
					if(selectedSameMode)
					{
						return;
					}
					var selectedIOMItem=aras.newIOMItem();
					if(selectedItem.hasRelatedItem())
					{
						selectedIOMItem.loadAML(selectedItem.getRelatedItem().serializeToAml());
					}
					else
					{
						selectedIOMItem.loadAML(selectedItem.serializeToAml());
					}
					
					var winArguments=new Object();
					winArguments.aras=aras;
					winArguments.itemTypeName=selectedIOMItem.getType();
					winArguments.itemID=selectedIOMItem.getID();
					winArguments.item=aras.getItemById(winArguments.itemTypeName,winArguments.itemID,0);
					//win.name=aras.mainWindowName+"_"+selectedItems[0].ItemId();
					win.name=aras.mainWindowName+"_"+aras.generateNewGUID();
					win=aras.getMostTopWindowWithAras(window).open(aras.getScriptsURL() + "blank.html",win.name);
					var paramVarName = 'opener.' + win.name + '_params';
					eval('win.' + paramVarName + ' = winArguments;var winParams = win.' + paramVarName + ';');
					win.location=aras.getScriptsURL()+"WebEditor/ueditor/mppModelView.html";
					
					break;
			}
			this.selectViewMode=selectedItem;
		},

		highlightItems: function(itemsList, doHighlighted) {
			/// <summary>
			/// Turn on/off items highlightning.
			/// </summary>
			/// <param name="itemsList" type="Array of WrappedObjects">Target items.</param>
			/// <param name="doHighlighted" type="Boolean">True - turn on, false - turn off.</param>
			if (itemsList.length) {
				var targetItem, referencedItem, referencedItems;

				for (var i = 0; i < itemsList.length; i++) {
					targetItem = itemsList[i];
					referencedItems = this.viewmodel.GetElementsByOrigin(targetItem.origin);

					for (var j = 0; j < referencedItems.length; j++) {
						referencedItem = referencedItems[j];
						referencedItem = this.viewmodel.GetAncestorOrSelfElement(referencedItem);

						var elementNode = this.domapi.getNode(referencedItem);
						if (elementNode) {
							if (doHighlighted) {
								domClass.add(elementNode, 'TechDocElementSelection', true);
							} else {
								domClass.remove(elementNode, 'TechDocElementSelection', true);
							}
						}
					}
				}
			}
		},

		callWhenContentLoaded: function(contextItem, method, methodArguments) {
			if (method) {
				contextItem = contextItem || this;

				if (this._isContentLoaded) {
					method.apply(contextItem, methodArguments);
				} else {
					var isCallExists = false;
					var callInfo, i;

					for (i = 0; i < this._defferedMethodCalls.length; i++) {
						callInfo = this._defferedMethodCalls[i];

						if (callInfo.context === contextItem && callInfo.method === method) {
							callInfo.arguments = methodArguments;
							isCallExists = true;
							break;
						}
					}

					if (!isCallExists) {
						this._defferedMethodCalls.push({context: contextItem, method: method, arguments: methodArguments});
					}
				}
			}
		},

		onContentLoaded: function() {
			var callInfo, i;

			for (i = 0; i < this._defferedMethodCalls.length; i++) {
				callInfo = this._defferedMethodCalls[i];
				callInfo.method.apply(callInfo.context, callInfo.arguments);
			}

			this._defferedMethodCalls.length = 0;
		},

		scrollToSelection: function(selectedItems, useSavedPosition) {
			if (selectedItems.length) {
				var frameDocument = this.iframe.contentDocument;
				var scrollNode = this.scrollNode;
				var editorScrollTop = useSavedPosition ? this._savedScrollPosition : scrollNode.scrollTop;
				var offsetTopsOfElements = [];
				var elementsHash = {};
				for (var i = 0; i < selectedItems.length; i++) {
					var selectedItem = selectedItems[i];
					var elementNode = frameDocument.getElementById(selectedItem.Id());

					if (elementNode) {
						var currentNode = elementNode;
						var topValue = 0;

						while (currentNode) {
							topValue += currentNode.offsetTop;
							currentNode = currentNode.offsetParent;
						}

						offsetTopsOfElements.push(topValue);
						elementsHash[topValue] = elementNode.offsetHeight;
					}
				}

				// check that we need to scroll editor content
				var minOffsetTop = Math.min.apply(null, offsetTopsOfElements);
				var elementHeight = elementsHash[minOffsetTop];

				var frameScrollBottom = editorScrollTop + scrollNode.offsetHeight;
				var elementOffsetBottom = minOffsetTop + elementHeight;

				var isAbove = minOffsetTop <= editorScrollTop;
				var isUnder = elementOffsetBottom >= frameScrollBottom;
				var isHigher = elementHeight >= scrollNode.offsetHeight;
				var isVisible = (minOffsetTop > editorScrollTop && minOffsetTop < frameScrollBottom) ||
				(elementOffsetBottom > editorScrollTop && elementOffsetBottom < frameScrollBottom);

				if (!(isAbove && isUnder)) {
					if (isAbove && (!isVisible || !isHigher)) {
						scrollNode.scrollTop = minOffsetTop;
					} else if (isUnder && (!isVisible || !isHigher)) {
						scrollNode.scrollTop = elementOffsetBottom - scrollNode.offsetHeight;
					}
				}
			}
		},

		_stopEvent: function(targetEvent) {
			targetEvent.preventDefault();
			targetEvent.stopPropagation();
		},

		_getCoordinates: function(e, elementId) {
			var xCoor = 0;
			var yCoor = 0;

			if (this._contextMenuKey === 93) {
				var targetNode = this.domapi.getNodeById(elementId);
				var currentNode = targetNode;

				while (currentNode) {
					xCoor += currentNode.offsetLeft;
					yCoor += currentNode.offsetTop;
					currentNode = currentNode.offsetParent;
				}

				xCoor += this.domNode.offsetLeft + 10;
				yCoor += this.domNode.offsetTop + targetNode.offsetHeight / 2 - this.scrollNode.scrollTop;
			} else {
				xCoor = this.domNode.offsetLeft + e.pageX;
				yCoor = this.domNode.offsetTop + e.pageY;
			}

			return {x: xCoor, y: yCoor};
		},

		onContextMenuShow: function(e) {
			var selectedItems = this.viewmodel.GetSelectedItems();
			var targetObject = this.domapi.getObject(e.target);

			if (this._contextMenuKey === 93) {
				targetObject = selectedItems.length ? selectedItems[0] : null;
			}

			targetObject = targetObject && this.viewmodel.GetAncestorOrSelfElement(targetObject);

			if (targetObject) {
				var menuModel = this.actionsHelper.GetWorkInstructionsMenuModel(selectedItems);
				var elementId = targetObject.Id();
				var coords = this._getCoordinates(e, elementId);

				this._currentCoordForMenuX = coords.x;
				this._currentCoordForMenuY = coords.y;

				this.actionsHelper.showContextMenu(this._contextMenu, this, menuModel, elementId, {
					x: coords.x,
					y: coords.y,
					onClose: function() {
						var targetNode = this.domapi.getNodeById(elementId);

						if (targetNode && targetNode.focus) {
							targetNode.focus();
						} else {
							this.iframe.contentWindow.focus();
						}
					}.bind(this)
				});
			}

			this._contextMenuKey = 0;
			this._stopEvent(e);
		},

		getSpecialActionByTargetNode: function(targetNode) {
			if (targetNode) {
				if (targetNode.className.indexOf('ExpandDetailsButton') > -1) {
					return 'expandDetails';
				} else if (targetNode.className.indexOf('EditableCell') > -1) {
					return targetNode.getAttribute('actionName');
				} else if (targetNode.className.indexOf('ExpandoButton') > -1) {
					return 'expandNode';
				} else if (targetNode.className.indexOf('ConditionButton') > -1) {
					return 'showCondition';
				} else if (targetNode.className.indexOf('ElementPlaceholder') > -1) {
					var targetElement = this.domapi.getObject(targetNode);

					if (targetElement.is('ArasImageXmlSchemaElement')) {
						return 'selectImage';
					} else if ((targetElement.is('ArasItemXmlSchemaElement'))) {
						return 'selectItem';
					}
				}
			}
		},

		onClick: function(e) {
			var targetDomNode = e.target;
			var targetObject = this.domapi.getObject(targetDomNode);

			this.inherited(arguments);
			this.viewmodel.SuspendInvalidation();

			if (e.button === 0) {
				var specialAction = this.getSpecialActionByTargetNode(targetDomNode);

				if (specialAction && targetObject) {
					switch (specialAction) {
						case 'expandDetails':
							var collapsedContent = targetDomNode.parentNode.parentNode.querySelector('.CollapsedDetails');

							targetDomNode.style.display = 'none';
							collapsedContent.style.display = '';
							break;
						case 'changeQuantity':
							if (this.uiUtils.tooltipDialog.isActive()) {
								break;
							}
							var consumedPartId = targetDomNode.getAttribute('consumedPartId');
							var consumedPartItem = this.datamodel.getItemById(consumedPartId);
							var coords = this._getCoordinates(e, targetObject.Id());

							this.datamodel.actionsHelper.executeAction('changequantity', {
								selectedItem: consumedPartItem,
								isChangeQuantity: true,
								tooltipDialogArguments: {x: coords.x, y: coords.y, around: targetDomNode}
							});
							break;
						case 'expandNode':
							targetObject.collapseInactiveContent(!targetObject.isContentCollapsed());
							break;
						case 'showCondition':
							this.actionsHelper.executeAction('changecondition', {selectedItem: targetObject});
							break;
						case 'selectImage':
							if (this.viewmodel.IsEditable() && !this.viewmodel.ExternalBlockHelper().isExternalBlockContains(targetObject)) {
								this.actionsHelper.getAction('appendelement')._SearchImage(
									function(result) {
										targetObject.Image(result.image);
									}
								);
							}

							this.viewmodel.SetSelectedItems(targetObject);
							break;
						case 'selectItem':
							if (this.viewmodel.IsEditable() && !this.viewmodel.ExternalBlockHelper().isExternalBlockContains(targetObject)) {
								var schemaHelper = this.viewmodel.Schema();
								var typeIdAttribute = schemaHelper.getSchemaAttribute(targetObject, 'typeId');
								var typeId = typeIdAttribute ? typeIdAttribute.Fixed : 'DE828FBA99FF4ABB9E251E8A4118B397';

								this.actionsHelper.getAction('appendelement')._SearchItem(typeId,
									function(result) {
										var resultItem = result.item;

										//we have to get original item type because tp_Item doesn't have all required properties in order to perform
										// custom rendering if it exists
										if (typeId === 'DE828FBA99FF4ABB9E251E8A4118B397') {// tp_Item
											var itemQuery = this.aras.newIOMItem();
											var itemId = this.aras.getItemProperty(resultItem, 'id');

											itemQuery.setAttribute('typeId', 'DE828FBA99FF4ABB9E251E8A4118B397');
											itemQuery.setID(itemId);
											itemQuery.setAction('get');
											resultItem = itemQuery.apply().node;
										}

										targetObject.Item(resultItem);
									}.bind(this)
								);
							}

							this.viewmodel.SetSelectedItems(targetObject);
							break;
						default:
							break;
					}

					this._stopEvent(e);
				} else {
					this.domRange.refresh();

					if (targetObject) {
						if (targetDomNode.ownerDocument.activeElement !== targetDomNode) {
							targetDomNode.focus();
						}

						this.viewmodel.SetSelectedItems(targetObject);
					}
				}
			} else if (e.button === 2 && targetObject) {
				this.domRange.setCursorTo(targetObject, 0, targetObject, 0);
				this.viewmodel.SetSelectedItems(targetObject);
			}

			this.viewmodel.ResumeInvalidation();
		},

		onKeyDown: function(e) {
			var keyCode = this._contextMenuKey = e.which || e.keyCode;

			// [FF.24 specific] _passedKeyDownCheck was introduced in order to fix problem in FF.24, where e.prevenetDefault()
			// in "keydown" event doesn't stop "keypress" event occurance
			// this workaround can be removed, when minimal supported version will be changed
			this._passedKeyDownCheck = true;

			switch (keyCode) {
				case keys.RIGHT_ARROW:
				case keys.LEFT_ARROW:
				case keys.DOWN_ARROW:
				case keys.UP_ARROW:
					setTimeout(function() {
						this.handleArrowKey(keyCode);
					}.bind(this), 0);

					return false;
				case keys.TAB:
					this.handleTabKey(e);
					this._stopEvent(e);

					return false;
				case keys.ENTER:
					this.handleEnterKey(e);
					this._stopEvent(e);

					return false;
				default:
					if (!this.viewmodel.IsEditable() && !(keyCode === 67 && e.ctrlKey && !e.altKey)) {
						// only copy operation allowed
						e.preventDefault();
						this._passedKeyDownCheck = false;
						return false;
					}
					if (this.handleShortcuts(e)) {
						this._stopEvent(e);
						this._passedKeyDownCheck = false;
					}

					if (this._allowedKeydownKeys[keyCode]) {
						this.handleAllowedKey(e);
					}

					break;
			}
		},

		onKeyPress: function(e) {
		},

		onKeyUp: function(e) {
		},

		getNormalizedItem: function(cursorItem, selectItem) {
			return (cursorItem && cursorItem.Parent === selectItem) ? cursorItem : selectItem;
		},

		handleAllowedKey: function(e) {
			var isCtrlPressed = e.ctrlKey || e.metaKey;
			var viewCursor = this.viewmodel.Cursor();
			var selectedItems = this.viewmodel.GetSelectedItems();
			var selectedItem = selectedItems.length ? selectedItems[selectedItems.length - 1] : viewCursor.commonAncestor;

			if (selectedItem !== viewCursor.commonAncestor) {
				selectedItem = this.getNormalizedItem(viewCursor.commonAncestor, selectedItem);
			}

			if (!isCtrlPressed && selectedItem && !(selectedItem.is('ArasTextXmlSchemaElement') || selectedItem.is('XmlSchemaText'))) {
				var insertResult = this.insertSymbolAtCursor('');

				if (insertResult.placement === 'newChild') {
					this._stopEvent(e);
				}
			}
		},

		handleArrowKey: function(keyCode) {
			var viewCursor = this.viewmodel.Cursor();
			var oldCursorState = viewCursor.CreateMemento().GetState();
			this.domRange.refresh();
			var newCursorState = viewCursor.CreateMemento().GetState();

			if (newCursorState.startOffset === newCursorState.endOffset && oldCursorState.startOffset === newCursorState.startOffset &&
				oldCursorState.endOffset === newCursorState.endOffset) {
				var moveDirection;

				switch (keyCode) {
					case keys.UP_ARROW:
						moveDirection = Enums.Directions.Up;
						break;
					case keys.RIGHT_ARROW:
						moveDirection = Enums.Directions.Right;
						break;
					case keys.DOWN_ARROW:
						moveDirection = Enums.Directions.Down;
						break;
					case keys.LEFT_ARROW:
						moveDirection = Enums.Directions.Left;
						break;
					default:
						break;
				}

				this.shiftSelectedElement(moveDirection, moveDirection === Enums.Directions.Right || moveDirection === Enums.Directions.Down);
			}
		},

		insertSymbolAtCursor: function(newSymbol) {
			var viewCursor = this.viewmodel.Cursor();
			var schemaHelper = this.viewmodel.Schema();
			var selectedItems = this.viewmodel.GetSelectedItems();
			var selectedItem = selectedItems.length ? selectedItems[selectedItems.length - 1] : viewCursor.commonAncestor;
			var insertResult = {placement: 'direct', element: selectedItem};

			if (selectedItem !== viewCursor.commonAncestor) {
				selectedItem = this.getNormalizedItem(viewCursor.commonAncestor, selectedItem);
				insertResult.element = selectedItem;
			}

			this.domRange.refresh();
			this.viewmodel.SuspendInvalidation();

			if (selectedItem && selectedItem.is('ArasTextXmlSchemaElement')) {
				selectedItem.InsertText(newSymbol);
			} else if (selectedItem) {
				if (!viewCursor.collapsed) {
					viewCursor.DeleteContents();
				}

				if (viewCursor.collapsed) {
					if (selectedItem) {
						if (selectedItem.is('XmlSchemaText')) {
							var insertPosition = viewCursor.startOffset;
							var stringBeforeEditing = selectedItem.Text();
							var partBeforeInsert = stringBeforeEditing.slice(0, insertPosition);
							var partAfterInsert = stringBeforeEditing.slice(insertPosition);
							var stringAfterEditing = [partBeforeInsert, newSymbol, partAfterInsert].join('');

							selectedItem.Text(stringAfterEditing);
							viewCursor.Set(selectedItem, insertPosition + 1, selectedItem, insertPosition + 1);
						} else {
							var childItems = selectedItem.ChildItems();
							var isPlacedIntoChild = false;
							var targetTextElement, textContent;

							// if selected element have childs and first child is textElement, then append newSymbol to this element
							if (childItems.length()) {
								var firstChild = childItems.get(0);

								if (firstChild.is('ArasTextXmlSchemaElement') || schemaHelper.IsContentMixed(firstChild)) {
									targetTextElement = firstChild;
									insertResult = {placement: 'existingChild', element: firstChild};
									isPlacedIntoChild = true;
								}
							}

							if (!isPlacedIntoChild) {
								var elementType = Enums.XmlSchemaElementType.Text | Enums.XmlSchemaElementType.Mixed;
								var expectedElements = schemaHelper.GetExpectedElements(selectedItem, elementType);
								var expectedTextChilds = expectedElements.insert;

								if (expectedTextChilds.length) {
									if (expectedTextChilds.length === 1) {
										// if only one type of text element is expected, then imediately create it
										targetTextElement = this.viewmodel.CreateElement('element', {type: expectedTextChilds[0]});
										childItems.insertAt(0, targetTextElement);
									} else {
										insertResult = {placement: 'newChild', element: targetTextElement};
										// if there are several possible elements exist, then ask user
										this.showTextElementCreateMenu(selectedItem, expectedTextChilds);
										insertResult = {placement: 'menu', element: null};
									}
								}
							}

							// if appropriate text container was found, then place newSymbol into it
							if (targetTextElement) {
								if (targetTextElement.is('ArasTextXmlSchemaElement')) {
									textContent = targetTextElement.GetTextAsString();
									viewCursor.Set(targetTextElement, textContent.length, targetTextElement, textContent.length);
									this.viewmodel.SetSelectedItems(targetTextElement);

									if (newSymbol) {
										targetTextElement.InsertText(newSymbol);
									}
								} else if (schemaHelper.IsContentMixed(targetTextElement)) {
									var textElementChilds = targetTextElement.ChildItems();
									var textChild = textElementChilds.get(textElementChilds.length() - 1);

									if (textChild && textChild.is('XmlSchemaText')) {
										if (newSymbol) {
											textContent = textChild.Text() + newSymbol;
											textChild.Text(textContent);
										} else {
											textContent = textChild.Text();
										}

										this.viewmodel.SetSelectedItems(textChild);
										viewCursor.Set(textChild, textContent.length, textChild, textContent.length);
									}
								}
							}
						}
					}
				}
			}

			this.viewmodel.ResumeInvalidation();
			return insertResult;
		},

		showSiblingCreateMenu: function(targetElement, isNextIteration) {
			if (targetElement) {
				var contextMenuItems = this.actionsHelper.getCreateSiblingMenu(targetElement);
				var parentElement = targetElement.Parent;
				var isTargetTableCell = Boolean(parentElement) && parentElement.is('ArasRowXmlSchemaElement') && targetElement.is('ArasCellXmlSchemaElement');

				if (contextMenuItems.length && !isTargetTableCell) {
					var elementId = targetElement.Id();
					var targetNode = this.domapi.getNodeById(elementId);
					var currentNode = targetNode;
					var xCoor = 0;
					var yCoor = 0;
					var firstMenuItem;

					if (parentElement) {
						contextMenuItems.unshift({id: 'add_parent_sibling', name: this.uiUtils.getResource('editorMenu.goUp'), icon: '../../images/GoUp.svg'});
					}

					// menu positioning
					while (currentNode) {
						xCoor += currentNode.offsetLeft;
						yCoor += currentNode.offsetTop;
						currentNode = currentNode.offsetParent;
					}

					xCoor += this.domNode.offsetLeft + 10;
					yCoor += this.domNode.offsetTop + targetNode.offsetHeight - this.scrollNode.scrollTop;

					this.actionsHelper.showContextMenu(this._contextMenu, this, contextMenuItems, elementId, {
						x: xCoor,
						y: yCoor,
						onClose: function() {
							var targetNode = this.domapi.getNodeById(elementId);

							if (targetNode && targetNode.focus) {
								targetNode.focus();
							} else {
								this.iframe.contentWindow.focus();
							}
						}.bind(this)
					});

					firstMenuItem = this._contextMenu.getItemById(contextMenuItems[0].id);
					firstMenuItem.item.focus();
				} else if (parentElement && !isNextIteration) {
					var modelCursor = this.viewmodel.Cursor();

					this.viewmodel.SetSelectedItems(parentElement);
					modelCursor.Set(parentElement, 0, parentElement, 0);

					setTimeout(function() {
						this.showSiblingCreateMenu(parentElement, true);
					}.bind(this), 0);
				}
			}
		},

		showTextElementCreateMenu: function(targetElement, elementsList) {
			if (targetElement && elementsList.length) {
				var elementId = targetElement.Id();
				var targetNode = this.domapi.getNodeById(elementId);
				var schemaHelper = this.viewmodel.Schema();
				var currentNode = targetNode;
				var xCoor = 0;
				var yCoor = 0;
				var contextMenuItems = [];
				var firstMenuItem, itemName, itemType, i;

				for (i = 0; i < elementsList.length; i++) {
					itemName = elementsList[i];
					itemType = schemaHelper.GetSchemaElementType(itemName);
					contextMenuItems.push({id: 'insertelement:' + itemName, name: itemName, icon: Enums.getImagefromType(itemType)});
				}

				// menu positioning
				while (currentNode) {
					xCoor += currentNode.offsetLeft;
					yCoor += currentNode.offsetTop;
					currentNode = currentNode.offsetParent;
				}

				xCoor += this.domNode.offsetLeft + 10;
				yCoor += this.domNode.offsetTop + targetNode.offsetHeight - this.scrollNode.scrollTop;

				this.actionsHelper.showContextMenu(this._contextMenu, this, contextMenuItems, elementId, {
					x: xCoor,
					y: yCoor,
					onClose: function() {
						var targetNode = this.domapi.getNodeById(elementId);

						if (targetNode && targetNode.focus) {
							targetNode.focus();
						} else {
							this.iframe.contentWindow.focus();
						}
					}.bind(this)
				});

				firstMenuItem = this._contextMenu.getItemById(contextMenuItems[0].id);
				firstMenuItem.item.focus();
			}
		},

		handleEnterKey: function(e) {
			if (this.viewmodel.IsEditable() && !e.altKey && !e.ctrlKey) {
				this.syncBeforeAction(e);

				if (e.shiftKey) {
					this.insertSymbolAtCursor('\n');
				} else {
					var modelCursor = this.viewmodel.Cursor();
					var targetElement = modelCursor.end || modelCursor.start;

					targetElement = targetElement ? this.viewmodel.GetAncestorOrSelfElement(targetElement) : null;
					this.showSiblingCreateMenu(targetElement);
				}
			}
		},

		handleTabKey: function(e) {
			if (e.ctrlKey) {
				if (this.viewmodel.IsEditable()) {
					this.syncBeforeAction(e);
					this.insertSymbolAtCursor('\t');
				}
			} else {
				this.shiftSelectedElement(e.shiftKey ? Enums.Directions.Left : Enums.Directions.Right);
			}
			return false;
		},

		shiftSelectedElement: function(moveDirection, cursorAtStart) {
			/// <summary>
			/// Changes selected element based on 'moveDirection'.
			/// </summary>
			/// <param name="moveDirection" type="Enums.Directions">Position of next element relatively to current.</param>
			/// <param name="cursorAtStart" type="Boolean">If false, then cursor will be placed at the end of found element.</param>
			var selectedItems = this.viewmodel.GetSelectedItems();

			if (selectedItems.length) {
				var currentItem = selectedItems[selectedItems.length - 1];
				var nextElement = this.getNextElementByDirection(currentItem, moveDirection);
				var nextIndex = this.viewmodel.getElementIndex(nextElement);

				if (nextElement) {
					var innacurateElement = nextElement;
					var schemaHelper = this.viewmodel.Schema();

					while (innacurateElement &&
						(innacurateElement.ChildItems && innacurateElement.ChildItems().length() > 0 && !schemaHelper.IsContentMixed(innacurateElement))) {
						nextIndex += 1;
						innacurateElement = this.viewmodel.getElementByIndex(nextIndex);
					}

					nextElement = innacurateElement || nextElement;

					setTimeout(function() {
						this.placeCursorOnElement(nextElement, cursorAtStart ? 'start' : 'end');
						this.viewmodel.SetSelectedItems(nextElement);
					}.bind(this), 0);
				}
			}
		},

		getCellContainer: function(targetElement) {
			while (targetElement) {
				if (targetElement.is('ArasCellXmlSchemaElement')) {
					return targetElement;
				}

				targetElement = targetElement.Parent;
			}
		},

		getTableContainer: function(targetElement) {
			var rowContainer;

			while (targetElement) {
				if (targetElement.is('ArasTableXmlSchemaElement')) {
					return targetElement;
				} else if (targetElement.is('ArasRowXmlSchemaElement') && !rowContainer) {
					rowContainer = targetElement;
				}

				targetElement = targetElement.Parent;
			}

			return rowContainer;
		},

		getNextElementByDirection: function(targetElement, moveDirection) {
			/// <summary>
			/// Searches next element from current by direction.
			/// </summary>
			/// <param name="targetElement" type="WrappedObject">Start element for search.</param>
			/// <param name="moveDirection" type="Enums.Directions">Position of next element relatively to start element.</param>
			/// <returns>Found element.</returns>
			if (targetElement) {
				var directions = Enums.Directions;
				var positionIncrement = (moveDirection === directions.Right || moveDirection === directions.Down);
				var positionOffset = positionIncrement ? 1 : -1;
				var mergeCells, cellChilds, i, nextMergeCell,
					nextIndex, nextElement, targetTableContainer, nextTableContainer, parentCell;

				parentCell = this.getCellContainer(targetElement);

				if (!positionIncrement) {
					while (targetElement !== parentCell && targetElement.Parent && targetElement.Parent.ChildItems().index(targetElement) === 0) {
						targetElement = targetElement.Parent;
					}
				}

				if (parentCell) {
					cellChilds = parentCell.getAllChilds();
					var isCellNavigation = targetElement.is('ArasCellXmlSchemaElement') ||
						((moveDirection === directions.Left || moveDirection === directions.Up) && targetElement === cellChilds[1]) ||
						((moveDirection === directions.Right || moveDirection === directions.Down) && targetElement === cellChilds[cellChilds.length - 1]);

					if (isCellNavigation) {
						mergeCells = parentCell.getMergeCells();

						if (mergeCells.length === 1) {
							nextElement = parentCell.getNextCell(moveDirection);
						} else {
							var indexLimit = positionIncrement ? mergeCells.length : -1;
							var nextPosition = mergeCells.indexOf(parentCell) + positionOffset;

							while (nextPosition !== indexLimit) {
								var nextCell = mergeCells[nextPosition];

								if (nextCell.ChildItems().length() > 0) {
									nextMergeCell = nextCell;
									break;
								}

								nextPosition += positionOffset;
							}

							nextElement = nextMergeCell || parentCell.getNextCell(moveDirection);
						}

						// if next cell was found
						if (nextElement) {
							if (!positionIncrement) {
								if (mergeCells.indexOf(nextElement) === -1) {
									var foundElement = nextElement;
									mergeCells = nextElement.getMergeCells();
									for (i = mergeCells.length - 1; i >= 0; i--) {
										nextMergeCell = mergeCells[i];
										cellChilds = nextMergeCell.getAllChilds();
										if (cellChilds.length > 1) {
											foundElement = cellChilds[cellChilds.length - 1];
											break;
										}
									}

									nextElement = foundElement;
								} else {
									var allCellChilds = nextElement.getAllChilds();
									nextElement = allCellChilds[allCellChilds.length - 1];
								}
							}

							return nextElement;
						}
						// if cell was not found, then selection moved out from the table
						var cellContainer = parentCell.GetTable() || parentCell.Parent;
						if (positionIncrement) {
							var tableSiblings = cellContainer.Parent.ChildItems();

							nextElement = tableSiblings.get(tableSiblings.index(cellContainer) + 1) || targetElement;
						} else {
							var containerIndex = this.viewmodel.getElementIndex(cellContainer);

							nextElement = this.viewmodel.getElementByIndex(containerIndex - 1) || cellContainer;
						}
					}

					targetTableContainer = this.getTableContainer(parentCell);
				}

				if (!nextElement) {
					nextIndex = this.viewmodel.getElementIndex(targetElement) + (positionIncrement ? 1 : -1);
					nextElement = this.viewmodel.getElementByIndex(nextIndex);

					// skip XmlSchemaText nodes
					while (nextElement && nextElement.is('XmlSchemaText')) {
						nextIndex += (positionIncrement ? 1 : -1);
						nextElement = this.viewmodel.getElementByIndex(nextIndex);
					}
				}

				// trying to correct next element
				if (nextElement) {
					nextTableContainer = this.getTableContainer(nextElement);

					// if we switched into the table from other element
					if (nextTableContainer && targetTableContainer !== nextTableContainer) {
						// if switched from element, that placed under the table
						if (!positionIncrement) {
							nextElement = this.getCellContainer(nextElement);

							// if switched to last cell via upArrow, then move selection to the first cell of the last row
							if (moveDirection === directions.Up) {
								if (nextElement === nextTableContainer.getLastCell()) {
									nextElement = nextTableContainer.is('ArasTableXmlSchemaElement') ?
										nextTableContainer.getSelectableCell(nextTableContainer.RowCount() - 1, 0) :
										nextTableContainer.ChildItems().get(0);
								}
							}

							mergeCells = nextElement.getMergeCells();

							for (i = mergeCells.length - 1; i >= 0; i--) {
								cellChilds = mergeCells[i].getAllChilds();

								if (cellChilds.length > 1) {
									nextElement = cellChilds[cellChilds.length - 1];
									break;
								}
							}
						}
					}
				}

				return nextElement;
			}
		},

		placeCursorOnElement: function(targetElement, cursorPlace) {
			var viewCursor = this.viewmodel.Cursor();
			var schemaHelper = this.viewmodel.Schema();
			var isCursorAtTheEnd = cursorPlace === 'end';
			var cursorPosition;

			if (targetElement.is('ArasTextXmlSchemaElement')) {
				var targetEmph = targetElement.getEmphObjectByIndex(isCursorAtTheEnd ? targetElement.getEmphsCount() - 1 : 0);

				targetElement.selection.Clear();
				if (targetEmph) {
					cursorPosition = isCursorAtTheEnd ? targetEmph.TextLength() : 0;

					targetElement.selection.From(targetEmph.Id(), cursorPosition);
					targetElement.selection.To(targetEmph.Id(), cursorPosition);
				}

				this.domRange.setCursorTo(targetElement, cursorPlace, targetElement, cursorPlace);
			} else if (schemaHelper.IsContentMixed(targetElement)) {
				var textChilds = targetElement.ChildItems();
				var targetString = textChilds.get(textChilds.length() - 1);

				if (targetString && targetString.is('XmlSchemaText')) {
					var textContent = targetString.Text();

					cursorPosition = isCursorAtTheEnd ? textContent.length : 0;
					viewCursor.Set(targetString, cursorPosition, targetString, cursorPosition);
				}
			} else {
				viewCursor.Set(targetElement, 0, targetElement, 0);
			}
		},

		handleCtrlB: function(e) {
			if (this.viewmodel.IsEditable()) {
				this.syncBeforeAction(e);
				this.actionsHelper.executeAction('arastextactions', {actionName: 'bold'});
			}

			return false;
		},

		handleCtrlI: function(e) {
			if (this.viewmodel.IsEditable()) {
				this.syncBeforeAction(e);
				this.actionsHelper.executeAction('arastextactions', {actionName: 'italic'});
			}

			return false;
		},

		handleCtrlS: function(e) {
			if (this.viewmodel.IsEditable()) {
				this.syncBeforeAction(e);
			}

			return true; // let standard onSaveCommand() be executed and save Item
		},

		handleCtrlU: function(e) {
			if (this.viewmodel.IsEditable()) {
				this.syncBeforeAction(e);
				this.actionsHelper.executeAction('arastextactions', {actionName: 'under'});
			}

			return false;
		},

		setupDefaultShortcuts: function() {
			/*   Need to kill error of RichText's call shortcuts
			Override dijit._editor.RichText that use setupDefaultShortcuts to set
				b, i, u, a, s, m
			*/
		},

		_setDisabledAttr: function(/*Boolean*/ value) {
			// union of dijit.Editor._setDisabledAttr and dijit._editor.RichText._setDisabledAttr
			// but specific logic for "ff" was not included in order to fix problem with flashing caret
			// which is allways visible if document.designMode = "On", also seems that minimal supported by Aras
			// version of FF behaves normally with "contentEditable"

			// this code copied from dijit.Editor._setDisabledAttr
			this.setValueDeferred.then(function() {
				if ((!this.disabled && value) || (!this._buttonEnabledPlugins && value)) {
					// Disable editor: disable all enabled buttons and remember that list
					array.forEach(this._plugins, function(p) {
						p.set('disabled', true);
					});
				} else if (this.disabled && !value) {
					// Restore plugins to being active.
					array.forEach(this._plugins, function(p) {
						p.set('disabled', false);
					});
				}
			}.bind(this));

			// this code copied from dijit._editor.RichText
			value = Boolean(value);
			this._set('disabled', value);

			if (!this.isLoaded) {
				return;
			} // this method requires init to be complete
			var preventIEfocus = this._environment.isIE && (this.isLoaded || !this.focusOnLoad);
			if (preventIEfocus) {
				this.editNode.unselectable = 'on';
			}
			this.editNode.contentEditable = !value;
			this.editNode.tabIndex = value ? '-1' : this.tabIndex;
			if (preventIEfocus) {
				this.defer(function() {
					if (this.editNode) {        // guard in case widget destroyed before timeout
						this.editNode.unselectable = 'off';
					}
				});
			}
			this._disabledOK = true;
		},

		_onBlur: function() {
			// union of dijit.Editor._onBlur, dijit._editor.RichText._onBlur and dijit._FocusMixin._onBlur
			// partially removed code from RichText._onBlur with focus logic (IE specific)
			// summary:
			//		Called from focus manager when focus has moved away from this editor
			// tags:
			//		protected
			var newValue;

			// dijit._FocusMixin code part
			this.onBlur();
			// end of dijit._FocusMixin code part

			// dijit._editor.RichText code part
			newValue = this.getValue(true);
			if (newValue !== this.value) {
				this.onChange(newValue);
			}
			this._set('value', newValue);
			// end of dijit._editor.RichText code part

			// dijit.Editor code part
			this.endEditing(true);
		},

		setValue: function(html) {
			// copy of dijit.Editor.setValue
			// with changed domNode, where innerHTML setted

			if (!this.isLoaded) {
				// try again after the editor is finished loading
				this.onLoadDeferred.then(function() {
					this.setValue(html);
				}.bind(this));
				return;
			}

			this._cursorToStart = true;
			if (this.textarea && (this.isClosed || !this.isLoaded)) {
				this.textarea.value = html;
			} else {
				var node = this.isClosed ? this.domNode : this.contentNode || this.editNode;

				html = this._preFilterContent(html);
				if (html && this._environment.isFirefox && html.toLowerCase() === '<p></p>') {
					html = '<p>&#160;</p>';	// &nbsp;
				}

				// Use &nbsp; to avoid webkit problems where editor is disabled until the user clicks it
				if (!html && has('webkit')) {
					html = '&#160;';	// &nbsp;
				}

				node.innerHTML = html;
				this._preDomFilterContent(node);
			}

			this.onDisplayChanged();
			this._set('value', this.getValue(true));
		}
	});
});
