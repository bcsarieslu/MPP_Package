define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/XmlSchemaNodeRenderer',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/DocumentationEnums'
], function (declare, XmlSchemaNodeRenderer, Enums) {
	return declare(
		'Aras.Client.Controls.TechDoc.UI.Rendering.XmlSchemaElementRenderer',
		XmlSchemaNodeRenderer,
		{
			constructor: function (initialArguments) {
				this.ResourceString(
					'isBlocked',
					'../Modules/aras.innovator.TDF',
					'rendering.is_blocked'
				);
				this.ResourceString(
					'contentIsBlocked',
					'../Modules/aras.innovator.TDF',
					'rendering.content_is_blocked'
				);
			},

			RenderInnerElement: function (schemaElement, elementState) {
				return '';
			},

			RenderHtml: function (schemaElement, parentState, optionalParameters) {
				var out = '';
				optionalParameters = optionalParameters || {};
				if (schemaElement.Display() != Enums.DisplayType.Hidden) {
					var elementState = this.prepareElementState(
						schemaElement,
						parentState
					);
					out += this.RenderStartHtmlElement(schemaElement, elementState);
					if (!optionalParameters.skipChildRendering) {
						out += elementState.isBlocked
							? this.ResourceString('contentIsBlocked')
							: this.RenderInnerContent(schemaElement, elementState);
					}
					out += this.RenderEndHtmlElement(schemaElement, elementState);
				} else {
					out += this.wrapInTag('', 'div', {
						id: schemaElement.Id(),
						class: this.GetClassList(schemaElement, {}).join(' '),
						style: 'display: none !important;'
					});
				}

				return out;
			},

			RenderStartHtmlElement: function (schemaElement, elementState) {
				var startHtml = '';
				var additionalAttributes = this._getAttributesStringArray(
					this.GetAttributes(schemaElement, elementState)
				);

				if (elementState.isInactiveRoot) {
					var isCollapsed = schemaElement.isContentCollapsed();
					var actionsHelper = this.factory._viewmodel.ActionsHelper();
					var conditionButtonTitle =
						actionsHelper.viewActions.changecondition.viewtitle;

					startHtml +=
						'<div class="InactiveContainer" inactiveElementId="' +
						schemaElement.Id() +
						'">' +
						'<div class="ExpandoButton' +
						(isCollapsed ? '' : ' Opened') +
						'"></div>' +
						(isCollapsed ? '' : '<div class="ExpandoArea"></div>') +
						'<div class="ConditionButton" title="' +
						conditionButtonTitle +
						'"></div>' +
						'<div class="InactiveContent' +
						(isCollapsed ? '' : ' OpenedContent') +
						'">';

					additionalAttributes.push('');
				}

				startHtml +=
					'<div id="' +
					schemaElement.Id() +
					'"' +
					(this.getPlaceholder()
						? ' data-placeholder="' + this.getPlaceholder() + '"'
						: '') +
					' class="' +
					this.GetClassList(schemaElement, elementState).join(' ') +
					'"' +
					(additionalAttributes.length
						? ' ' + additionalAttributes.join(' ')
						: '') +
					'>';

				return startHtml;
			},

			RenderEndHtmlElement: function (schemaElement, elementState) {
				var endHtml = '</div>';

				if (elementState.isInactiveRoot) {
					endHtml += '</div>' + '</div>';
				}

				return endHtml;
			},

			GetAttributes: function (schemaElement, elementState) {
				var originAttributes = schemaElement.origin.attributes;
				var renderAttributes = {};

				if (originAttributes.length) {
					var currentAttribute;
					var i;

					for (i = 0; i < originAttributes.length; i++) {
						currentAttribute = originAttributes[i];

						// currently all attributes without prefix will be rendered
						if (currentAttribute.name.indexOf(':') === -1) {
							renderAttributes[
								currentAttribute.name
							] = dojox.html.entities.encode(currentAttribute.value);
						}
					}
				}

				return renderAttributes;
			},

			GetClassList: function (schemaElement, elementState) {
				var result = this.inherited(arguments);
				var stateClasses = this.getStateClasses(schemaElement, elementState);

				return result.concat(stateClasses);
			},

			prepareElementState: function (schemaElement, parentState) {
				if (schemaElement) {
					var resultState;

					if (!parentState) {
						const parentElement = schemaElement.Parent;

						if (parentElement) {
							const parentRenderer = this.factory.CreateRenderer(parentElement);

							parentState = parentRenderer.prepareElementState(
								parentElement,
								{}
							);
						} else {
							parentState = {};
						}
					}

					resultState = {
						isInactive: schemaElement.isInactive(),
						isUpdatable: schemaElement.isUpdatable(),
						isEmpty: schemaElement.isEmpty(),
						isDynamic: schemaElement.isDynamic(),
						isDynamicChild: parentState.isDynamic || parentState.isDynamicChild,
						isExternalChild:
							parentState.isExternal || parentState.isExternalChild,
						isBlocked: schemaElement.isBlocked(),
						isSelectable: schemaElement.isSelectable(),
						parentState: parentState
					};

					// states that are calculated base on existing
					resultState.isInactiveRoot =
						resultState.isInactive &&
						!resultState.parentState.isInactive &&
						!resultState.isBlocked;

					return resultState;
				}

				return {};
			},

			RenderInnerContent: function (schemaElement, elementState) {
				return (
					this.RenderInnerElement(schemaElement, elementState) +
					this.RenderChildren(schemaElement, elementState)
				);
			},

			RenderChildren: function (schemaElement, elementState) {
				var out = '';
				var childItems = schemaElement.ChildItems().List();
				var childItem;
				var i;

				for (i = 0; i < childItems.length; i++) {
					childItem = childItems[i];
					out += this.factory
						.CreateRenderer(childItem)
						.RenderHtml(childItem, elementState);
				}

				return out;
			},

			_getAttributesStringArray: function (attributes) {
				var stringArray = [];
				var attributeName;

				for (attributeName in attributes) {
					stringArray.push(
						attributeName + '="' + attributes[attributeName] + '"'
					);
				}

				return stringArray;
			},

			RenderModel: function (schemaElement, parentState) {
				var out = [];

				if (schemaElement.Display() != Enums.DisplayType.Hidden) {
					var parentId = schemaElement.Parent
						? schemaElement.Parent.Id().toString()
						: null;
					var elementState = this.prepareElementState(
						schemaElement,
						parentState
					);
					var name, style;
					var bcs_operation_image = schemaElement.getProperty("bcs_operation_image");
					if (elementState.isBlocked) {
						name =
							(schemaElement.nodeName == 'aras:block'
								? 'Technical Document'
								: schemaElement.nodeName) + this.ResourceString('isBlocked');
					} else {
						name = this.GetTreeName(schemaElement, elementState);
					}
					//Add by 2021/11/16 silv 本地图片,上传图片读取
					if (bcs_operation_image) {
						if (bcs_operation_image.indexOf(".") != -1) {
							style = { backgroundImage: 'url(\"../' + schemaElement.getProperty("bcs_operation_image") + '\")' };
						}
						else {
							style = { backgroundImage: 'url(\"' + dojoConfig.arasContext.adjustIconUrl(bcs_operation_image) + '\")' };
						}

					}
					else {
						style = "";
					}
					out.push({
						id: schemaElement.Id().toString(),
						uid: schemaElement.Uid(),
						name:
							name + this.getStatusMarksContent(schemaElement, elementState),
						style: style || this.GetTreeStyle(schemaElement, elementState),
						parent: parentId,
						rowClass: this.getTreeClassList(schemaElement, elementState),
						fields: [schemaElement]
					});
					out = out.concat(this.RenderChildrens(schemaElement, elementState));
				}

				return out;
			},

			RenderChildrens: function (schemaElement, elementState) {
				var out = [];
				var isContentMixed = this.factory._viewmodel
					.Schema()
					.IsContentMixed(schemaElement);

				if (!isContentMixed && !elementState.isBlocked) {
					var childItems = schemaElement.ChildItems();
					var childsCount = childItems.length();
					var childItem;
					var childRenderResult;
					var i;

					for (i = 0; i < childsCount; i++) {
						childItem = childItems.get(i);

						childRenderResult = this.factory
							.CreateRenderer(childItem)
							.RenderModel(childItem, elementState);
						out = out.concat(childRenderResult);
					}
				}

				return out;
			},

			GetTreeName: function (schemaElement, elementState) {
				var isContentMixed = this.factory._viewmodel
					.Schema()
					.IsContentMixed(schemaElement);
				var treeName = schemaElement.nodeName;

				if (isContentMixed) {
					var objectText = this._getTextForMixedElement(schemaElement);

					treeName +=
						' - ' +
						this.wrapInTag(dojox.html.entities.encode(objectText), 'span', {
							class: 'MixedContentNode'
						});
				}

				return treeName;
			},

			getStatusMarksContent: function (schemaElement, elementState) {
				if (schemaElement) {
					var marksContent = '';
					var markCount = 0;

					if (elementState && elementState.isBlocked) {
						marksContent += this.wrapInTag('', 'img', {
							src: '../../images/Blocked.svg',
							class: 'ConditionMark'
						});
						markCount++;
					}

					// if condition is not empty
					if (schemaElement.Condition() !== '{}') {
						marksContent += this.wrapInTag('', 'img', {
							src: '../../images/ConditionsApplied.svg',
							class: 'ConditionMark',
							style: markCount ? 'right:' + markCount * 20 + 'px;' : undefined
						});
						markCount++;
					}

					return marksContent;
				}
			},

			getTreeClassList: function (schemaElement, elementState) {
				var stateClasses = this.getStateClasses(schemaElement, elementState);

				return (
					this.GetTreeType(schemaElement, elementState) +
					(stateClasses.length ? ' ' + stateClasses.join(' ') : '')
				);
			},

			getStateClasses: function (schemaElement, elementState) {
				var stateClasses = [];

				if (elementState) {
					if (elementState.isInactive) {
						stateClasses.push('ArasXmlSchemaElementInactive');
					}

					if (elementState.isUpdatable) {
						stateClasses.push('ArasXmlSchemaElementUpdatable');
					}

					if (elementState.isEmpty) {
						stateClasses.push('ArasXmlSchemaElementEmpty');
					}

					if (elementState.isDynamic) {
						stateClasses.push('ArasXmlSchemaDynamicElement');
					}

					if (elementState.isBlocked) {
						stateClasses.push('ArasXmlSchemaElementBlocked');
					}

					if (elementState.isInactiveRoot) {
						stateClasses.push('ArasXmlSchemaElementInactiveRoot');
					}
				}

				return stateClasses;
			},

			GetTreeType: function (schemaElement, elementState) {
				return ' XmlSchemaElementTreeNode';
			},

			GetTreeStyle: function (schemaElement, elementState) {
				var type = this.factory._viewmodel
					.Schema()
					.GetSchemaElementType(schemaElement);

				return {
					backgroundImage: 'url("' + Enums.getImagefromType(type) + '")'
				};
			},

			_getTextForMixedElement: function (wrappedObject) {
				var mixedText = '';
				var childItems = wrappedObject.ChildItems().List();
				var childItem;
				var i;

				for (i = 0; i < childItems.length; i++) {
					childItem = childItems[i];

					if (childItem.is('XmlSchemaText')) {
						mixedText += childItem.Text();
					}
				}

				return mixedText;
			},

			getPlaceholder: function () {
				return '';
			}
		}
	);
});
