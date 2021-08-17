define([
	'dojo/_base/declare',
	'dojo/_base/connect',
	'dijit/popup',
	'MPP/Model/ModelActions/MoveItemAction',
	'MPP/Model/ModelActions/RemoveItemAction',
	'MPP/Model/ModelActions/AddItemAction',
	'MPP/Model/ModelActions/ViewEditItemAction',
	'MPP/Model/ModelActions/CreateProcessPlanAction',
	'MPP/Model/ModelEnums',
	'MPP/UI/Utils/UIUtils',
	'MPP/Model/PartConfig'
],
function(declare, connect, popup, MoveItemAction, RemoveElementAction, AddItemAction, ViewEditItemAction, CreateProcessPlanAction, Enums, UIUtils, partConfig) {
	return declare('Aras.Client.Controls.MPP.Model.ActionsHelper', null, {
		datamodel: null,
		actions: null,
		aras: null,
		UIUtils: null,

		constructor: function(inputArguments) {
			this.datamodel = inputArguments.datamodel;
			this.aras = inputArguments.aras;
			this.topWindow = this.aras.getMostTopWindowWithAras();
			this.UIUtils = new UIUtils({aras: this.aras});
			this.actions = {
				moveup: {
					title: this.UIUtils.getResource('action.moveUp'),
					handler: new MoveItemAction({actionsHelper: this, isUp: true}),
					priority: 20
				},
				movedown: {
					title: this.UIUtils.getResource('action.moveDown'),
					handler: new MoveItemAction({actionsHelper: this}),
					priority: 25
				},
				removeelement: {
					title: this.UIUtils.getResource('action.remove'),
					handler: new RemoveElementAction({actionsHelper: this}),
					priority: 30
				},
				changequantity: {
					title: this.UIUtils.getResource('action.changeQuality'),
					handler: new ViewEditItemAction({actionsHelper: this}),
					priority: 50
				},
				viewedititem: {
					title: this.UIUtils.getResource('action.editItem'),
					viewtitle: this.aras.getResource('../Modules/aras.innovator.TDF', 'action.viewitem'),
					handler: new ViewEditItemAction({actionsHelper: this}),
					priority: 110
				},
				additem: {
					addPrefix: this.UIUtils.getResource('action.add'),
					insertPrefix: this.UIUtils.getResource('action.insert'),
					handler: new AddItemAction({actionsHelper: this}),
					priority: 0
				},
				createprocessplan: {
					title: this.UIUtils.getResource('action.createProcessPlan'),
					handler: new CreateProcessPlanAction({actionsHelper: this}),
					priority: 0
				},
				viewproducedpart: {
					title: this.UIUtils.getResource('action.viewProducedPart'),
					handler: new ViewEditItemAction({actionsHelper: this}),
					priority: 120
				},
				//Add by tengz 2019/6/14
				//Process Plan Tree添加右键菜单
				bcsadd2otherlocation:{
					title:this.UIUtils.getResource('bcs.action.add2otherlocation'),
					priority:200
				}
				//Add By BCS Tengz 2021/6/30 MPP与PQD联动
				//Process Plan Tree添加右键菜单
				,viewpqd:{
					title:this.UIUtils.getResource('bcs.action.viewpqd'),
					priority:300
				}
			};
		},

		getAction: function(actionName) {
			var targetAction = this.actions[actionName];

			return targetAction && targetAction.handler;
		},

		executeAction: function(actionName, actionArguments) {
			var targetAction = this.getAction(actionName);

			if (targetAction) {
				return targetAction.Execute(actionArguments);
			}
		},

		isItemsCanBeMoved: function(selectedModelItems) {
			//check that all items have the same parent and type. Type should be Operation or Step.
			var selectedItemType,
				selectedParentId,
				i,
				selectedItem;

			for (i = 0; i < selectedModelItems.length; i++) {
				selectedItem = selectedModelItems[i];
				if (selectedItemType && selectedItemType !== selectedItem.getType()) {
					return;
				}
				selectedItemType = selectedItem.getType();

				if (selectedItemType !== Enums.ModelItemTypes.Operation && selectedItemType !== Enums.ModelItemTypes.Step) {
					return;
				}

				if (selectedParentId && selectedParentId !== selectedItem.Parent.Id()) {
					return;
				}
				selectedParentId = selectedItem.Parent.Id();
			}
			return true;
		},

		appendMoveMenuItems: function(menuModel, selectedModelItems) {
			var selectedItemsIds = selectedModelItems.map(
				function(item) {
					return item.Id();
				}
			);
			var selectedItem,
				children,
				selectedItemSortOrderStr,
				selectedItemSortOrderInt,
				childItem,
				i,
				j,
				childItemSortOrderInt,
				isToAppendMenuUp,
				isToAppendMenuDown;

			if (!this.isItemsCanBeMoved(selectedModelItems)) {
				return;
			}
			//we need to append menu items if at least one can be moved from selected items.
			for (i = 0; i < selectedModelItems.length; i++) {
				selectedItem = selectedModelItems[i];
				children = selectedItem.Parent.getChildrenByType(selectedItem.getType());
				selectedItemSortOrderStr = selectedItem.getProperty('sort_order');
				selectedItemSortOrderInt = parseInt(selectedItemSortOrderStr, 10);
				if (isToAppendMenuUp && isToAppendMenuDown) {
					break;
				}
				for (j = 0; j < children.length; j++) {
					if (isToAppendMenuUp && isToAppendMenuDown) {
						break;
					}
					childItem = children[j];
					//we need to check if we have childItem for up and down with sort_order less and more than childItemSortOrderInt.
					//Child Items should be not selected items.
					childItemSortOrderInt = parseInt(childItem.getProperty('sort_order'), 0);
					if (selectedItemsIds.indexOf(childItem.Id()) !== -1) {
						continue;
					}
					if (childItemSortOrderInt < selectedItemSortOrderInt) {
						isToAppendMenuUp = true;
					}
					if (childItemSortOrderInt > selectedItemSortOrderInt) {
						isToAppendMenuDown = true;
					}
				}
			}

			if (isToAppendMenuUp) {
				this.appendActionMenuItem(menuModel, 'moveup', selectedModelItems);
			}

			if (isToAppendMenuDown) {
				this.appendActionMenuItem(menuModel, 'movedown', selectedModelItems);
			}
		},

		getSpecificItemActionsMenuModel: function(selectedItems) {
			var menuModel = [];

			if (selectedItems && selectedItems.length) {
				var isEditable = this.datamodel.isEditable();
				var isSingleSelect = selectedItems.length === 1;
				var isItemsFromRoot = this.datamodel.isFromRootProcessPlan(selectedItems);
				var isRootSelected = this.datamodel.isRootProcessPlanContained(selectedItems);
				var isItemsDeleted = isItemsFromRoot && selectedItems.some(function(modelItem) {
					return modelItem.isDeleted() || modelItem.isParentDeleted();
				});

				if (isEditable && isItemsFromRoot && !isRootSelected && !isItemsDeleted) {
					this.appendActionMenuItem(menuModel, 'removeelement', selectedItems);
					this.appendMoveMenuItems(menuModel, selectedItems);
					//Add by tengz 2019/6/14
					//Process Plan Tree 添加右键菜单
					this.appendActionMenuItem(menuModel, 'bcsadd2otherlocation', selectedItems);
				}

				if (isSingleSelect) {
					var selectedItem = selectedItems[0];
					var modelItemTypes = Enums.ModelItemTypes;
					var itemType = selectedItem.getType();

					if (!selectedItem.isEmpty() && !isRootSelected) {
						var isEditAction = isItemsFromRoot && isEditable && this.isToShowAsTooltipDialog(selectedItem.getRelatedItem() || selectedItem);
						var relatedItem = selectedItem && selectedItem.getRelatedItem();

						if (!relatedItem || !relatedItem.isNew() || relatedItem.getType() !== modelItemTypes.Part ||
							(relatedItem.getProperty('classification') !== partConfig.phantom_class_path &&
								relatedItem.getProperty('classification') !== partConfig.mbom_only_class_path)) {
							this.appendActionMenuItem(menuModel, 'viewedititem', selectedItem, isEditAction);
						}
					}

					if (selectedItem.is('ProcessPlan')) {
						this.appendActionMenuItem(menuModel, 'viewproducedpart', selectedItem);
					}

					// specific type actions
					//Modify by tengz 2019/9/23
					//使Process Plan Tree中子Part中的MPP内的Part也可直接创建MPP
					//if (isItemsFromRoot && !isItemsDeleted) {
					if (!isItemsDeleted) {
						switch (itemType) {
							case modelItemTypes.ConsumedPart:
								//Modify by tengz 2019/9/23
								//if (isEditable) {
								if (isItemsFromRoot&&isEditable) {
									this.appendActionMenuItem(menuModel, 'changequantity', selectedItem);
								}

								if (!selectedItem.isEmpty() && !selectedItem.isProducedPart()) {
									this.appendActionMenuItem(menuModel, 'createprocessplan', selectedItem);
								}
								break;
							default:
								break;
						}
					}

					//Add By BCS Tengz 2021/6/30 MPP与PQD联动
					//增加查看PQD菜单
					if(isUsedPQD){
						this.appendActionMenuItem(menuModel, 'viewpqd', selectedItem);
					}
					//End Add
				}
			}

			if (menuModel.length) {
				menuModel = menuModel.sort(function(a, b) {
					return a.priority - b.priority;
				});
			}

			return menuModel;
		},

		isToShowAsTooltipDialog: function(targetItem) {
			switch (targetItem.getAttribute('type')) {
				case 'mpp_Operation':
				case 'mpp_Step':
				case 'mpp_OperationConsumedPart':
					return true;
				default:
					return false;
			}
		},

		showContextMenu: function(contextMenu, parentWidget, menuModel, rowId, additionalSettings) {
			if (contextMenu && parentWidget && menuModel) {
				contextMenu.removeAll();
				contextMenu.addRange(menuModel);
				contextMenu.rowId = rowId;
				additionalSettings = additionalSettings || {};

				connect.connect(contextMenu.menu, 'onBlur', function() {
					this.hideContextMenu(contextMenu);
				}.bind(this));

				connect.connect(contextMenu.menu, 'onKeyPress', function(keyEvent) {
					if (keyEvent.keyCode === 27) {
						this.hideContextMenu(contextMenu);
					}
				}.bind(this));

				popup.open({
					popup: contextMenu.menu,
					parent: parentWidget,
					x: isNaN(additionalSettings.x) ? 0 : additionalSettings.x,
					y: isNaN(additionalSettings.y) ? 0 : additionalSettings.y,
					onClose: additionalSettings.onClose,
					onExecute: additionalSettings.onExecute
				});

				contextMenu.menu.focus();
			}
		},

		hideContextMenu: function(targetMenu) {
			targetMenu.rowId = null;
			targetMenu.removeAll();
		},

		appendActionMenuItem: function(menuItems, actionName, selectedItems, isEditable, optionalArgs) {
			/// <summary>
			/// Appends menu item to 'menuItems' if all validations are passed.
			/// </summary>
			/// <param name="menuItems" type="Array">Container for menu items.</param>
			/// <param name="actionName" type="String">Name of action for add.</param>
			/// <param name="selectedItems" type="ModelItem|Array">Items, that currently selected in Model.</param>
			if (actionName) {
				var action = this.actions[actionName];
				action.actionOptionalArgs = optionalArgs;
				var actionTitle = action.title;
				var isActionAllowed = true;
				var isAppended = false;
				var subMenuItems, i, menuItem;

				switch (actionName) {
					case 'additem':
						var addMenuItems = this.getAppendMenu(selectedItems);
						var priority = isNaN(this.actions[actionName].priority) ? 1000 : this.actions[actionName].priority;

						for (i = 0; i < addMenuItems.length; i++) {
							menuItem = addMenuItems[i];
							menuItem.name = action.addPrefix + ' ' + menuItem.name;
							menuItem.priority = priority;

							menuItems.push(menuItem);
						}

						addMenuItems = this.getInsertMenu(selectedItems);

						for (i = 0; i < addMenuItems.length; i++) {
							menuItem = addMenuItems[i];
							menuItem.name = action.insertPrefix + ' ' + menuItem.name;
							menuItem.priority = priority;

							menuItems.push(menuItem);
						}

						isAppended = true;
						break;
					case 'viewedititem':
						isActionAllowed = !selectedItems.isBlocked();
						if (isActionAllowed) {
							actionTitle = action[isEditable ? 'title' : 'viewtitle'];
						}
						break;
					case 'changequantity':
					case 'createprocessplan':
						isActionAllowed = selectedItems.getAttribute('action') !== 'delete';
						break;
					//Add by tengz 2019/6/19
					//"添加至其它地区"菜单处理
					case 'bcsadd2otherlocation':
						//Modify By BCS Tengz 2021/6/29 MPP与PQD联动
						//增加不允许编辑对象逻辑
						if(!this.checkUsedPQDOrNoEdit(selectedItems)){
							return;
						}
						//End Modify
						var locationMenuItems=this.getLocationMenu(selectedItems);
						if(locationMenuItems.length>0)
						{
							menuItems.push({
								id: 'datamodel|' + actionName,
								name: actionTitle,
								subMenu: locationMenuItems,
								priority: actionPriority,
								isEditAction: isEditable
							});
						}
						isAppended = true;
						break;
					//Add By BCS Tengz 2021/6/28 MPP与PQD联动
					//增加不允许编辑对象逻辑
					case 'removeelement':
						isActionAllowed=this.checkUsedPQDOrNoEdit(selectedItems);
						break;
					case 'viewpqd':
						const selectItemType=selectedItems.getItemType();
						if(selectItemType=="mpp_Operation"||selectItemType=="mpp_OperationTest"){
							menuItems.push({
								id: 'datamodel|' + actionName,
								name: actionTitle,
								priority: actionPriority,
								isEditAction: false,
								onClick:this.onViewPQDMenuClick.bind(selectedItems)
							});
						}
						isAppended = true;
					break;
					//End Add
					default:
						break;
				}

				if (isActionAllowed && !isAppended) {
					var actionPriority = isNaN(this.actions[actionName].priority) ? 1000 : this.actions[actionName].priority;

					menuItems.push({
						id: 'datamodel|' + actionName,
						name: actionTitle,
						subMenu: subMenuItems,
						priority: actionPriority,
						isEditAction: isEditable
					});
				}
			}
		},
		//Add by tengz 2019/6/19
		//读取MPP内所有地区并组成子菜单
		getLocationMenu:function(selectedItems){
			var locationMenuItems=new Array();
			var locationId=selectedItems[0].getProperty("bcs_location");
			var modelType=selectedItems[0].getType();
			
			for(var j=0;j<selectedItems.length;j++)
			{
				var selectedItem=selectedItems[j];
				//判断多选对象的Location是否一致,Location不一致不显示菜单
				if(locationId!=selectedItem.getProperty("bcs_location"))
				{
					return locationMenuItems;
				}
				//判断多选对象的类型是否包含Operation和其它类型,同时包含Operation和其它类型的话则不显示菜单
				if(selectedItem.getType()==20&&selectedItem.getType()!=selectedItems[selectedItems.length-1].getType())
				{
					return locationMenuItems;
				}
				
			}
			
			function onMenuClick(rowId)
			{
				var menuId=this.id;
				
				viewController.performActionWithDirtyCheck(function(wasSaved) {
					top.addSelectItems2OtherLocations=function()
					{
						if(!aras.isDirtyEx(item))
						{
							var Locations=menuId=="add2alllocations"?processPlanLocations:new Array(processPlanLocations.find(function(element){return element._id==menuId;}));
							
							function callback(searchOperation)
							{
								if(!searchOperation){return;}
									
								for(var j=0;j<selectedItems.length;j++)
								{
									var selectedItemType=selectedItems[j].getAttribute("type");
									switch(selectedItemType)
									{
										case "mpp_Operation":
											var operationItem=aras.IomInnovator.newItem(selectedItemType,"get");
											operationItem.setProperty("id",selectedItems[j]._id);
											operationItem.setAttribute("levels","1");
											operationItem=operationItem.apply();
											
											for(var m=0;m<Locations.length;m++)
											{
												if(menuId=="add2alllocations")
												{
													if(selectedItems[j].getProperty("bcs_location","")==Locations[m]._id)
													{
														continue;
													}
												}
												
												var operationItemRelationShips=operationItem.getRelationships();
												var newOperationItem=operationItem.clone();
												for(var n=0;n<operationItemRelationShips.getItemCount();n++)
												{
													var newOperationItemRelationShip=operationItemRelationShips.getItemByIndex(n).clone();
													newOperationItemRelationShip.setProperty("bcs_location",Locations[m]._id);
													newOperationItem.addRelationship(newOperationItemRelationShip);
												}
												newOperationItem.setProperty("source_id",processPlanItem.getAttribute("id"));
												newOperationItem.setProperty("bcs_location",Locations[m]._id);
												newOperationItem.apply();
											}
										break;
										default:
											if(searchOperation)
											{
												var modelItem=aras.IomInnovator.getItemById(selectedItemType,selectedItems[j]._id);
												var newOperationItem=modelItem.clone();
												for(var n=0;n<searchOperation.length;n++)
												{
													var operationItem=aras.IomInnovator.getItemById("mpp_Operation",searchOperation[n]);
													newOperationItem.setProperty("source_id",searchOperation[n]);
													newOperationItem.setProperty("bcs_location",operationItem.getProperty("bcs_location"));
													newOperationItem.apply();
												}
												
											}
										break;
									}
									
								}
								
								parent.setItem(processPlanItem);
							}
							
							if(selectedItems[0].getAttribute("type")!="mpp_Operation")
							{
								var params = new Object();
								params.aras = top.aras;
								params.type = 'SearchDialog'
								params.itemtypeName="mpp_Operation";
								params.multiselect=true;
								
								var searchOperationAml="<AML><Item type='mpp_Operation' action='get' select='id'><OR>";
								for(var i=0;i<Locations.length;i++)
								{
									searchOperationAml+="<bcs_location>"+Locations[i]._id+"</bcs_location>";
								}
								searchOperationAml+="</OR><source_id>"+processPlanItem.getAttribute("id")+"</source_id></Item></AML>";
								var searchItems=aras.IomInnovator.applyAML(searchOperationAml);
								var idlist="";
								for(var i=0;i<searchItems.getItemCount();i++)
								{
									idlist+=searchItems.getItemByIndex(i).getID()+",";
								}
								if(idlist!="")
								{
									idlist=idlist.substring(0,idlist.length-1);
								}
								else{idlist="4160947EBC844CB695DD88070720NULL";}
								
								params.userMethodColumnCfgs=new Object();
								params.userMethodColumnCfgs["idlist"]=idlist;
								var topWnd = top.aras.getMostTopWindowWithAras(window);
								(topWnd.main || topWnd).ArasModules.Dialog.show('iframe', params).promise.then(callback);
							}
							else
							{
								callback(true);
							}
							
							//viewController.views.pp_viewer.domNode.contentWindow.wiModel.ResumeInvalidation();
						}
					}
					
					setTimeout("top.addSelectItems2OtherLocations()",100);
				});
				
			}
			
			var processPlanLocations = this.datamodel.rootProcessPlan.getLocations();
			for(var i=0;i<processPlanLocations.length;i++)
			{
				var processPlanLocation=processPlanLocations[i];
				var processPlanLocationId=processPlanLocation.getProperty("id");
				if(locationId!=processPlanLocationId)
				{
					locationMenuItems.push({id:processPlanLocationId,name:processPlanLocation.getProperty("name"),onClick:onMenuClick});
				}
			}
			
			if(locationMenuItems.length>1)
			{
				locationMenuItems.splice(0,0,{id:'add2alllocations',name:'所有地区',onClick:onMenuClick});
			}
			return locationMenuItems;
		},
		//Add By BCS Tengz 2021/6/29 MPP与PQD联动
		//检查是否有启用PQD以及是否为可编辑对象
		checkUsedPQDOrNoEdit:function(selectedItems){
			const viewmodel=viewController.views["pp_viewer"].domNode.contentWindow.wiModel;
			const schemaHelper =viewmodel.Schema();
			for(let selectedItem of selectedItems){
				const selectElement=viewmodel.GetElementsByUid(selectedItem._id)[0];
				if(schemaHelper.getSchemaAttribute(selectElement.nodeName, 'noedit')){
					return false;
				}
				if(isUsedPQD){
					if(selectElement.nodeName=="Test"){
						return false;
					}
					if(selectElement.Parent&&selectElement.Parent.nodeName=="Test"){
						return false;
					}
				}
			}
			return true;
		},
		//Add By BCS Tengz 2021/6/29 MPP与PQD联动
		//查看PQD菜单点击方法
		onViewPQDMenuClick:function(){
			if(this.getItemType()=="mpp_Operation"){
				aras.evalMethod("bcs_MPP_ShowPQD",undefined,{ppid:itemID,viewname:"Process Flow Diagram",location:this.getProperty("bcs_location"),operation:this._id,itemid:undefined});
			}else{
				const relatedItem=this.getRelatedItem();
				if(relatedItem.getItemType()=="mpp_Test"){
					aras.evalMethod("bcs_MPP_ShowPQD",undefined,{ppid:itemID,viewname:"Process Control Plan",location:this.Parent.getProperty("bcs_location"),operation:this.Parent._id,itemid:relatedItem._id});
				}else{
					aras.evalMethod("bcs_MPP_ShowPQD",undefined,{ppid:itemID,viewname:"Process Control Plan",location:this.Parent.Parent.getProperty("bcs_location"),operation:this.Parent.Parent._id,itemid:relatedItem._id});
				}		
			}
		}
	});
});
