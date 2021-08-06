/*global dojo*/
define([
	'dojo/_base/declare',
	'dijit/Tree',
	'dojo/store/Memory',
	'dojo/store/Observable',
	'dijit/tree/ObjectStoreModel',
	'dojo/aspect',
	'MPP/UI/ProcessPlan/TreeRenderer',
	'Aras/Client/Controls/Experimental/ContextMenu',
	'MPP/UI/ProcessPlan/DnD/DndSourceTarget/DndTarget',
	'MPP/UI/ProcessPlan/DnD/DndSourceTarget/DndSource',
	'MPP/Model/ModelEnums',
	'dojo/on',
	'dojo/when',
	'dijit/dijit',
	'dojo/mouse'
],
function(declare, DijitTree, Memory, Observable, ObjectStoreModel, aspect, TreeRenderer, ContextMenu, DndTarget, DndSource, Enums, on, when, dijit, mouse) {
	var PPTree = declare('Aras.Innovator.Solutions.MPP.UI.ProcessPlan.Tree', [DijitTree, DndTarget, DndSource], {
		appmodel: null,
		treeRenderer: null,
		_contextMenu: null,
		actionsHelper: null,
		_clipboard: null,
		_treeNodesToDrag: null,
		_selectedItemIdsToDrag: null,

		constructor: function(initialArguments) {
			var fileref = document.createElement('link');
			var dragController = initialArguments.dragController;
			var storeData, treeStore;

			fileref.setAttribute('rel', 'stylesheet');
			fileref.setAttribute('type', 'text/css');
			fileref.setAttribute('href', 'Styles/ProcessPlanTree.css');
			document.getElementsByTagName('head')[0].appendChild(fileref);

			this.persist = true;
			this.appmodel = initialArguments.appmodel;
			this.treeRenderer = new TreeRenderer({tree: this, viewmodel: this.appmodel});
			this.actionsHelper = this.appmodel.ActionsHelper();
			this.uiUtils = initialArguments.uiUtils;

			storeData = this.treeRenderer.RenderModel(this.appmodel.Dom());
			storeData.labelType = 'html';

			treeStore = new Memory({
				data: storeData,
				getChildren: function(object) {
					return this.query({parent: object.id});
				}
			});

			// Create the model
			this.model = new ObjectStoreModel({
				store: treeStore,
				query: {id: this.appmodel.Dom().Id()},
				mayHaveChildren: function(object) {
					var childItems = this.store.getChildren(object) || [];
					return childItems.length > 0;
				},
				labelType: 'html'
			});

			if (dragController) {
				dragController.registerTarget(this);
			}

			this.selectionPromise = null;
		},

		dragOver: function(dndEvent) {
			dndEvent.preventDefault();

			if (this.dndData.dragData) {
				var targetWidget = dijit.getEnclosingWidget(dndEvent.target);
				var previousNode = this.dndData.dropboxNode;
				var previousPosition = this.dndData.dropboxData;

				if (targetWidget && targetWidget.declaredClass === 'dijit._TreeNode') {
					var isClosedExpando = dndEvent.target.className.indexOf('dijitTreeExpandoClosed') !== -1;

					if (isClosedExpando) {
						this._expandNode(targetWidget);
					} else if (!previousNode || targetWidget.domNode !== previousNode) {
						var treeItem = targetWidget.item;
						var viewElement = this.appmodel.GetElementById(treeItem.id);

						if (viewElement && viewElement.is('ArasInternalItemXmlSchemaElement')) {
							var dropboxData = this.searchDropPosition(targetWidget, this.dndData.dragData);

							if (dropboxData) {
								if (!previousPosition ||
								(dropboxData.dropElement !== previousPosition.dropElement) ||
								(dropboxData.action !== previousPosition.action)) {
									var dropboxCssClass = '';
									var targetNodeWidget = dropboxData.nodeWidget;

									if (dropboxData.isValid) {
										dropboxCssClass += 'dragOverRowValid';
										if (dropboxData.action === 'paste_here') {
											dropboxCssClass += ' pasteHereDropbox';
										} else {
											dropboxCssClass += dropboxData.action === 'insert' ? ' insertDropbox' : ' addDropbox';
										}
									} else {
										dropboxCssClass += 'dragOverRowInvalid';
									}

									this.drawDropbox(dropboxData, dropboxCssClass);

									// time should be equal to rowHeight transition duration
									setTimeout(function() {
										this._scrollToSelectedItems([targetNodeWidget.item], 25);
									}.bind(this), 200);
								}
							} else {
								this.cleanupDropbox();
							}
						}
					}
				} else if (previousPosition) {
					this.cleanupDropbox();
				}
			}
		},

		dragEndTarget: function(dragSource, dndEvent) {
			this.inherited(arguments);
			this.cleanupDropbox();
		},

		dragEnter: function(dndEvent) {
			if (this.isRegistered()) {
				var dragController = this.dndData.controller;
				var dragData = dragController.getDragData();

				if (typeof dragData === 'object' && (dragData.dataType === 'WorkbenchItem' || dragData.dataType === 'TreeItem')) {
					this.dndData.dragData = dragData;
				}
			}
		},

		_getCountAndDirectionToMove: function(sourceModelItems, targetModelItem) {
			var sourceItemSiblings = sourceModelItems[0].Parent.getChildrenByType(sourceModelItems[0].getType());
			var sourceItemSibling,
				sourceItemIndex,
				targetItemIndex,
				i,
				isUp,
				maxSourceSortOrder,
				minSourceSortOrder,
				targetSourceSortOrderInt,
				sortOrderInt,
				sourceModelItem,
				isTargetParentItem;

			for (i = 0; i < sourceModelItems.length; i++) {
				sourceModelItem = sourceModelItems[i];
				sortOrderInt = parseInt(sourceModelItem.getProperty('sort_order'));
				if (sortOrderInt > maxSourceSortOrder || i === 0) {
					maxSourceSortOrder = sortOrderInt;
				}
				if (sortOrderInt < minSourceSortOrder || i === 0) {
					minSourceSortOrder = sortOrderInt;
				}
			}

			targetSourceSortOrderInt = parseInt(targetModelItem.getProperty('sort_order'));
			isTargetParentItem = targetModelItem.is('ProcessPlan') || (sourceModelItems[0].is('Step') && targetModelItem.is('Operation'));
			if (isTargetParentItem) {
				isUp = true;
			} else {
				if (targetSourceSortOrderInt > minSourceSortOrder && targetSourceSortOrderInt < maxSourceSortOrder) {
					//a case if target is between sources.
					return {count: 0};
				}
				//take any sourceModelItem to set 'isUp'
				isUp = targetSourceSortOrderInt < parseInt(sourceModelItems[0].getProperty('sort_order'));
			}

			sourceItemSiblings.sort(this._compareSortOrders);
			sourceModelItems.sort(this._compareSortOrders);

			for (i = 0; i < sourceItemSiblings.length; i++) {
				sourceItemSibling = sourceItemSiblings[i];
				//take the last sourceModelItem if 'isUp', take the first if not 'isUp'. Another words: to take the closest source to the target.
				if (sourceItemSibling.Id() === sourceModelItems[isUp ? 0 : sourceModelItems.length - 1].Id()) {
					sourceItemIndex = i;
				}
				if (isTargetParentItem) {
					targetItemIndex = -1;
				} else if (sourceItemSibling.Id() === targetModelItem.Id()) {
					targetItemIndex = i;
				}
			}
			var countToMove = Math.abs(sourceItemIndex - targetItemIndex);
			if (isUp) {
				countToMove--;
			}
			return {count: countToMove, isUp: isUp};
		},

		_compareSortOrders: function(item1, item2) {
			var item1SortOrderInt = parseInt(item1.getProperty('sort_order'), 0);
			var item2SortOrderInt = parseInt(item2.getProperty('sort_order'), 0);
			if (isNaN(item1SortOrderInt)) {
				return 1;
			}
			if (isNaN(item2SortOrderInt)) {
				return -1;
			}
			return item1SortOrderInt - item2SortOrderInt;
		},

		drop: function(dndEvent) {
			var dropboxData = this.dndData.dropboxData;

			dndEvent.preventDefault();
			this.cleanupDropbox();

			if (dropboxData && dropboxData.isValid) {
				var dragData = this.dndData.dragData;

				if (dragData) {
					var datamodel = this.appmodel.datamodel;
					var dropElement = dropboxData.dropElement;
					var dropModelItem = dropElement.Item();
					var itemTypeName = Enums.getItemTypeFromModelType(dragData.itemType);
					var droppedItems = [];
					var itemId,
						i,
						j,
						sourceModelItem,
						actionName,
						countAndDirectionToMove,
						sourceModelItems;

					if (dragData.dataType === 'TreeItem') {
						if (!dragData.itemIds || !dragData.itemIds.length) {
							return;
						}

						sourceModelItems = dragData.itemIds.map(
							function(itemId) {
								return datamodel.getItemById(itemId);
							}
						);
						sourceModelItems.sort(this._compareSortOrders);
						countAndDirectionToMove = this._getCountAndDirectionToMove(sourceModelItems, dropModelItem);
						if (!countAndDirectionToMove.isUp) {
							sourceModelItems.reverse();
						}
						for (i = 0; i < sourceModelItems.length; i++) {
							sourceModelItem = sourceModelItems[i];
							//we need to call _getCountAndDirectionToMove again to recalculate count for each sourceModelItem.
							//Because if we selects, e.g., the first and the third item and move them under forth we need to move different
							//times to drop in a proper place. Here we pass only one item, not entire array sourceModelItems.
							//Also, we need to correct count: 'countAndDirectionToMove.count - i' not to move always to the dropModelItem.
							countAndDirectionToMove = this._getCountAndDirectionToMove([sourceModelItem], i === 0 ? dropModelItem : sourceModelItems[i - 1]);
							if (i !== 0 && !countAndDirectionToMove.isUp) {
								countAndDirectionToMove.count--;
							}
							actionName = countAndDirectionToMove.isUp ? 'moveup' : 'movedown';
							for (j = 0; j < countAndDirectionToMove.count; j++) {
								datamodel.actionsHelper.executeAction(actionName, {
									selectedItems: [sourceModelItem]
								});
							}
						}
					} else {
						for (i = 0; i < dragData.itemIds.length; i++) {
							itemId = dragData.itemIds[i];
							droppedItems.push(datamodel.aras.getItemById(itemTypeName, itemId));
						}
						datamodel.actionsHelper.executeAction('additem', {
							selectedItem: dropModelItem,
							direction: dropModelItem.is('Operation') ? 'insert' : 'append',
							relatedItemType: dragData.itemType,
							relatedItems: droppedItems
						});
					}
				}
			}
		},

		searchDropPositionForTreeItems: function(targetWidget, dragData) {
			var treeItem = targetWidget.item;
			var targetElement = this.appmodel.GetElementById(treeItem.id);
			var toReturn = {
				action: 'paste_here',
				isValid: true,
				message: this.uiUtils.getResource('treeDradNDrop.pasteHere')
			};

			if (!targetElement) {
				return;
			}
			var targetModelItem = targetElement.Item();
			var datamodel = this.appmodel.datamodel;
			var sourceModelItems = [];
			var sourceModelItemIds = [];
			var dropElement,
				dropNodeWidget,
				countAndDirectionToMove,
				i,
				sourceModelItem,
				sourceModelItemParentId;

			for (i = 0; i < dragData.itemIds.length; i++) {
				sourceModelItem = datamodel.getItemById(dragData.itemIds[i]);
				sourceModelItems.push(sourceModelItem);
				sourceModelItemIds.push(sourceModelItem.Id());
			}
			sourceModelItemParentId = sourceModelItem.Parent.Id();

			if (!targetModelItem || (!datamodel.isFromRootProcessPlan(targetModelItem) && targetModelItem.Parent) ||
				sourceModelItemIds.indexOf(targetModelItem.Id()) !== -1 ||
				(targetModelItem.is('ProcessPlan') && !datamodel.isFromRootProcessPlan(targetModelItem))) {
				return;
			}
			switch (sourceModelItems[0].getType()) {
				case Enums.ModelItemTypes.Operation:
					if (!targetModelItem.is('Operation') && !targetModelItem.is('ProcessPlan')) {
						return;
					}
					break;
				case Enums.ModelItemTypes.Step:
					if ((!targetModelItem.is('Step') && !targetModelItem.is('Operation')) ||
						(targetModelItem.is('Operation') && targetModelItem.Id() !== sourceModelItemParentId) ||
						(targetModelItem.is('Step') && targetModelItem.Parent.Id() !== sourceModelItemParentId)) {
						return;
					}
					break;
				default:
					return;
			}
			dropElement = targetElement;
			dropNodeWidget = this.getNodesByItem(dropElement.Id().toString());
			dropNodeWidget = dropNodeWidget.length ? dropNodeWidget[0] : null;

			if (dropNodeWidget) {
				countAndDirectionToMove = this._getCountAndDirectionToMove(sourceModelItems, dropElement.Item());
				if (!countAndDirectionToMove.count) {
					return;
				}
				toReturn.dropElement = dropElement;
				toReturn.nodeWidget = dropNodeWidget;
				return toReturn;
			}
		},

		searchDropPosition: function(targetWidget, dragData) {
			if (targetWidget) {
				if (dragData.dataType === 'TreeItem') {
					return this.searchDropPositionForTreeItems(targetWidget, dragData);
				}
				var treeItem = targetWidget.item;
				var targetElement = this.appmodel.GetElementById(treeItem.id);

				if (targetElement && targetElement.Parent) {
					var modelItem = targetElement.Item();
					var datamodel = this.appmodel.datamodel;

					// only root process plan item can be used as drop target
					if (modelItem) {
						var dragItemIds = dragData.itemIds;
						var isMultiDrag = dragItemIds.length > 1;
						var messages = {
							insertMessage: isMultiDrag ? this.uiUtils.getResource('treeDradNDrop.insertMultiItemsInto', dragItemIds.length) :
								this.uiUtils.getResource('treeDradNDrop.insertItemInto'),
							existErrorMessage: isMultiDrag ? this.uiUtils.getResource('treeDradNDrop.existErrorMulti') :
								this.uiUtils.getResource('treeDradNDrop.existError'),
							notRootErrorMessage: this.uiUtils.getResource('treeDradNDrop.notRootError')
						};
						var isDropAllowed = true;
						var dropElement, dropAction, dropNodeWidget, dropMessage;

						if (datamodel.isFromRootProcessPlan(modelItem)) {
							var isOperationTarget = modelItem.is('Operation');
							var childItems = isOperationTarget ? targetElement.ChildItems() : targetElement.Parent.ChildItems();
							var allChildren = childItems.List();

							if (allChildren.length) {
								var dragItemType = dragData.itemType;

								for (var i = 0; i < allChildren.length; i++) {
									var currentChild = allChildren[i];
									if (currentChild.is('ArasInternalItemXmlSchemaElement')) {
										var currentModelItem = currentChild.Item();
										if (currentModelItem.getType() !== Enums.ModelItemTypes.OperationResource) {
											continue;
										}
										currentModelItem = currentModelItem.hasRelatedItem() ? currentModelItem.getRelatedItem() : currentModelItem;
										var currentItemType = currentModelItem.getType();

										if (currentItemType <= dragItemType) {
											dropElement = currentChild;

											if (isDropAllowed) {
												isDropAllowed = dragItemIds.indexOf(currentModelItem.Id()) === -1;
											}
										}
									}
								}

								dropAction = isOperationTarget && !targetWidget.isExpanded ? 'insert' : 'add';
								dropElement = (isOperationTarget && !targetWidget.isExpanded) ? targetElement : (dropElement || targetElement);
							} else {
								dropAction = 'insert';
								dropElement = targetElement;
							}

							dropMessage = isDropAllowed ? messages.insertMessage : messages.existErrorMessage;
						} else {
							dropElement = targetElement;
							dropMessage = messages.notRootErrorMessage;
							isDropAllowed = false;
						}

						dropNodeWidget = this.getNodesByItem(dropElement.Id().toString());
						dropNodeWidget = dropNodeWidget.length ? dropNodeWidget[0] : null;

						if (dropNodeWidget) {
							return {
								dropElement: dropElement,
								nodeWidget: dropNodeWidget,
								action: dropAction,
								isValid: isDropAllowed,
								message: dropMessage
							};
						}
					}
				}
			}

			return null;
		},

		drawDropbox: function(dropboxData, cssClass) {
			if (dropboxData) {
				var nodeWidget = dropboxData.nodeWidget;

				this.cleanupDropbox();

				if (dropboxData.message) {
					nodeWidget.rowNode.setAttribute('dropMessage', dropboxData.message);
				}

				// add css classes to dropNode
				dropboxData.cssClass = cssClass;
				this.toggleCssClass(nodeWidget.domNode, cssClass, true);

				this.dndData.dropboxData = dropboxData;
			}
		},

		cleanupDropbox: function() {
			var dropboxData = this.dndData.dropboxData;

			if (dropboxData) {
				var nodeWidget = dropboxData.nodeWidget;

				this.toggleCssClass(nodeWidget.domNode, dropboxData.cssClass);

				if (dropboxData.message) {
					nodeWidget.rowNode.removeAttribute('dropMessage');
				}

				this.dndData.dropboxData = null;
			}
		},

		toggleCssClass: function(targetNode, toggleClassName, addClass) {
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

		_removePreventDefaultForMouseDownOnTree: function() {
			//fix to allow to drag tree nodes. For now in function onClickPress in dojo we have 'e.preventDefault()'. It leads to the case that
			//'dragstart' event isn't called.
			if (!this.appmodel.datamodel.aras.Browser.isCh() && !this.appmodel.datamodel.aras.Browser.isFf()) {
				return;
			}
			if (dojo.version.major !== 1 || dojo.version.minor !== 9 && dojo.version.patch !== 8) {
				throw new Error('The hack below is only for specific version of dojo');
			}
			aspect.before(this.dndController, 'onClickPress', function(e) {
				var flag;
				e.preventDefaultOriginal = e.preventDefault;
				e.preventDefault = function() {
					var originalCondition = e.type === 'mousedown' && mouse.isLeft(e);
					if (originalCondition && !flag) {
						flag = true;
						return;
					}
					e.preventDefaultOriginal();
				};
				this.onClickPress.bind(this);
			}, true);
			aspect.after(this.dndController, 'onClickPress', function(e) {
				e.preventDefault = e.preventDefaultOriginal;
			}, true);
		},

		_removeDojoDragStartHandler: function() {
			//This code is to remove overriding of 'dragstart' event.
			//without this code user don't see standart dragstart browser event logic: tree node (html element) near mouse cursor on move of the html element
			//the events haven't names here, so, we need to use indexes to remove it.
			//see file dijit\tree\_dndContainer.js.
			//on(this.node, "dragstart, selectstart", function(evt){
			// evt.preventDefault();
			//})
			var i,
				event;

			for (i = 0; i < this.dndController.events.length; i++) {
				event = this.dndController.events[i];
				if (event[1]) {//note that for now only event 'on(this.node, "dragstart, selectstart"' has 2 elements. We need to remove only 'dragstart'.
					event[0].remove();
					return;
				}
			}
		},

		startup: function() {
			var originOnClickRelease;

			this.inherited(arguments);

			originOnClickRelease = this.dndController.onClickRelease;
			this.dndController.onClickRelease = function(e) {
				if (e.button !== 2) {
					originOnClickRelease(e);
				}
			};

			this._removeDojoDragStartHandler();
			this._removePreventDefaultForMouseDownOnTree();

			this._contextMenu = new ContextMenu(this.domNode, true);
			this.domNode.oncontextmenu = this._showContextMenu.bind(this);

			this.dndData.domNode = this.domNode;
			this.activateDnD(this.appmodel.datamodel.isEditable());

			on(this.domNode, 'keydown', function(e) {
				this._onKeyDownHandler(e);
			}.bind(this));

			aspect.after(this._contextMenu, 'onItemClick', this._onItemClickHandler.bind(this), true);
			aspect.after(this, '_onNodePress', this._makeTreeNodeDraggable, true);
			aspect.after(this, 'onClick', this._onTreeNodeClick, true);
			aspect.after(this.appmodel, 'OnInvalidate', this._onViewModelInvalidate.bind(this), true);
			aspect.after(this.appmodel, 'onSelectionChanged', this.selectionChangeHandler.bind(this), true);
			aspect.after(this.appmodel, 'onPlanRefreshed', this.planRefreshedHandler.bind(this), true);
		},

		_makeTreeNodeDraggable: function(/*TreeNode*/ nodeWidget, event) {
			var modelItem = this.appmodel.GetElementById(nodeWidget.item.id).internal.modelItem;
			var treeNode = nodeWidget.domNode.childNodes[0];
			var type = modelItem.getType();
			var selectedItems = this.appmodel.GetSelectedItems();
			var treeNodesToDrag = [];
			var self = this;
			var selectedModelItems = selectedItems ? selectedItems.map(
				function(item) {
					treeNodesToDrag.push(self._getNodeById(item.Id()));
					return item.Item();
				}
			) : [];
			var selectedItemIds = selectedModelItems ? selectedModelItems.map(
				function(item) {
					return item.Id();
				}
			) : [];
			// the last selected item will not be here from selectedItems. Add it to the array.
			if (selectedItemIds.indexOf(modelItem.Id()) === -1) {
				if (event.ctrlKey) {
					selectedItemIds.push(modelItem.Id());
					selectedModelItems.push(modelItem);
				} else {
					treeNodesToDrag = [];
					selectedItemIds = [modelItem.Id()];
					selectedModelItems = [modelItem];
				}
			}

			if (this.appmodel.datamodel.isFromRootProcessPlan(modelItem) && (type === Enums.ModelItemTypes.Operation || type === Enums.ModelItemTypes.Step) &&
				this.appmodel.IsEditable() && this.appmodel.datamodel.actionsHelper.isItemsCanBeMoved(selectedModelItems)) {
				treeNode.draggable = true;
				this._treeNodesToDrag = treeNodesToDrag;
				this._treeNodesToDrag.push(treeNode);
				this._selectedItemIdsToDrag = selectedItemIds;
			} else {
				treeNode.draggable = false;
			}
		},

		planRefreshedHandler: function(itemId) {
			var mappedNodes = this._itemNodesMap[itemId];

			if (mappedNodes && mappedNodes.length) {
				for (var i = 0; i < mappedNodes.length; i++) {
					this._collapseNode(mappedNodes[i]);
				}
			}
		},

		getIconClass: function(item, opened) {
			//return this.inherited(arguments);
			return item.type;
		},

		getLabelClass: function(item, opened) {
			return item.type;
		},

		getIconStyle: function(item, opened) {
			return item.style;
		},

		getRowClass: function(item, opened) {
			return item.rowClass;
		},

		_getNodeById: function(itemId) {
			var mappedNodes = this._itemNodesMap[itemId];

			return mappedNodes ? mappedNodes[0].domNode : null;
		},

		_onItemChange: function(item) {
			// overriden version from dijit/Tree.js
			var model = this.model;
			var identity = model.getIdentity(item);
			var itemNodes = this._itemNodesMap[identity];

			if (itemNodes) {
				var label = this.getLabel(item);
				var tooltip = this.getTooltip(item);
				var node, i;

				for (i = 0; i < itemNodes.length; i++) {
					node = itemNodes[i];

					node._setLabelAttr(label);
					node._set('tooltip', tooltip);
					node.item = item;

					node._updateItemClasses(item);
				}
			}
		},

		suspendPainting: function() {
			this._isPaintingSuspended = true;
		},

		resumePainting: function(forcePaint) {
			if (this._isPaintingSuspended) {
				this._isPaintingSuspended = false;

				if (forcePaint) {
					this._startPaint(true);
				}
			}
		},

		_startPaint: function(/*Promise|Boolean*/ p) {
			// overriden version from dijit/Tree.js
			if (!this._isPaintingSuspended) {
				this._outstandingPaintOperations++;

				if (this._adjustWidthsTimer) {
					this._adjustWidthsTimer.remove();
					delete this._adjustWidthsTimer;
				}

				var oc = function() {
					this._outstandingPaintOperations--;

					if (this._outstandingPaintOperations <= 0 && !this._adjustWidthsTimer && this._started) {
						// Use defer() to avoid a width adjustment when another operation will immediately follow,
						// such as a sequence of opening a node, then it's children, then it's grandchildren, etc.
						this._adjustWidthsTimer = this.defer('_adjustWidths');
					}
				}.bind(this);
				when(p, oc, oc);
			}
		},

		_onItemClickHandler: function(cmdId, rowId) {
			var selectedNode = this._getNodeById(rowId);
			var tooltipDialogArguments = {
				langCode: this.appmodel._currentLanguageCode,
				getAroundNode: function() {
					var selectedItems = this.appmodel.GetSelectedItems();
					var elementId = selectedItems.length && selectedItems[0].Id();
					var elementNode = (elementId && this._getNodeById(elementId)) || this._getNodeById(rowId);

					return elementNode && elementNode.firstChild;
				}.bind(this),
				getWaitPromise: function() {
					return this.selectionPromise;
				}.bind(this),
				isAfterNotBelow: true
			};

			this.actionsHelper.onMenuItemClick(cmdId, rowId, tooltipDialogArguments);
			this._hideContextMenu();

			if (cmdId.split(':')[0] === 'pasteelement') {
				var selectedItems = this.appmodel.GetSelectedItems();

				setTimeout(function() {
					this._scrollToSelectedItems([{id: selectedItems[0].Id()}]);
				}.bind(this));

				selectedNode.focus();
			}
		},

		_onKeyDownHandler: function(e) {
			var isEditDocument = this.appmodel.IsEditable();
			var keyCode = e.keyCode;
			var isMacOS = /mac/i.test(navigator.platform);
			var ctrlKeyPressed = isMacOS ? e.metaKey : e.ctrlKey;

			if (ctrlKeyPressed) {
				switch (keyCode) {
					case 90://z
						if (isEditDocument) {

						}
						break;
					case 89://y
						if (isEditDocument) {

						}
						break;
					case 67://c

						break;
					case 88://x
						if (isEditDocument) {
						}
						break;
					case 86://v
						if (isEditDocument) {

						}
						break;
					default:
						e.preventDefault();
						return false;
				}
			} else {
				e.preventDefault();
			}
		},

		_getSelectionPath: function(item) {
			var parentItem = item;
			var path = [parentItem.id];

			while (parentItem.parent) {
				parentItem = this.model.store.query({id: parentItem.parent})[0];
				path.push(parentItem.id);
			}

			path.reverse();
			return path;
		},

		_selectItems: function(selectedItems) {
			var paths = [];
			var selectedItem, i;

			for (i = 0; i < selectedItems.length; i++) {
				selectedItem = selectedItems[i];
				paths.push(this._getSelectionPath(selectedItem));
			}

			this.set('paths', paths);
		},

		_showContextMenu: function(e) {
			var targetWidget = dijit.getEnclosingWidget(e.target);

			if (targetWidget.declaredClass === 'dijit._TreeNode') {
				var treeItem = targetWidget.item;
				var selectedWrappedObject = this.appmodel.GetElementById(treeItem.id);
				var isClickOnSelected = this.appmodel.GetSelectedItems().indexOf(selectedWrappedObject) >= 0;
				var xCoor = 0;
				var yCoor = 0;
				var menuModel;

				if (!isClickOnSelected) {
					this._selectItems([treeItem]);
					this._onTreeNodeClick(treeItem, this.getParent().currentTarget, null);
				}

				menuModel = this.actionsHelper.GetProcessPlanMenuModel(this.appmodel.GetSelectedItems());

				if (menuModel && menuModel.length) {
					if (e.button) {
						xCoor = e.pageX;
						yCoor = e.pageY;
					} else {
						var targetNode = this._getNodeById(treeItem.id);
						var currentNode = targetNode ? targetNode.querySelector('.dijitTreeContent') : null;

						while (currentNode) {
							xCoor += currentNode.offsetLeft;
							yCoor += currentNode.offsetTop;
							currentNode = currentNode.offsetParent;
						}

						xCoor += 10;
						yCoor += 10 - this.domNode.scrollTop;
					}
					this.actionsHelper.showContextMenu(this._contextMenu, this, menuModel, treeItem.id, {x: xCoor, y: yCoor});
				}
			}

			e.preventDefault();
			e.stopPropagation();
		},

		_hideContextMenu: function() {
			dijit.popup.close(this._contextMenu.menu);

			this._contextMenu.rowId = null;
			this._contextMenu.removeAll();
		},

		_onTreeNodeClick: function(treeItem, treeNode, evt) {
			var selectedWrappedObjects = [];
			var selectedTreeItem, wrappedObject, i;

			for (i = 0; i < this.selectedItems.length; i++) {
				selectedTreeItem = this.selectedItems[i];
				wrappedObject = this.appmodel.GetElementById(selectedTreeItem.id);

				selectedWrappedObjects.push(wrappedObject);
			}

			this.appmodel.SetSelectedItems(selectedWrappedObjects);
		},

		_onViewModelInvalidate: function(sender, earg) {
			var invalidationList = earg.invalidationList;

			if (invalidationList.length) {
				var originScrollTop = this.domNode.scrollTop;
				var i;

				for (i = 0; i < invalidationList.length; i++) {
					this.treeRenderer.invalidate(invalidationList[i]);
				}

				this.treeRenderer.refresh();

				if (this.domNode.scrollTop !== originScrollTop) {
					this.domNode.scrollTop = originScrollTop;
				}
			}
		},

		selectionChangeHandler: function(sender, selectedItems) {
			/// <summary>
			/// Handler for Model 'selectionChange' event.
			/// </summary>
			/// <param name="sender" type="Model">Source Model that raised event.</param>
			/// <param name="selectedItems" type="Array of WrappedObjects">Items, that currently selected.</param>
			var selectedTreeItems = [];
			var paths = [];
			var schemaElement, referencedElements, referencedElement, storeItem;

			for (var i = 0; i < selectedItems.length; i++) {
				schemaElement = selectedItems[i];
				referencedElements = this.appmodel.GetElementsByOrigin(schemaElement.origin);

				for (var j = 0; j < referencedElements.length; j++) {
					referencedElement = this.appmodel.GetAncestorOrSelfInteractiveElement(referencedElements[j]);

					storeItem = this.model.store.query({id: referencedElement.Id()})[0];
					if (storeItem) {
						selectedTreeItems.push(storeItem);
						paths.push(this._getSelectionPath(storeItem));
					}
				}
			}

			var selectionPromise = this.set('paths', paths);
			this.selectionPromise = selectionPromise;

			if (selectedTreeItems.length === 1) {
				selectionPromise.then(function() {
					this._scrollToSelectedItems(selectedTreeItems);
					this.selectionPromise = null;
				}.bind(this));
			}
		},

		_scrollToSelectedItems: function(selectedItems, additionalOffset) {
			if (selectedItems.length) {
				var defaultScrollOffset = 30;
				var selectedItem, itemNode, currentNode, minOffsetTop;

				for (var i = 0; i < selectedItems.length; i++) {
					selectedItem = selectedItems[i];
					itemNode = this._getNodeById(selectedItem.id);
					currentNode = itemNode;
					var offsetTop = 0;

					while (currentNode && currentNode !== this.containerNode) {
						offsetTop += currentNode.offsetTop;
						currentNode = currentNode.offsetParent;
					}

					minOffsetTop = (minOffsetTop === undefined) ? offsetTop : Math.min(minOffsetTop, offsetTop);
				}

				additionalOffset = typeof additionalOffset === 'number' ? additionalOffset : 0;
				var scrollTop = this.containerNode.scrollTop;
				var treeHeight = this.containerNode.offsetHeight;

				if ((minOffsetTop - additionalOffset - defaultScrollOffset) < scrollTop) {
					this.containerNode.scrollTop = minOffsetTop - additionalOffset - defaultScrollOffset;
				} else if ((minOffsetTop + additionalOffset + defaultScrollOffset) > scrollTop + treeHeight) {
					this.containerNode.scrollTop = (minOffsetTop + additionalOffset + defaultScrollOffset) - treeHeight;
				}
			}
		},

		_expandNode: function(node) {
			/// <summary>
			/// Expand node handler.
			/// </summary>
			/// <param name="node" type="TreeNode">Target tree node.</param>
			var treeItem = node.item;
			var viewElement = this.appmodel.GetElementById(treeItem.id);
			var fullPpItemNumbersStr = '';
			var shortPpItemNumbersStr = '';
			var maxCountItemNumberToShow = 10;
			var isToShowOnlyMax = false;
			var commaOrEmpty, fullErrorStr, shortErrorStr, i;

			if (viewElement && viewElement.is('ArasInternalItemXmlSchemaElement')) {
				var modelItem = viewElement.Item();

				if (modelItem && modelItem.getType() === Enums.ModelItemTypes.ConsumedPart) {
					var childItems = viewElement.ChildItems();

					if (!childItems.length()) {
						var datamodel = this.appmodel.datamodel;
						var processPlanId = modelItem.getRelatedProcessPlanId();

						// processPlanId can be undefined in two cases, if there is no any plan or several plans were found for part
						if (processPlanId) {
							var processPlanModelItem = datamodel.getProcessPlan(processPlanId);

							if (processPlanModelItem) {
								this.appmodel.onProcessPlanRegistered(processPlanModelItem);
							} else {
								datamodel.getProcessPlan(processPlanId, {loadPermitted: true});
							}
						} else {
							var processPlans = datamodel.getProcessPlanByPartId(modelItem.getRelatedItemId());

							if (processPlans) {
								for (i = 0; i < processPlans.length; i++) {
									commaOrEmpty = i === 0 ? '' : ', ';
									fullPpItemNumbersStr += commaOrEmpty + processPlans[i].planItemNumber;
									if (i < maxCountItemNumberToShow) {
										shortPpItemNumbersStr += commaOrEmpty + processPlans[i].planItemNumber;
									}
									if (i === maxCountItemNumberToShow) {
										isToShowOnlyMax = true;
									}
								}

								fullErrorStr = this.uiUtils.getResource('tree.cantResolveSinglePpAll',
									this.appmodel.datamodel.aras.escapeXMLAttribute(fullPpItemNumbersStr));
								var resourceKey = isToShowOnlyMax ? 'tree.cantResolveSinglePpOnlyMax' : 'tree.cantResolveSinglePpAll';
								shortErrorStr = this.uiUtils.getResource(resourceKey,
									this.appmodel.datamodel.aras.escapeXMLAttribute(shortPpItemNumbersStr));

								this.uiUtils.customAlertInternal(fullErrorStr, shortErrorStr);
							}

							return;
						}
					}
				}
			}

			return this.inherited(arguments);
		},

		_initState: function() {
			// overridden dijit/Tree method
			this._openedNodes = {};
		},

		_saveExpandedNodes: function() {
			// overridden dijit/Tree method, prevented saving expand/collapse state into cookie
		},

		_getOpenedNodesUidPaths: function() {
			var uidPaths = [];
			var idPath, uidPath, nodeId, separatorIndex;

			for (idPath in this._openedNodes) {
				separatorIndex = idPath.lastIndexOf('/');
				nodeId = idPath.substr((separatorIndex > -1) ? separatorIndex + 1 : 0);

				uidPath = this._getNodeUidPath(nodeId);
				uidPaths.push(uidPath);
			}

			return uidPaths;
		},

		_getNodeUidPath: function(nodeId) {
			var nodeItem = this.model.store.get(nodeId);
			var uidPath, parentItem;

			if (nodeItem) {
				uidPath = [nodeItem.uid];

				parentItem = this.model.store.get(nodeItem.parent);
				while (parentItem) {
					uidPath.push(parentItem.uid);
					parentItem = this.model.store.get(parentItem.parent);
				}

				uidPath.reverse();
			}

			return uidPath;
		},

		dragStart: function(dndEvent) {
			this.inherited(arguments);
			if (!this.isRegistered()) {
				return;
			}

			this.dndData.dragNodes = {};
			var index = 0;
			var self = this;
			this._treeNodesToDrag.map(
				function(treeNode) {
					self.dndData.dragNodes[index] = treeNode;
					self.toggleCssClass(treeNode, 'dragSourceNode', true);
					index++;
					return treeNode;
				}
			);

			this.dndData.dragData = {
				controller: this.dndData.controller.id,
				dataType: 'TreeItem',
				itemIds: this._selectedItemIdsToDrag
			};

			// required in FF to start dragging
			dndEvent.dataTransfer.setData('text', '');
		},

		dragEndSource: function(dndEvent) {
			var dragNodes = this.dndData.dragNodes;

			if (dragNodes) {
				var domNode, itemId;

				for (itemId in dragNodes) {
					domNode = dragNodes[itemId];

					this.toggleCssClass(domNode, 'dragSourceNode');
				}
			}

			this.inherited(arguments);
		}
	});

	return PPTree;
});
