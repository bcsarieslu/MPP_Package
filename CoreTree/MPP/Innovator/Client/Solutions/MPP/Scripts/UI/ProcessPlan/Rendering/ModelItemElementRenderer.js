define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/ArasItemXmlSchemaElementRenderer'
],
function(declare, ItemXmlSchemaElementRenderer) {
	return declare('Aras.Client.Controls.TechDoc.UI.Rendering.ModelItemElementRenderer', ItemXmlSchemaElementRenderer, {
		resourceStrings: null,

		constructor: function() {
			this.datamodel = this.factory._viewmodel.datamodel;
			this.uiUtils = this.factory._viewmodel.uiUtils;
			this.enums = this.factory._viewmodel.enums;
			this.partConfig = this.factory._viewmodel.partConfig;
			this.resourceStrings = {
				itemIsBlocked: this.uiUtils.getResource('elementRendererTree.itemIsBlocked')
			};
		},

		prepareElementState: function(schemaElement, parentState) {
			var elementState = this.inherited(arguments);

			if (schemaElement.is('ArasInternalItemXmlSchemaElement') && !elementState.isEmpty) {
				var modelItem = schemaElement.Item();
				var itemStatus = modelItem.getAttribute('itemStatus');
				if (itemStatus) {
					elementState.itemStatus = itemStatus;
					return elementState;
				}

				var itemAction = modelItem.getAttribute('action');

				switch (itemAction) {
					case 'add':
						elementState.itemStatus = 'new';
						break;
					case 'delete':
						elementState.itemStatus = 'deleted';
						break;
					case 'update':
					case 'edit':
						elementState.itemStatus = 'updated';
						break;
					default:
						break;
				}
			}

			return elementState;
		},

		getStateClasses: function(schemaElement, elementState) {
			var stateClasses = this.inherited(arguments);

			if (elementState.itemStatus === 'deleted') {
				stateClasses.push('DeletedModelItem');
			}

			return stateClasses;
		},

		getStatusMarksContent: function(schemaElement, elementState) {
			if (schemaElement) {
				var marksContent = '';
				var markCount = 0;
				var itemStatusImage;

				if (elementState.isBlocked) {
					marksContent += this.wrapInTag('', 'img', {src: '../../images/Blocked.svg', class: 'ConditionMark'});
					markCount++;
				}

				if (elementState.itemStatus) {
					switch (elementState.itemStatus) {
						case 'new':
							itemStatusImage = '../../images/New.svg';
							break;
						case 'updated':
							itemStatusImage = '../../images/LockedAndModified.svg';
							break;
						case 'deleted':
							itemStatusImage = '../../images/Delete.svg';
							break;
						default:
							break;
					}

					if (itemStatusImage) {
						var attributes = {src: itemStatusImage, class: 'ConditionMark', style: markCount ? 'right:' + markCount * 20 + 'px;' : ''};
						marksContent += this.wrapInTag('', 'img', attributes);
						markCount++;
					}
				}
				
				//Add by tengz 2019/6/21 MPP
				//用图标显示ProcessPlan Tree内对象所属的地区
				if(schemaElement.Item().getAttribute("type")!="mpp_ProcessPlan")
				{
					if(schemaElement.getProperty("bcs_location")=="")
					{
						marksContent += this.wrapInTag('', 'img', {src: '../../images/FlaggedBy.svg', class: 'ConditionMark', style: markCount ? 'right:' + markCount * 20 + 'px;' : ''});
					}
					else {
						//2021/11/16 图标显示,本地图标,上传图标
						var icon = aras.newIOMItem("mpp_Location", "get");
						icon.setAttribute("select", "bcs_icon");
						icon.setAttribute("id", schemaElement.getProperty("bcs_location"));
						icon = icon.apply();
						var iconurl = icon.getProperty("bcs_icon");
						if (iconurl.indexOf(".") != -1) {
							iconurl = "../" + iconurl;
						}
						else {
							iconurl = dojoConfig.arasContext.adjustIconUrl(iconurl);
						}
						marksContent += this.wrapInTag('', 'img', { src: iconurl, class: 'ConditionMark', style: markCount ? 'right:' + markCount * 20 + 'px;' : '' });
					}
				}
				
				return marksContent;
			}
		},

		GetTreeName: function(schemaElement, elementState) {
			var elementName = '';

			if (elementState.isBlocked) {
				elementName = this.resourceStrings.itemIsBlocked;
			} else if (!elementState.isEmpty) {
				elementName = schemaElement.getProperty('name') || schemaElement.getProperty('item_number');
			}

			return this.wrapInTag(elementName, 'span', {class: 'ArasXmlSchemaElementTypeNode'});
		},

		GetTreeStyle: function(schemaElement, elementState) {
			return {backgroundImage: 'url("' + this.enums.getImageFromName(schemaElement.nodeName) + '")'};
		}
	});
});
