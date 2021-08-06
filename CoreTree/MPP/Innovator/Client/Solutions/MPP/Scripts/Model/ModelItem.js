/*jshint sub:true*/
define([
	'dojo/_base/declare',
	'MPP/Model/Eventable',
	'MPP/Model/Typeable',
	'MPP/Model/ArrayWrapper',
	'MPP/Model/ModelEnums'
],
function(declare, Eventable, Typeable, ArrayWrapper, Enums) {
	var ModelItemClass = declare('Aras.Innovator.Solutions.MPP.Model.ModelItem', [Eventable, Typeable], {
		datamodel: null,
		_id: null,
		Parent: null,
		internal: null,
		_langCode: null,

		constructor: function(initialArguments) {
			this._langCode = initialArguments.datamodel.filterParameters.langCode;
			this.datamodel = initialArguments.datamodel;
			this.internal = {
				itemData: null,
				childItems: null,
				notificationsSuspended: 0,
				systemProperties: {id: true},
				systemAttributes: {id: true, type: true}
			};
			this.deserializeItemNode(initialArguments.origin);

			this.registerType('ModelItem');
		},

		isEmpty: function() {
			return Boolean(this.internal.itemData.isEmpty);
		},

		isModified: function(value) {
			var itemData = this.internal.itemData;

			if (value === undefined) {
				return Boolean(itemData && itemData.isModified);
			}

			itemData.isModified = Boolean(value);
		},

		isRelated: function(value) {
			return Boolean(this.Parent && this.Parent.getRelatedItem() === this);
		},

		isPropertyModified: function(propertyName) {
			if (propertyName) {
				var itemData = this.internal.itemData;
				var propertyDescriptor = itemData && itemData.properties[propertyName];

				return propertyDescriptor && propertyDescriptor.state === Enums.PropertyStates.Modified;
			}
		},

		isBlocked: function() {
			var isDiscoverOnly = this.getAttribute('discover_only') === '1';

			if (!isDiscoverOnly) {
				var relatedItem = this.getRelatedItem();

				return relatedItem && relatedItem.isBlocked();
			}

			return isDiscoverOnly;
		},

		isEditable: function() {
			return this.Parent ? this.Parent.isEditable() : this.getAttribute('isEditState') === '1';
		},

		getType: function() {
			if (!this.isEmpty()) {
				var itemTypeName = this.getAttribute('type');

				return Enums.getElementTypeFromItemType(itemTypeName) || Enums.ModelItemTypes.Unknown;
			}

			return Enums.ModelItemTypes.Unknown;
		},

		getItemType: function() {
			return !this.isEmpty() && this.getAttribute('type');
		},

		hasRelatedItem: function() {
			if (!this.isEmpty()) {
				var itemProperties = this.internal.itemData.properties;
				var relatedIdProperty = itemProperties['related_id'];

				return relatedIdProperty && (relatedIdProperty.value || relatedIdProperty.relatedItem);
			}

			return false;
		},

		deserializeItemNode: function(itemNode) {
			var collectedData = {attributes: {}, properties: {}, isEmpty: true, isModified: false};
			var itemChildren = [];

			if (itemNode) {
				var elementFactory = this.datamodel.elementFactory;
				var requiredAttributes = Enums.ItemAttributeNames;
				var currentNode, nodeName, namePrefix, attributeName, attributeValue, i;

				// attributes section
				for (i = 0; i < requiredAttributes.length; i++) {
					attributeName = requiredAttributes[i];
					attributeValue = itemNode.getAttribute(attributeName);

					if (attributeValue) {
						collectedData.attributes[attributeName] = attributeValue;
					}
				}

				// properties section
				currentNode = itemNode.firstChild;
				while (currentNode) {
					nodeName = currentNode.nodeName;
					namePrefix = currentNode.prefix;

					nodeName = namePrefix ? nodeName.substr(namePrefix.length + 1) : nodeName;

					switch (nodeName) {
						case 'Relationships':
							var relationshipNode = currentNode.firstChild;

							while (relationshipNode) {
								var childModelItem = elementFactory.createElementFromItemNode(relationshipNode);

								if (childModelItem) {
									itemChildren.push(childModelItem);
								}

								relationshipNode = relationshipNode.nextSibling;
							}
							break;
						case 'related_id':
							var relatedIdProperty = this.deserializePropertyNode(currentNode);
							if (!relatedIdProperty) {
								break;
							}

							if (!relatedIdProperty.value) {
								var firstChildNode = currentNode.firstChild;

								if (firstChildNode) {
									var relatedItemNode = firstChildNode.nodeName === 'Item' ? firstChildNode : firstChildNode.nextSibling;

									if (relatedItemNode) {
										var relatedItem = new ModelItemClass({datamodel: this.datamodel, origin: relatedItemNode});

										relatedItem.Parent = this;
										relatedIdProperty.relatedItem = relatedItem;
										relatedIdProperty.value = relatedItem.Id();
									}
								}
							}

							collectedData.properties[nodeName] = relatedIdProperty;
							break;
						case '#text':
							break;
						default:
							var property = this.deserializePropertyNode(currentNode);
							//in case of multiple node with same name we prefer properties with lang
							if (property && (!collectedData.properties[nodeName] || property.lang)) {
								collectedData.properties[nodeName] = property;
							}
							break;
					}

					currentNode = currentNode.nextSibling;
				}

				collectedData.isEmpty = false;
			}

			this.internal.itemData = collectedData;
			this._id = collectedData.attributes.id || (collectedData.properties.id && collectedData.properties.id.value);
			this.ChildItems(new ArrayWrapper({owner: this, array: itemChildren}));
		},

		deserializePropertyNode: function(propertyNode) {
			if (propertyNode) {
				var propertyData = {value: undefined, state: Enums.PropertyStates.Default};
				var firstChildNode = propertyNode.firstChild;
				var languageCode = propertyNode.getAttribute('xml:lang');
				var oldValueIsSet;

				if (languageCode) {
					if (this._langCode && languageCode !== this._langCode) {
						return null;
					}

					propertyData.lang = languageCode;
				}

				oldValueIsSet = propertyNode.getAttribute('mpp_old_value_is_set');

				if (oldValueIsSet && (oldValueIsSet === '1' || oldValueIsSet === 1)) {
					propertyData.state = Enums.PropertyStates.Modified;
					propertyData.oldValueIsSet = true;
					propertyData.oldValue = propertyNode.getAttribute('mpp_old_value');
				}

				// if property node contains single textNode with value
				if (firstChildNode && firstChildNode.nodeName === '#text') {
					//Modify by tengz for MPP
					//未知BUG,可能是由于属性值太长造成属性Node被拆分成了多个ChildNode,导致此时读取到的值只有一部分
					//propertyData.value = firstChildNode.text;
					propertyData.value=propertyNode.text;
				} else {
					propertyData.value = '';
				}

				return propertyData;
			}
		},

		getHierarchyTree: function(inputOptions) {
			var resultTree = {};
			var allChildren = this.getAllChildren();

			if (allChildren.length) {
				var idPath = [];
				var childrenIdHash = {};
				var currentChild, parentBranch, currentBranch, itemId, i, j;

				inputOptions = inputOptions || {};

				for (i = 1; i < allChildren.length; i++) {
					currentChild = allChildren[i];
					childrenIdHash[currentChild.Id()] = currentChild;
				}

				for (i = 1; i < allChildren.length; i++) {
					currentChild = allChildren[i];

					// 'related_id' item can be returned from getAllChildren, but it doesn't have Parent property
					if (!currentChild.isRelated() && (!inputOptions.onlyChanges || (currentChild.isModified() || currentChild.isNew()))) {
						idPath.length = 0;

						while (currentChild && currentChild !== this) {
							idPath.push(currentChild.Id());
							currentChild = currentChild.Parent;
						}

						parentBranch = resultTree;
						for (j = idPath.length - 1; j >= 0; j--) {
							itemId = idPath[j];
							currentBranch = parentBranch[itemId];

							if (!currentBranch) {
								currentBranch = {item: childrenIdHash[itemId], children: {}};
								parentBranch[itemId] = currentBranch;
							}

							parentBranch = currentBranch.children;
						}
					}
				}
			}

			return resultTree;
		},

		serializeToAml: function(inputOptions) {
			var itemAml = '';

			inputOptions = inputOptions || {};

			if (!this.isEmpty() && !this.isBlocked()) {
				var itemData = this.internal.itemData;
				var propertyStates = Enums.PropertyStates;
				var includeOnlyChanges = Boolean(inputOptions.onlyChanges);
				var isNewItem = this.isNew();
				var attributeName, propertyData, propertyName, propertyAttributes, serializedData;

				// start tag
				itemAml += '<Item';

				// attributes section
				for (attributeName in itemData.attributes) {
					itemAml += ' ' + attributeName + '="' + itemData.attributes[attributeName] + '"';
				}
				itemAml += '>';

				// properties section
				for (propertyName in itemData.properties) {
					propertyData = itemData.properties[propertyName];
					propertyAttributes = '';

					if (!includeOnlyChanges || (propertyData.state === propertyStates.Modified || isNewItem)) {
						if (propertyName === 'related_id' && propertyData.relatedItem && (propertyData.relatedItem.isNew() || inputOptions.expandRelated)) {
							serializedData = propertyData.relatedItem.serializeToAml(inputOptions);
						} else {
							serializedData = this.encodePropertyValue(propertyData.value);
						}

						//serializedData = this.encodePropertyValue(propertyData.value);
						if (propertyData.lang) {
							propertyAttributes = ' xmlns:i18n="http://www.aras.com/I18N" xml:lang="' + propertyData.lang + '"';
							propertyName = 'i18n:' + propertyName;
						}

						if (propertyData.oldValueIsSet) {
							propertyAttributes += ' mpp_old_value="' + this.encodePropertyValue(propertyData.oldValue) + '"';
							propertyAttributes += ' mpp_old_value_is_set="1"';
							var operationNumber = this.Parent.getProperty('sort_order');
							propertyAttributes += ' mpp_new_operation_number="' + operationNumber + '"';
						}

						itemAml += '<' + propertyName + propertyAttributes + '>' + serializedData + '</' + propertyName + '>';
					}
				}

				if (inputOptions.fullHierarchy) {
					itemAml += inputOptions.childrenAml ||
						this._serializeChildrenToAml({onlyChanges: includeOnlyChanges, expandRelated: inputOptions.expandRelated});
				} else if (inputOptions.childrenAml) {
					itemAml += inputOptions.childrenAml;
					delete inputOptions.childrenAml;
				}

				// end tag
				itemAml += '</Item>';
			}

			return itemAml;
		},

		encodePropertyValue: function(value) {
			var valueType = typeof value;

			switch (valueType) {
				case 'object':
					value = JSON.stringify(value);
					break;
				case 'string':
					break;
				case 'undefined':
					value = '';
					break;
				default:
					value = value.toString();
			}

			return value && value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
		},

		updateFromItem: function(modelItem) {
			var currentProperties = this.internal.itemData.properties;
			var updatedProperties = modelItem.internal.itemData.properties;
			var propertyName, propertyDescriptor;

			for (propertyName in updatedProperties) {
				if (updatedProperties.hasOwnProperty(propertyName)) {
					propertyDescriptor = currentProperties[propertyName];

					if (!propertyDescriptor) {
						propertyDescriptor = {};
						currentProperties[propertyName] = propertyDescriptor;
					}

					if (propertyName === 'quantity') {
						this.setProperty(propertyName, updatedProperties[propertyName].value, updatedProperties[propertyName].lang);
					} else {
						propertyDescriptor.value = updatedProperties[propertyName].value;
						propertyDescriptor.lang = updatedProperties[propertyName].lang;
						propertyDescriptor.state = Enums.PropertyStates.Modified;
					}
				}
			}

			this.setAttribute('action', 'edit');
		},

		mergeWith: function(targetItem, setModifiedState) {
			this.mergeItems(this, targetItem, setModifiedState);
		},

		mergeItems: function(targetItem, sourceItem, setModifiedState) {
			if ((targetItem && targetItem.is('ModelItem')) && (sourceItem && sourceItem.is('ModelItem'))) {
				var targetItemData = targetItem.internal.itemData;
				var sourceItemData = sourceItem.internal.itemData;
				var isTargetEmpty = targetItemData.isEmpty;

				if (isTargetEmpty || (targetItem.getType() === sourceItem.getType())) {
					var sourceChildHash = {};
					var targetChildHash = {};
					var excludeAttributes = isTargetEmpty ? {} : targetItem.internal.systemAttributes;
					var excludeProperties = isTargetEmpty ? {} : targetItem.internal.systemProperties;
					var isChanged = false;
					var propertyStates = Enums.PropertyStates;
					var targetData, sourceData, sourceProperty, sourceValue, targetProperty, propertyName, attributeName,
						sourceChildren, targetChildrenArray, targetChildren, currentChild, clonedItem, itemId, i;

					// merge item attributes
					targetData = targetItemData.attributes;
					sourceData = sourceItemData.attributes;

					for (attributeName in sourceData) {
						if (!excludeAttributes[attributeName]) {
							sourceValue = sourceData[attributeName];

							if (sourceValue && targetData[attributeName] !== sourceValue) {
								targetData[attributeName] = sourceData[attributeName];
								isChanged = true;
							}
						}
					}

					// merge item properties
					targetData = targetItemData.properties;
					sourceData = sourceItemData.properties;

					for (propertyName in sourceData) {
						if (!excludeProperties[propertyName]) {
							sourceProperty = sourceData[propertyName];
							sourceValue = sourceProperty.value;

							if (sourceValue) {
								targetProperty = targetData[propertyName];

								if (!targetProperty) {
									targetProperty = this.createEmptyProperty();
									targetData[propertyName] = targetProperty;
								}

								if (sourceValue && targetProperty.value !== sourceValue) {
									targetProperty.value = sourceValue;
									targetProperty.state = setModifiedState ? propertyStates.Modified : sourceProperty.state;
									isChanged = true;
								}
							}
						}
					}

					if (isChanged) {
						targetItemData.isModified = true;

						if (isTargetEmpty) {
							targetItemData.isEmpty = isTargetEmpty && sourceItemData.isEmpty;
							targetItem._id = targetItemData.attributes.id || (targetItemData.properties.id && targetItemData.properties.id.value);
						}
					}

					targetChildrenArray = targetItem.ChildItems();
					targetChildren = targetChildrenArray.getAllItems();
					sourceChildren = sourceItem.ChildItems().getAllItems();

					for (i = 0; i < targetChildren.length; i++) {
						currentChild = targetChildren[i];
						targetChildHash[currentChild.Id()] = currentChild;
					}

					for (i = 0; i < sourceChildren.length; i++) {
						currentChild = sourceChildren[i];
						sourceChildHash[currentChild.Id()] = currentChild;
					}

					for (itemId in sourceChildHash) {
						currentChild = sourceChildHash[itemId];

						// if item exists, then merge, in other case add item copy to target
						if (targetChildHash[itemId]) {
							this.mergeItems(targetChildHash[itemId], currentChild, setModifiedState);
						} else if (!currentChild.isDeleted()) {
							clonedItem = sourceChildHash[itemId].Clone();

							if (isTargetEmpty) {
								targetChildren.push(clonedItem);
							} else {
								targetChildrenArray.add(clonedItem);
							}
						}
					}

					if (isTargetEmpty) {
						targetChildrenArray.initialize(targetChildren);
					}
				}
			} else {
				return targetItem || sourceItem;
			}
		},

		Clone: function() {
			var clonedItem = new this.constructor({datamodel: this.datamodel});
			clonedItem.mergeWith(this);

			return clonedItem;
		},

		_serializeChildrenToAml: function(inputOptions, hierarchyTree) {
			var resultAml = '';
			var hierarchyBranch, itemId, childItem;

			hierarchyTree = hierarchyTree || this.getHierarchyTree(inputOptions);

			for (itemId in hierarchyTree) {
				hierarchyBranch = hierarchyTree[itemId];
				childItem = hierarchyBranch.item;

				inputOptions.childrenAml = this._serializeChildrenToAml(inputOptions, hierarchyBranch.children);
				resultAml += childItem.serializeToAml(inputOptions);
			}

			resultAml = resultAml ? '<Relationships>' + resultAml + '</Relationships>' : resultAml;

			return resultAml;
		},

		createEmptyProperty: function() {
			return {attributes: {}, value: undefined, state: Enums.PropertyStates.Default};
		},

		ChildItems: function(/*ArrayWrapper*/ value) {
			if (value === undefined) {
				return this.internal.childItems;
			}

			var intenalProperties = this.internal;

			if (intenalProperties.childItems) {
				intenalProperties.childItems.unregisterItems();
			}

			intenalProperties.childItems = value;

			if (this.isRegistered()) {
				intenalProperties.childItems.registerItems();
			}
		},

		getAllChildren: function(targetItem, typeFilter, foundItems) {
			/// <summary>
			/// Searches all descendant items by ModelItemTypes.
			/// </summary>
			/// <param name="targetItem" type="ModelItem">If defined, then will be used as root item for search.</param>
			/// <param name="typeFilter" type="String|Enums.ModelItemTypes">ModelItemType for search.</param>
			/// <returns>Array of found items.</returns>
			targetItem = targetItem || this;
			foundItems = foundItems || [];

			if (targetItem) {
				var relatedItem = targetItem.getRelatedItem();
				var isFiltrationPassed = true;

				switch (typeof typeFilter) {
					case 'string':
						isFiltrationPassed = targetItem.is(typeFilter);
						break;
					case 'number':
						isFiltrationPassed = targetItem.getType() === typeFilter;
						break;
					default:
						break;
				}

				if (isFiltrationPassed) {
					foundItems.push(targetItem);
				}

				if (targetItem.ChildItems) {
					var childItems = targetItem.ChildItems();
					var allItems = childItems.getAllItems();
					var i;

					for (i = 0; i < allItems.length; i++) {
						this.getAllChildren(allItems[i], typeFilter, foundItems);
					}
				}

				if (relatedItem) {
					this.getAllChildren(relatedItem, typeFilter, foundItems);
				}
			}

			return foundItems;
		},

		getChildrenByType: function(typeFilter) {
			/// <summary>
			/// Searches all descendant items by ModelItemTypes.
			/// </summary>
			/// <param name="typeFilter" type="String|Enums.ModelItemTypes">ModelItemType for search.</param>
			/// <returns>Array of found items.</returns>
			return this.getAllChildren(this, typeFilter);
		},

		getChildrenByItemType: function(itemTypeFilter, targetItem, foundItems) {
			/// <summary>
			/// Searches all descendant items by itemType.
			/// </summary>
			/// <param name="itemTypeFilter" type="String">Innovator ItemType of items.</param>
			/// <param name="targetItem" type="ModelItem">If defined, then will be used as root item for search.</param>
			/// <returns>Array of found items.</returns>
			targetItem = targetItem || this;
			foundItems = foundItems || [];

			if (targetItem && itemTypeFilter) {
				if (targetItem.getItemType() === itemTypeFilter) {
					foundItems.push(targetItem);
				}

				if (targetItem.ChildItems) {
					var childElements = targetItem.ChildItems().getAllItems();
					var i;

					for (i = 0; i < childElements.length; i++) {
						this.getChildrenByItemType(itemTypeFilter, childElements[i], foundItems);
					}
				}

				if (targetItem.hasRelatedItem()) {
					this.getChildrenByItemType(itemTypeFilter, targetItem.getRelatedItem(), foundItems);
				}
			}

			return foundItems;
		},

		getChildrenById: function(itemId, targetItem, foundItems) {
			/// <summary>
			/// Searches all descendant items by item Id.
			/// </summary>
			/// <param name="itemId" type="String">Id of item.</param>
			/// <param name="targetItem" type="ModelItem">If defined, then will be used as root item for search.</param>
			/// <returns>Array of found items.</returns>
			foundItems = foundItems || [];
			targetItem = targetItem || this;

			if (targetItem.ChildItems) {
				var allChildren = targetItem.ChildItems().getAllItems();
				var currentChild, i;

				for (i = 0; i < allChildren.length; i++) {
					currentChild = allChildren[i];

					if (currentChild.Id() === itemId) {
						foundItems.push(currentChild);
					} else {
						this.getChildrenById(itemId, currentChild, foundItems);
					}
				}
			}

			return foundItems;
		},

		getChildByIdPath: function(idPath, searchItemsList) {
			/// <summary>
			/// Searches child element by idPath(from ancestor to descendant).
			/// </summary>
			/// <param name="idPath" type="Array">Contains ids of elements(from ancestor to descendant).</param>
			/// <returns>Found child modelItem.</returns>
			if (idPath) {
				var searchId, foundChild, childItem, i;

				searchItemsList = searchItemsList || this.internal.childItems.getAllItems();
				idPath = Array.isArray(idPath) ? idPath.slice() : [idPath];
				searchId = idPath.shift();

				for (i = 0; i < searchItemsList.length; i++) {
					childItem = searchItemsList[i];

					if (childItem.Id() === searchId) {
						var searchItems = (childItem.ChildItems && childItem.ChildItems().getAllItems());
						foundChild = idPath.length ? this.getChildByIdPath(idPath, searchItems || []) : childItem;

						if (foundChild) {
							return foundChild;
						}
					}
				}
			}
		},

		isRegistered: function() {
			return this.datamodel.getItemById(this.Id()) === this;
		},

		registerItem: function() {
			if (!this.Parent || this.Parent.isRegistered()) {
				//if root item or if parent registered
				this.datamodel._registerItem(this);

				if (!this.isEmpty()) {
					this.ChildItems().registerItems();
				}
			}
		},

		unregisterItem: function() {
			this.datamodel._unregisterItem(this);
		},

		getProperty: function(/*String*/ propertyName, defaultValue) {
			if (!this.isEmpty()) {
				var itemProperty = this.internal.itemData.properties[propertyName];

				if (itemProperty) {
					return itemProperty.value;
				}
			}

			return defaultValue || '';
		},

		setRelatedItem: function(/*Object*/ modelItem) {
			if (!this.isEmpty()) {
				var itemProperties = this.internal.itemData.properties;
				var itemProperty = itemProperties['related_id'];
				var relatedItemId = modelItem ? (typeof modelItem === 'string' ? modelItem : modelItem.Id()) : '';

				this.SuspendNotifications();

				if (!itemProperty) {
					itemProperty = this.createEmptyProperty();
					itemProperties['related_id'] = itemProperty;
				}

				itemProperty.value = relatedItemId;
				itemProperty.state = Enums.PropertyStates.Modified;

				if (typeof modelItem === 'object') {
					itemProperty.relatedItem = modelItem;
					modelItem.Parent = this;
				} else {
					itemProperty.relatedItem = null;
				}

				this.setAttribute('action', 'edit');
				this.onChanged();

				this.ResumeNotifications();
			}
		},

		getRelatedItem: function() {
			if (!this.isEmpty()) {
				var relatedIdProperty = this.internal.itemData.properties['related_id'];

				return relatedIdProperty && relatedIdProperty.relatedItem;
			}
		},

		getRelatedItemProperty: function(propertyName) {
			var relatedItem = this.getRelatedItem();

			return relatedItem && relatedItem.getProperty(propertyName);
		},

		getRelatedItemId: function() {
			if (!this.isEmpty()) {
				var relatedIdProperty = this.internal.itemData.properties['related_id'];

				if (relatedIdProperty) {
					return relatedIdProperty.value || (relatedIdProperty.relatedItem && relatedIdProperty.relatedItem.Id());
				}
			}
		},

		//forceUpdateOldValue and oldValue parameters are optional
		setProperty: function(propertyName, propertyValue, lang, forceUpdateOldValue, oldValue) {
			if (propertyName && !this.isEmpty() && !this.isBlocked()) {
				var itemProperties = this.internal.itemData.properties;
				var itemProperty = itemProperties[propertyName];

				if (!itemProperty || itemProperty.value !== propertyValue || itemProperty.lang !== lang || forceUpdateOldValue) {
					this.SuspendNotifications();

					if (!itemProperty) {
						itemProperty = this.createEmptyProperty();
						itemProperties[propertyName] = itemProperty;
					}

					if ((itemProperty.state === Enums.PropertyStates.Default || forceUpdateOldValue) && propertyName === 'quantity') {
						itemProperty.oldValueIsSet = true;
						itemProperty.oldValue = forceUpdateOldValue ? oldValue : itemProperty.value;
					}

					itemProperty.value = propertyValue;
					itemProperty.lang = lang;
					itemProperty.state = Enums.PropertyStates.Modified;

					this.setAttribute('action', 'edit');
					this.onChanged();

					this.ResumeNotifications();
				}
			}
		},

		getAttribute: function(attributeName) {
			if (!this.isEmpty()) {
				return this.internal.itemData.attributes[attributeName];
			}
		},

		setAttribute: function(attributeName, attributeValue, optionalParameters) {
			optionalParameters = optionalParameters || {};
			if (attributeName && !this.isEmpty() && !this.isBlocked()) {
				var casedAttributeName = attributeName.charAt(0).toUpperCase() + attributeName.substring(1);
				var specialSetter = this['_set' + casedAttributeName + 'Attribute'];
				if (specialSetter) {
					specialSetter.apply(this, arguments);
				} else {
					var itemAttributes = this.internal.itemData.attributes;
					var currentValue = itemAttributes[attributeName];

					if (currentValue === undefined || (attributeValue !== currentValue)) {
						itemAttributes[attributeName] = attributeValue;
					}
				}

				if (!optionalParameters.skipOnChangedEvent) {
					this.onChanged();
				}
			}
		},

		_setActionAttribute: function(attributeName, attributeValue, optionalParameters) {
			if (attributeValue && !this.isEmpty()) {
				var currentAction = this.getAttribute(attributeName);
				var isNewItem = this.isNew();
				var isDeleted = this.isDeleted();
				var changeAllowed = true;

				optionalParameters = optionalParameters || {};

				if (!optionalParameters.forceUpdate) {
					switch (attributeValue) {
						case 'add':
							changeAllowed = !currentAction;
							break;
						case 'delete':
							changeAllowed = !isNewItem;

							if (changeAllowed && this.Parent) {
								this.Parent.setAttribute('itemStatus', 'updated');
							}
							break;
						case 'merge':
							changeAllowed = !isDeleted;
							break;
						case 'update':
							changeAllowed = !isNewItem && !isDeleted && currentAction !== 'edit';
							break;
						default:
							changeAllowed = !isNewItem && !isDeleted;
							break;
					}
				}

				if (changeAllowed) {
					this.internal.itemData.attributes[attributeName] = attributeValue;
					this.setAttribute('itemStatus');
				}
			}
		},

		_setItemStatusAttribute: function(attributeName, attributeValue) {
			var actionValue = this.getAttribute('action');
			var itemAttributes = this.internal.itemData.attributes;
			switch (actionValue) {
				case 'add':
					itemAttributes.itemStatus = 'new';
					break;
				case 'delete':
					itemAttributes.itemStatus = 'deleted';
					break;
				case 'edit':
				case 'update':
				case 'merge':
					itemAttributes.itemStatus = 'updated';
					break;
				default:
					if (attributeValue) {
						itemAttributes.itemStatus = attributeValue;
					}
					break;
			}
		},

		Id: function(/*String*/value) {
			if (value === undefined) {
				return this._id;
			}
			this.SuspendNotifications();
			this.setProperty('id', value);
			this.setAttribute('id', value);
			this._id = value;
			this.ResumeNotifications();
		},

		itemTypeSorter: function(firstItem, secondItem) {
			return 0;
		},

		addChildItem: function(targetItem, addPosition) {
			if (targetItem) {
				var childItems = this.internal.childItems;
				var targetParentItem = targetItem.Parent;

				if (targetParentItem && targetParentItem !== this) {
					targetParentItem.removeChildItem(targetItem);

					targetItem.setProperty('source_id', this.Id());
				}

				addPosition = addPosition || childItems.itemCount();
				childItems.insertAt(addPosition, targetItem);
			}
		},

		removeChildItem: function(targetItem) {
			if (targetItem) {
				var childItems = this.internal.childItems;
				var childIndex = childItems.index(targetItem);

				if (childIndex !== -1) {
					childItems.remove(childIndex, 1);
				}
			}
		},

		SuspendNotifications: function() {
			this.internal.notificationsSuspended++;
		},

		ResumeNotifications: function() {
			this.internal.notificationsSuspended--;

			if (!this.internal.notificationsSuspended && this.internal.notificationStopped) {
				this.NotifyChanged();
				this.internal.notificationStopped = false;
			}
		},

		isNew: function() {
			return this.getAttribute('action') === 'add';
		},

		isDeleted: function() {
			return this.getAttribute('action') === 'delete';
		},

		isParentDeleted: function() {
			return this.Parent ? (this.Parent.isDeleted() || this.Parent.isParentDeleted()) : false;
		},

		onChanged: function(sender) {
			this.isModified(true);
			this.NotifyChanged();
		},

		_onChildItemsChanged: function() {
			this.setAttribute('itemStatus', 'updated');
		},

		NotifyChanged: function() {
			if (this.internal.notificationsSuspended) {
				this.internal.notificationStopped = true;
			} else {
				this.raiseEvent('onItemChanged', this);
			}
		},

		processNotificationEvent: function(/*Object*/ notificationMessage) {
		}
	});

	return ModelItemClass;
});
