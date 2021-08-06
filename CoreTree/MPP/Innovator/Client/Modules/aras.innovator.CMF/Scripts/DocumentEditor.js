/* global define,dojo, CMF */
define([
	'dojo/_base/declare',
	'./Grid/Grid',
	'./Tree/Tree',
	'dojo/window',
	'./Menu/Menu',
	'./Menu/MenuItem',
	'dojo/on',
	'dojo/parser',
	'./Synchronizer',
	'./StoreFormatTransformer',
	'dijit/popup',
	'dojo/aspect',
	'dijit/registry',
	'./SpreadsheetConverter',
	'./StructureMappingHelper',
	'./PublicApi/Element',
	'./Menu/MenuHelper',
	'./Controller',
	'dojo/domReady!'
], function (
	declare,
	Grid,
	Tree,
	win,
	Menu,
	MenuItem,
	on,
	parser,
	Synchronizer,
	StoreFormatTransformer,
	popup,
	aspect,
	registry,
	SpreadsheetTransformer,
	StructureMappingHelper,
	Element,
	MenuHelper,
	Controller
) {
	var aras = parent.aras;

	var sortTreeItems = function (rootItem, dataStore) {
		var docElements = dataStore.getDocElements();

		var itemComparer = function (a, b) {
			var aSortOrder = docElements[a].documentElementType.sortOrder;
			var bSortOrder = docElements[b].documentElementType.sortOrder;
			var aAdditional = docElements[a].documentElementType.isAdditional;
			var bAdditional = docElements[b].documentElementType.isAdditional;
			if (aSortOrder > bSortOrder) {
				return 1;
			}
			if (aSortOrder < bSortOrder) {
				return -1;
			}
			if (aAdditional && !bAdditional) {
				return 1;
			}
			if (!aAdditional && bAdditional) {
				return -1;
			}
			return 0;
		};

		var queue = [];
		queue.push(rootItem);
		while (queue.length > 0) {
			var item = queue.pop();
			var childrenItems = item._childrenIds;
			childrenItems.sort(itemComparer);
			for (var i = 0; i < childrenItems.length; i++) {
				queue.push(docElements[childrenItems[i]]);
			}
		}
	};

	return declare('DocumentEditor', [], {
		_docTypeId: null,
		_itemId: null,
		_spreadSheetViewId: null,
		_actionStore: null,
		_tree: null,
		_grid: null,
		_dataStore: null,
		_findControl: null,
		menuHelper: null,
		synchronizer: null,
		stuctureMapping: null,
		controller: null,
		isHidden: false,
		_isGridBroken: false,

		constructor: function (findControl) {
			parser.parse();
			this._findControl = findControl;
			this.menuHelper = new MenuHelper();
		},

		load: function (globalData, spreadSheetViewId, actionStore, dataStore) {
			var docTypeId = globalData.docTypeId;
			var itemId = globalData.itemId;
			this._docTypeId = docTypeId;
			this._itemId = itemId;
			this._spreadSheetViewId = spreadSheetViewId;
			this._actionStore = actionStore;
			var spreadsheetTransformer = new SpreadsheetTransformer();
			var serverData = spreadsheetTransformer.transformToSpreadsheet(
				globalData,
				spreadSheetViewId
			);
			sortTreeItems(globalData.rootItem, dataStore);
			var spreadsheetView = globalData.viewsData.filter(function (element) {
				return element.id === spreadSheetViewId;
			})[0];
			dataStore.loadData(
				serverData,
				spreadsheetView,
				globalData.propertyTypeList
			);
			this._dataStore = dataStore;
			this.stuctureMapping = new StructureMappingHelper(dataStore);
			this.stuctureMapping.run(globalData.docElementTypes);
			var self = this;

			var treeMenu = new Menu();
			var tree;
			var grid;
			var controller;

			function copyToBuffer(treeItemsToCopy) {
				var tableItems;
				var copy = aras.newArray();

				var fillTableItemsValues = function (treeItem, copyTreeItem) {
					var n;

					tableItems = dataStore.getPropertyElements(treeItem);
					copyTreeItem.tableItemsValues = aras.newObject();
					for (n = 0; n < tableItems.length; n++) {
						copyTreeItem.tableItemsValues[tableItems[n].propertyId] =
							tableItems[n].value;
					}
				};

				var createTreeItemForCopy = function (treeItem) {
					//we should create object using aras.newObject() and all objects/arrays using aras in cmfCopyBuffer,
					//otherwise after copy from one window/CMF Document, close the window. And after Paste to another window we will get an error.
					var copyTreeItem = aras.newObject();
					var childTreeItem;
					var m;

					copyTreeItem.documentElementTypeId = treeItem.documentElementTypeId;
					copyTreeItem.boundItemId = treeItem.boundItemId;
					copyTreeItem.boundItemConfigId = treeItem.boundItemConfigId;
					copyTreeItem.boundItem = treeItem.boundItem;
					copyTreeItem.trackingMode = treeItem.trackingMode;
					copyTreeItem.resolutionMode = treeItem.resolutionMode;

					fillTableItemsValues(treeItem, copyTreeItem);

					copyTreeItem.children = aras.newArray();
					for (m = 0; m < treeItem.childrenIds.length; m++) {
						childTreeItem = dataStore.getDocElement(treeItem.childrenIds[m]);
						copyTreeItem.children.push(createTreeItemForCopy(childTreeItem));
					}

					return copyTreeItem;
				};

				for (var i = 0; i < treeItemsToCopy.length; i++) {
					var treeItemToCopy = treeItemsToCopy[i];

					var copyItem = createTreeItemForCopy(treeItemToCopy);
					copyItem.isMain = true;

					copy.push(copyItem);
				}

				aras.setCommonPropertyValue('cmfCopyBuffer', copy);
			}

			function addMenuItem(subMenu, label, iconPath, onClick, onClickParams) {
				var menuItem = new MenuItem({
					label: label,
					iconPath: iconPath,
					onClickParams: onClickParams
				});
				menuItem.onClick = onClick;
				subMenu.add(menuItem);
			}

			function createOnChangeObject(
				parentNodeId,
				docElemTypeId,
				rootItemId,
				beforeInsertItem,
				boundItemId,
				isValidateExistence,
				copy,
				isToSelectForEdit
			) {
				return {
					parentNodeId: parentNodeId,
					docElemTypeId: docElemTypeId,
					rootItemId: rootItemId,
					beforeInsertItem: beforeInsertItem,
					boundItemId: boundItemId,
					isValidateExistence: isValidateExistence,
					copy: copy,
					isToSelectForEdit: isToSelectForEdit
				};
			}

			function getSubMenu(
				parentNodeId,
				docElemType,
				rootItemId,
				beforeInsertItem
			) {
				var subMenu = new Menu();
				var thirdLevelMenu = new Menu();
				var copyBuffer;

				if (!docElemType.binding || !docElemType.binding.referenceRequired) {
					addMenuItem(
						subMenu,
						CMF.Utils.getResource('menu_new'),
						docElemType.iconPath,
						function () {
							var changeObject = createOnChangeObject(
								parentNodeId,
								docElemType.id,
								rootItemId,
								beforeInsertItem,
								null,
								null,
								null,
								true
							);
							self.controller.onChange('add', changeObject);
						}
					);
				}

				if (docElemType.binding) {
					if (
						docElemType.binding.newRowMode === 'PickOrCreate' ||
						docElemType.binding.newRowMode === 'PickOnly'
					) {
						addMenuItem(
							thirdLevelMenu,
							CMF.Utils.getResource('menu_select'),
							null,
							function () {
								self.controller.pickBindItem(docElemType, function (
									boundItemId
								) {
									if (docElemType.binding.onAfterPick) {
										var onAfterPickArgs = {
											boundItemId: boundItemId,
											parentElement: new Element(
												dataStore.getDocElement(parentNodeId),
												dataStore
											),
											beforeInsertItem: beforeInsertItem
												? new Element(beforeInsertItem, dataStore)
												: null
										};
										aras.evalMethod(
											docElemType.binding.onAfterPick,
											'',
											onAfterPickArgs
										);
									}
									var changeObject = createOnChangeObject(
										parentNodeId,
										docElemType.id,
										rootItemId,
										beforeInsertItem,
										boundItemId
									);
									self.controller.onChange('add', changeObject);
								});
							}
						);
					}

					if (
						docElemType.binding.newRowMode === 'PickOrCreate' ||
						docElemType.binding.newRowMode === 'CreateOnly'
					) {
						addMenuItem(
							thirdLevelMenu,
							CMF.Utils.getResource('menu_create'),
							null,
							function () {
								var referencedTypeId = docElemType.binding.elemReferenceType;

								if (!docElemType.binding.onCreateReference) {
									// check CAN_ADD permissions of referenced itemtype
									if (!hasPermissions('can_add', { id: referencedTypeId })) {
										aras.AlertError(
											aras.getResource(
												'../Modules/aras.innovator.CMF',
												'no_permissions_to_create'
											)
										);
										return;
									}
								}

								// prepare parameters
								var referencedTypeName = aras.getItemTypeName(referencedTypeId);
								var createArgs = {
									cmfElementId: docElemType.id,
									cmfElementName: docElemType.name,
									referenceTypeId: referencedTypeId,
									referencedTypeName: referencedTypeName,
									parentNodeId: parentNodeId,
									documentItem: parent.item,
									parentElement: new Element(
										dataStore.getDocElement(parentNodeId),
										dataStore
									)
								};

								// call on_create_reference method
								var editFinishedResult = aras.evalMethod(
									docElemType.binding.onCreateReference ||
										'cmf_CreateReferenceDefault',
									'',
									createArgs
								);
								editFinishedResult.then(function (createdItemId) {
									// update tree view
									if (createdItemId) {
										var createdItem = aras.getItemById(
											referencedTypeName,
											createdItemId
										);
										if (createdItem) {
											var changeObject = createOnChangeObject(
												parentNodeId,
												docElemType.id,
												rootItemId,
												beforeInsertItem,
												createdItemId,
												true
											);
											self.controller.onChange('add', changeObject);
										}
									}
								});
							}
						);
					}

					subMenu.addSubMenu(
						thirdLevelMenu,
						CMF.Utils.getResource('menu_from_reference')
					);
					subMenu._menu.hasSubMenu = true;
				}

				copyBuffer = aras.getCommonPropertyValue('cmfCopyBuffer');

				function visit(targetCollection, visitor, childrenAccessor) {
					var stack = [];
					function populateStack(collection) {
						if (!collection) {
							return;
						}
						for (var i = 0; i < collection.length; i++) {
							stack.push(collection[i]);
						}
					}
					populateStack(targetCollection);
					while (stack.length) {
						var item = stack.pop();
						visitor(item);
						if (childrenAccessor) {
							populateStack(childrenAccessor(item));
						}
					}
				}

				function isCopyItemContainRequiredBinding(copyBuffer, checkChildren) {
					var copyItemHasRequiredBinding = false;
					visit(
						copyBuffer,
						function (treeItem) {
							var docElementTypeId = treeItem.documentElementTypeId;
							if (!docElementTypeId) {
								return;
							}
							var docElementType = dataStore.getDocElementTypeById(
								docElementTypeId
							);
							if (
								docElementType &&
								docElementType.binding &&
								docElementType.binding.referenceRequired
							) {
								copyItemHasRequiredBinding = true;
							}
						},
						checkChildren
							? function (item) {
									return item.children;
							  }
							: null
					);
					return copyItemHasRequiredBinding;
				}

				if (
					copyBuffer &&
					copyBuffer[0].documentElementTypeId === docElemType.id
				) {
					var pasteMainElementAndSelect = function (
						pasteParentNodeId,
						pasteDocElemTypeId,
						pasteRootItemId,
						pasteBeforeInsertItem,
						copyTreeItem,
						options
					) {
						var args;

						pasteWithChildren(
							pasteParentNodeId,
							pasteDocElemTypeId,
							pasteRootItemId,
							pasteBeforeInsertItem,
							copyTreeItem,
							options
						);

						self.controller.onChange('update copy elements', {});

						args = copyTreeItem.argsToSelect;
						tree.selectNodeByRootItem(
							args.nodeId,
							args.rootItem,
							args.currentNode,
							args.isToSelectForEdit
						);
					};

					var pasteWithChildren = function (
						pasteParentNodeId,
						pasteDocElemTypeId,
						pasteRootItemId,
						pasteBeforeInsertItem,
						copyTreeItem,
						options
					) {
						var i;
						var addedNode;
						var childCopyTreeItem;

						copyTreeItem.isWithBindings = options.isWithBindings;
						copyTreeItem.isWithValues = options.isWithValues;
						copyTreeItem.isToUpdateGridLater = options.isWithChilds;

						var changeObject = createOnChangeObject(
							pasteParentNodeId,
							pasteDocElemTypeId,
							pasteRootItemId,
							pasteBeforeInsertItem,
							null,
							null,
							copyTreeItem
						);
						addedNode = self.controller.onChange('add', changeObject);

						if (options.isWithChilds) {
							//since we add children always as a first child among all the childs (addNode works such way), we need to add childs in desc order.
							for (i = copyTreeItem.children.length - 1; i >= 0; i--) {
								childCopyTreeItem = copyTreeItem.children[i];
								pasteWithChildren(
									addedNode.id,
									childCopyTreeItem.documentElementTypeId,
									addedNode.rootItemId,
									addedNode,
									childCopyTreeItem,
									options
								);
							}
						}
					};

					//Paste
					addMenuItem(
						subMenu,
						CMF.Utils.getResource('menu_from_copy'),
						docElemType.iconPath,
						function () {
							var options;
							options = {
								isWithChilds: false,
								isWithBindings: isCopyItemContainRequiredBinding(
									copyBuffer,
									false
								),
								isWithValues: true
							};

							for (var i = copyBuffer.length - 1; i >= 0; i--) {
								pasteMainElementAndSelect(
									parentNodeId,
									docElemType.id,
									rootItemId,
									beforeInsertItem,
									copyBuffer[i],
									options
								);
							}
						}
					);

					//Paste Special
					addMenuItem(
						subMenu,
						CMF.Utils.getResource('menu_from_copy_special'),
						docElemType.iconPath,
						function () {
							var param;
							var dialogOptions;
							var pasteOptions = {};

							param = {
								title: CMF.Utils.getResource('copy_title'),
								/*callback: function () {
								if (param.isOkClicked) {
									pasteOptions.isWithChilds = param.isWithChilds;
									pasteOptions.isWithBindings = param.isWithBindings;
									pasteOptions.isWithValues = param.isWithValues;
									for (var i = copyBuffer.length - 1; i >= 0; i--) {
										pasteMainElementAndSelect(parentNodeId, docElemType.id, rootItemId, beforeInsertItem, copyBuffer[i], pasteOptions);
									}
								}
							},*/
								isBindingRequired: function (isChildrenIncluded) {
									return isCopyItemContainRequiredBinding(
										copyBuffer,
										isChildrenIncluded
									);
								}
							};
							param.dialogWidth = 210;
							param.dialogHeight = 175;
							param.resizable = true;
							param.content =
								'..//Modules//aras.innovator.CMF//Views//CopyPasteOptions.html';

							var addItemDialog = window.parent.ArasModules.Dialog.show(
								'iframe',
								param
							);
							addItemDialog.promise.then(function () {
								if (param.isOkClicked) {
									pasteOptions.isWithChilds = param.isWithChilds;
									pasteOptions.isWithBindings = param.isWithBindings;
									pasteOptions.isWithValues = param.isWithValues;
									for (var i = copyBuffer.length - 1; i >= 0; i--) {
										pasteMainElementAndSelect(
											parentNodeId,
											docElemType.id,
											rootItemId,
											beforeInsertItem,
											copyBuffer[i],
											pasteOptions
										);
									}
								}
							});
						}
					);
				}

				return subMenu;
			}

			function ignoreConflict(treeItem) {
				treeItem.trackingMode = 'NonTracking';
				controller.refreshTreeItemAfterBindingChanges(treeItem);
			}

			function isAncestorIsSelected(treeItem, selectedTreeItems) {
				var parentId = treeItem.parentId;
				var parentTreeItemsFromSelected;
				var parentTreeItemFromAll;

				if (treeItem.isRootOfTree) {
					return false;
				}

				parentTreeItemsFromSelected = selectedTreeItems.filter(function (item) {
					return item.id === parentId;
				});

				if (parentTreeItemsFromSelected.length === 1) {
					return true;
				} else {
					//parent is not selected, check if any of ancestors is selected.
					//getDocElement returns type of treeItem, docElement is a synomim here.
					parentTreeItemFromAll = dataStore.getDocElement(parentId);
				}

				return isAncestorIsSelected(parentTreeItemFromAll, selectedTreeItems);
			}

			dojo.connect(treeMenu, 'onOpenMenu', this, function (target) {
				var menuItem;
				var subMenu;
				var parentColumnId;
				var selectedTreeItem;
				var selectedTreeItems;
				var docElemType;

				treeMenu.removeAll();
				parentColumnId =
					target.columnId && grid.getColumns()[target.columnId].parentColumn.id;
				if (grid._collapseStyleSheets[parentColumnId]) {
					return;
				}

				selectedTreeItems = tree.getSelectedNodes();
				var isRootSelected = false;
				if (selectedTreeItems) {
					selectedTreeItems.map(function (item) {
						if (item.id === 'root') {
							isRootSelected = true;
						}
					});
				}
				var haveAnyCandidate = false;
				selectedTreeItems.map(function (item) {
					if (item.isCandidate) {
						haveAnyCandidate = true;
					}
				});

				if (parent.isEditMode) {
					if (target.isEmpty) {
						// this if can be removed after we will add colspans for empty cells.
						if (!target.parentNodeId) {
							return;
						}

						var parentDocElement = self._dataStore.getDocElement(
							target.parentNodeId
						);
						if (parentDocElement && parentDocElement.isCandidate) {
							return;
						}

						docElemType = self._dataStore.getDocElementTypeByPropertyId(
							target.propertyId
						);
						subMenu = getSubMenu(
							target.parentNodeId,
							docElemType,
							grid.getRowId(target)
						);
						this.menuHelper.addAddMenu(docElemType, subMenu, treeMenu);
						treeMenu.focus();
						return;
					}

					selectedTreeItem = target.nodeId
						? dataStore.getDocElement(target.nodeId)
						: tree.getSelectedNode();

					if (selectedTreeItem) {
						if (selectedTreeItems.length === 1) {
							if (selectedTreeItem.isCandidate) {
								docElemType = self._dataStore.getDocElementTypeById(
									selectedTreeItem.documentElementTypeId
								);
								subMenu = getSubMenu(
									selectedTreeItem.parentId,
									docElemType,
									selectedTreeItem.rootItemId,
									selectedTreeItem
								);
								//Modify by BCS Tengz 2021/6/21 MPP与PQD联动 不允许插入Operation
								if(!parent.isPQD || !parent.isUsedMPP || docElemType.name!="PQD Operation"){
									this.menuHelper.addAddMenu(docElemType, subMenu, treeMenu);
								}
								//End Modify
								this.menuHelper.createCandidateMenu(
									treeMenu,
									self.stuctureMapping,
									globalData.docElementTypes,
									selectedTreeItem,
									controller
								);
								return;
							}

							var menus = getMenus(
								selectedTreeItem,
								selectedTreeItem.id === 'root'
							);
							menus.forEach(function (menu) {
								if (menu.menu.hasSubMenu()) {
									treeMenu.addSubMenu(menu.menu, menu.label, menu.iconPath);
								} else {
									treeMenu.addFirstItemOfMenu(
										menu.menu,
										menu.label,
										menu.iconPath
									);
								}
							});

							if (selectedTreeItem.id === 'root') {
								this.menuHelper.addAllAcceptMenu(
									dataStore,
									treeMenu,
									controller
								);
								return;
							}

							//Reference
							if (selectedTreeItem.documentElementType.binding) {
								var subMenuReference = new Menu();
								treeMenu.addSubMenu(
									subMenuReference,
									CMF.Utils.getResource('menu_reference')
								);

								const bindingMenu = new CMF.ReferenceMenu(MenuItem);
								bindingMenu.generateMenu(
									selectedTreeItem,
									subMenuReference,
									controller
								);
							}
						}

						if (!isRootSelected) {
							//Copy
							if (
								!haveAnyCandidate &&
								(selectedTreeItems.length === 1 ||
									isNodeTypesEqual(selectedTreeItems))
							) {
								treeMenu.add(createCopyMenuItem(selectedTreeItems));
							}

							//Remove
							var haveAnyNotCandidate = false;
							selectedTreeItems.map(function (item) {
								if (!item.isCandidate) {
									haveAnyNotCandidate = true;
								}
							});
							if (haveAnyNotCandidate) {
								menuItem = new MenuItem({
									label: CMF.Utils.getResource('menu_remove')
								});
								menuItem.onClick = function () {
									for (var j = 0; j < selectedTreeItems.length; j++) {
										//Before removing ensure ancestor is NOT selected.
										//Otherwise DGrid can throw an error in some situations.
										if (
											!isAncestorIsSelected(
												selectedTreeItems[j],
												selectedTreeItems
											)
										) {
											self.controller.onChange('remove', {
												nodeId: selectedTreeItems[j].id,
												parentNodeId: selectedTreeItems[j].parentId
											});
										}
									}
								};
								treeMenu.add(menuItem);
							}

							if (selectedTreeItems.length) {
								const permissionMenu = new CMF.PermissionMenu(Menu, MenuItem);
								permissionMenu.generateMenu(
									target,
									grid,
									treeMenu,
									selectedTreeItem,
									controller
								);
							}
						}

						treeMenu.focus();
					}
				} else {
					if (target.isEmpty) {
						return;
					}
					selectedTreeItem = tree.getSelectedNode();
					if (selectedTreeItem && !isRootSelected) {
						//View Reference
						if (
							selectedTreeItem.boundItemId &&
							!selectedTreeItem.boundItem.isRemovedOrNoPermissions &&
							selectedTreeItems.length === 1
						) {
							menuItem = new MenuItem({
								label: CMF.Utils.getResource('menu_view_reference')
							});
							menuItem.onClick = function () {
								self.controller.viewReference(selectedTreeItem);
							};
							treeMenu.add(menuItem);

							treeMenu.focus();
						}

						//Copy
						if (
							!haveAnyCandidate &&
							!selectedTreeItem.isCandidate &&
							(selectedTreeItems.length === 1 ||
								isNodeTypesEqual(selectedTreeItems))
						) {
							treeMenu.add(createCopyMenuItem(selectedTreeItems));
						}
					}
				}
			});

			function createCopyMenuItem(selectedTreeItems) {
				var menuItem = new MenuItem({
					label: CMF.Utils.getResource('menu_copy')
				});
				menuItem.onClick = function () {
					selectedTreeItems.sort(compareSelectedTreeItems);
					copyToBuffer(selectedTreeItems);
				};
				return menuItem;
			}

			function compareSelectedTreeItems(selectedTreeItemA, selectedTreeItemB) {
				if (selectedTreeItemA.parentId === selectedTreeItemB.parentId) {
					return compareSelectedTreeItemsWithSameParent(
						selectedTreeItemA,
						selectedTreeItemB
					);
				} else {
					return compareSelectedTreeItems(
						getTreeItem(selectedTreeItemA.parentId),
						getTreeItem(selectedTreeItemB.parentId)
					);
				}
			}

			function getTreeItem(itemId) {
				return tree._tree.getNodesByItem(itemId)[0].item;
			}

			function compareSelectedTreeItemsWithSameParent(
				selectedTreeItemA,
				selectedTreeItemB
			) {
				if (selectedTreeItemA.sortOrder < selectedTreeItemB.sortOrder) {
					return -1;
				}
				if (selectedTreeItemA.sortOrder > selectedTreeItemB.sortOrder) {
					return 1;
				}
				return 0;
			}

			function isNodeTypesEqual(selectedTreeItems) {
				if (selectedTreeItems.length) {
					var isSameNodeTypes = true;
					var i = 1;
					var prevNodeTypeId = selectedTreeItems[0].documentElementTypeId;
					while (isSameNodeTypes && i < selectedTreeItems.length) {
						var node = selectedTreeItems[i];
						isSameNodeTypes = node.documentElementTypeId === prevNodeTypeId;
						i++;
					}
					return isSameNodeTypes;
				} else {
					return true;
				}
			}

			function hasPermissions(permission, property) {
				return aras.getPermissions(
					permission,
					property.id,
					property.propertyTypeId
				);
			}

			function getMenus(treeItem, isRoot) {
				var documElemType;
				var subMenu;
				var result = [];
				var docElementTypes;
				var label;

				if (!isRoot) {
					documElemType = tree.getDocElemTypes()[
						treeItem.documentElementType.id
					];

					if (!documElemType || !documElemType.visible) {
						return result;
					}

					//Modify by BCS Tengz 2021/6/21 MPP与PQD联动 不允许插入Operation
					if(!parent.isPQD || !parent.isUsedMPP || documElemType.name!="PQD Operation"){
						label =
							CMF.Utils.getResource('menu_add') +
							(documElemType.elementTypeLabel || documElemType.name);

						subMenu = getSubMenu(
							treeItem.parentId,
							documElemType,
							treeItem.rootItemId,
							treeItem
						);
						result.push({
							menu: subMenu,
							label: label,
							iconPath: documElemType.iconPath
						});
					}
					//End Modify
					
					docElementTypes = documElemType.getVisibleChildren();
				} else {
					docElementTypes = treeItem.docElementTypes.filter(function (element) {
						//Modify by BCS Tengz 2021/6/21 MPP与PQD联动 不允许插入Operation
						if(parent.isPQD && parent.isUsedMPP && element.name == "PQD Operation"){
							return false;
						}
						//End Modify
						return element.visible;
					});
				}

				for (var i = 0; i < docElementTypes.length; i++) {
					subMenu = getSubMenu(
						isRoot ? 'root' : treeItem.id,
						docElementTypes[i],
						isRoot ? 'root' : treeItem.rootItemId,
						treeItem
					);
					label =
						CMF.Utils.getResource('menu_insert') +
						(docElementTypes[i].elementTypeLabel || docElementTypes[i].name);
					result.push({
						menu: subMenu,
						label: label,
						iconPath: docElementTypes[i].iconPath
					});
				}

				return result;
			}

			tree = new Tree(
				'divTree',
				{
					items: serverData.rootItem,
					docElemTypes: serverData.docElementTypes,
					store: dataStore
				},
				treeMenu
			);
			this._tree = tree;

			var gridHeaderMenu = new Menu();

			var existingGridDiv = document.getElementById('grid');
			var parentElement = existingGridDiv.parentElement;
			parentElement.removeChild(existingGridDiv);

			var gridDiv = document.createElement('div');
			gridDiv.id = 'grid';
			parentElement.appendChild(gridDiv);

			var gridData = this.getGridDataFromTree(
				serverData.currentColumnGroupCollection
			);
			grid = new Grid(
				'grid',
				treeMenu,
				gridHeaderMenu,
				{
					data: gridData,
					columnGroupCollection: serverData.currentColumnGroupCollection,
					viewId: spreadSheetViewId
				},
				dataStore,
				spreadsheetView.defaultHealderStyle,
				spreadsheetView.defaultColumnGroupsStyle,
				spreadsheetView.gridBorderColor
			);
			this._grid = grid;

			grid.onCellUpdated = function (
				rowId,
				nodeId,
				cellId,
				value,
				ignoreReadOnly
			) {
				self.controller.onChange('update', {
					rowId: rowId,
					nodeId: nodeId,
					cellId: cellId,
					value: value,
					ignoreReadOnly: ignoreReadOnly
				});
			};

			this._findControl.setGrid(grid);
			if (this._findControl.isHidden()) {
				this._findControl.toggle();
			}

			this.synchronizer = new Synchronizer(grid, tree, dataStore);
			controller = new Controller(
				dataStore,
				actionStore,
				tree,
				grid,
				itemId,
				this._findControl
			);
			this.controller = controller;

			(function () {
				//select the first Document Element.
				var rootOfTree = dataStore.getDocElement('root');
				var visibleChildren = dataStore.getDocElementChildren(rootOfTree, true);
				if (visibleChildren.length > 0) {
					var treeItem = visibleChildren[0];
					if (treeItem) {
						var visibleItems = dataStore.getPropertyElements(treeItem, true);
						if (visibleItems.length > 0) {
							tree.selectNode(
								treeItem.rootItemId,
								treeItem.rootItemId,
								visibleItems[0].id
							);
						}
					}

					//if we have many "first level" rows (if they are, e.g., without subrows).
					//So, we will see after startup only (minRowsPerPage + bufferRows (perhaps multiply 2)) - about 12 rows.
					//So, we just need to scroll. Then all will be fine, because in dojo minRowsPerPage Page here is abstact definition, not the Screen.
					//Especially the fix is actual for FireFox. E.g., this._grid.scrollTo({ y: 0 }) after this._grid.scrollTo({ y: 1 }) doesn't help.
					//we have logic to select First Cell on startup, we need to call the code after this logic because of FireFox.
					grid._grid.scrollTo({ y: 1 });
				}
			})();

			dojo.connect(gridHeaderMenu, 'onOpenMenu', this, function (target) {
				gridHeaderMenu.removeAll();

				var isBottomHeader = !!grid._grid.columns[target.columnId];
				if (isBottomHeader) {
					return;
				}

				var menuItemHeader = new MenuItem({
					label: grid.isCollapsed(target.columnId)
						? CMF.Utils.getResource('menu_expand')
						: CMF.Utils.getResource('menu_collapse'),
					onClick: function () {
						if (grid.isCollapsed(target.columnId)) {
							grid.expandColumnGroup(target.columnId);
						} else {
							grid.collapseColumnGroup(target.columnId);
						}
					}
				});
				gridHeaderMenu.add(menuItemHeader);
			});
		},

		getGridDataFromTree: function (columnGroupCollection) {
			var rootOfTree = this._dataStore.getDocElement('root');
			var treeRootNodes = this._dataStore.getDocElementChildren(
				rootOfTree,
				true
			);
			var result = [treeRootNodes.length];
			var transformer = new StoreFormatTransformer();

			if (treeRootNodes.length === 0) {
				result = [];
			}
			for (var i = 0; i < treeRootNodes.length; i++) {
				result[i] = transformer.transformToGridRow(
					treeRootNodes[i],
					columnGroupCollection,
					this._tree.getDocElemTypes(),
					this._dataStore
				);
			}
			return result;
		},

		reload: function (globalData, itemObj) {
			this._actionStore.updateItemObj(itemObj);
			var spreadsheetTransformer = new SpreadsheetTransformer();
			var serverData = spreadsheetTransformer.transformToSpreadsheet(
				globalData,
				this._spreadSheetViewId
			);
			sortTreeItems(globalData.rootItem, this._dataStore);
			this.stuctureMapping.run(globalData.docElementTypes);
			//update findControl
			this._findControl.reload();

			// update tree
			var selectedNode = this._tree.getSelectedNode();
			this._tree.reload({
				items: serverData.rootItem,
				docElemTypes: serverData.docElementTypes,
				store: this._dataStore
			});

			// update grid
			var gridData = this.getGridDataFromTree(
				serverData.currentColumnGroupCollection
			);
			this._grid.reload(
				{
					data: gridData,
					columnGroupCollection: serverData.currentColumnGroupCollection,
					viewId: this._spreadSheetViewId
				},
				this._dataStore
			);
			if (selectedNode && this._tree.isNodeExist(selectedNode.id)) {
				this._tree.selectNode(
					selectedNode.rootItemId,
					selectedNode.id,
					this._grid.selectedCellId,
					selectedNode.parentId
				);
			}

			this._actionStore.clearActions();

			if (this.isHidden) {
				this._isGridBroken = true;
			}
		},

		restoreGrid: function () {
			if (this._grid && this._isGridBroken) {
				this._grid._grid.refresh();
				var selectedNode = this._tree.getSelectedNode();
				if (selectedNode && this._tree.isNodeExist(selectedNode.id)) {
					this._tree.selectNode(
						selectedNode.rootItemId,
						selectedNode.id,
						this._grid.selectedCellId,
						selectedNode.parentId
					);
				}
				this._isGridBroken = false;
			}
		},

		destroySpreadsheet: function () {
			this._tree.destroy();
		},

		undo: function () {
			if (this._actionStore) {
				this._actionStore.undo(this._tree, this.controller);
			}
		},

		redu: function () {
			if (this._actionStore) {
				this._actionStore.redu(this._tree, this.controller);
			}
		},

		toggleFindControl: function () {
			this._findControl.toggle();
		},

		exportToExcel: function () {
			try {
				aras.IomInnovator.ConsumeLicense('Aras.CMFExportToExcel');
			} catch (ex) {
				if (
					ex.message.indexOf('FeatureHasNoLicensesException') > -1 ||
					ex.message.indexOf('FeatureLicenseValidationException') > -1
				) {
					var advertisingUrl = aras.getResource(
						'../Modules/aras.innovator.CMF/',
						'cmf_export_to_excel.advertising_url'
					);
					aras.AlertWarning(
						aras.getResource(
							'../Modules/aras.innovator.CMF/',
							'cmf_export_to_excel.advertising_message',
							advertisingUrl
						)
					);
					return;
				} else {
					aras.AlertError(ex.message);
					return;
				}
			}

			var request = aras.newIOMItem('ConversionRule');
			request.setProperty('documentTypeId', this._docTypeId);
			request.setProperty('documentId', this._itemId);
			var result = request.apply('cmf_CreateExcelPublishingTask');
			var taskId = result.getResult();
			if (!taskId) {
				return;
			}
			var mainWindow = aras.getMainWindow();
			var targetWindow = window === mainWindow ? mainWindow.main : window;
			var dialogParameters = {
				aras: aras,
				itemType: 'ConversionTask',
				itemId: taskId,
				propertyName: 'status',
				propertyState: ['Succeeded', 'Failed', 'Discarded'],
				title: CMF.Utils.getResource('conversion_task_title'),
				content: 'waitPropertyStatusDialog.html',
				dialogWidth: 300,
				dialogHeight: 160,
				resizable: false
			};

			var propertyStatusDialog = window.parent.ArasModules.Dialog.show(
				'iframe',
				dialogParameters
			);
			propertyStatusDialog.promise.then(function (taskState) {
				if (taskState && taskState === 'Succeeded') {
					setTimeout(function () {
						processConversionResult(taskId);
					}, 0);
				}
				if (taskState && taskState === 'Failed') {
					aras.AlertError(CMF.Utils.getResource('export_to_excel_failed'));
				}
			});

			var processConversionResult = function (taskId) {
				var item = aras.newIOMItem();
				item.loadAML(
					'<AML><Item type="ConversionTaskResult" action="get" select="file_id"><source_id>' +
						taskId +
						'</source_id></Item></AML>'
				);
				var conversionResult = item.apply();
				if (conversionResult.isError()) {
					aras.AlertError(conversionResult);
					return;
				}
				var fileId = conversionResult.getProperty('file_id');
				var fileItem = aras.newIOMItem();
				fileItem.loadAML(
					'<AML><Item type="File" action="get" id="' +
						fileId +
						'"></Item></AML>'
				);
				fileItem = fileItem.apply();

				if (fileItem.isError()) {
					aras.AlertError(fileItem);
					return;
				}

				aras.uiShowItemEx(fileItem.node, undefined);
			};
		},

		exportToXps: function () {
			try {
				aras.IomInnovator.ConsumeLicense('Aras.CMFPrintToXPS');
			} catch (ex) {
				if (
					ex.message.indexOf('FeatureHasNoLicensesException') > -1 ||
					ex.message.indexOf('FeatureLicenseValidationException') > -1
				) {
					var advertisingUrl = aras.getResource(
						'../Modules/aras.innovator.CMF/',
						'cmf_print_to_xps.advertising_url'
					);
					aras.AlertWarning(
						aras.getResource(
							'../Modules/aras.innovator.CMF/',
							'cmf_print_to_xps.advertising_message',
							advertisingUrl
						)
					);
					return;
				} else {
					aras.AlertError(ex.message);
					return;
				}
			}

			aras.evalMethod('cmf_ShowPrintToXpsDialog', window.parent.item);
		},

		recalculateComputedColumns: function () {
			if (!parent.isEditMode) {
				return;
			}

			var selectedNode = this._tree.getSelectedNode();
			this.controller.recalculateComputedColumnValues();
			if (selectedNode && this._tree.isNodeExist(selectedNode.id)) {
				this._tree.selectNode(
					selectedNode.rootItemId,
					selectedNode.id,
					this._grid.selectedCellId,
					selectedNode.parentId
				);
			}
		}
	});
});
