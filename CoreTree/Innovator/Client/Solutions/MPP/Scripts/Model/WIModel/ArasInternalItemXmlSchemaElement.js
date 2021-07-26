define([
	'dojo/_base/declare',
	'dojox/uuid/generateRandomUuid',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/XmlSchemaElement'
],
function(declare, generateRandomUuid, XmlSchemaElement) {
	return declare('Aras.Innovator.Solutions.MPP.WIModel.ArasInternalItemXmlSchemaElement', XmlSchemaElement, {
		constructor: function(args) {
			this._aras = this.ownerDocument._aras;
			this.internal.isParsing = false;
			this.registerType('ArasInternalItemXmlSchemaElement');
		},

		parseOrigin: function() {
			this.internal.isParsing = true;

			// do not use aspect.before and aspect.after for avoid consuming memory
			if (!this.ownerDocument._isInvalidating) {
				this.ownerDocument.SuspendInvalidation();
			}

			this._parseOriginInternal();

			if (!this.ownerDocument._isInvalidating) {
				this.NotifyChanged();
				this.ownerDocument.ResumeInvalidation();
			}

			this.internal.isParsing = false;
		},

		_parseOriginInternal: function() {
			// linked item initialization
			var itemId = this.internal.uid.substring((this.internal.uidParentPrefix || this.internal.uidPrefix) ? this.internal.uid.lastIndexOf(':') + 1 : 0);

			this.removeModelEventListeners();
			this.internal.modelItem = this.ownerDocument.datamodel.getItemById(itemId);

			this.inherited(arguments);

			this.sortChilds();
		},

		_onChildItemsChanged: function() {
			this.sortChilds();
			this.inherited(arguments);
		},

		sortChilds: function() {
			var allChildren = this._childItems.List();

			allChildren.sort(this.childItemSorter);
			this._childItems._RebuildIndexes();
		},

		childItemSorter: function(firstElement, secondElement) {
			var compareResult = 0;

			if ((firstElement && firstElement.is('ArasInternalItemXmlSchemaElement')) &&
				(secondElement && secondElement.is('ArasInternalItemXmlSchemaElement'))) {
				var firstItem = firstElement.Item();
				var secondItem = secondElement.Item();

				if (firstItem && secondItem) {
					var firstType = firstItem.getType();
					var secondType = secondItem.getType();

					return firstType === secondType ? firstItem.itemTypeSorter(firstItem, secondItem) : firstType - secondType;
				}
			}

			return compareResult;
		},

		registerDocumentElement: function() {
			this.inherited(arguments);
			this.attachModelEventListeners();
		},

		unregisterDocumentElement: function() {
			this.removeModelEventListeners();
			this.inherited(arguments);
		},

		attachModelEventListeners: function() {
			var referencedModelItem = this.internal.modelItem;

			if (referencedModelItem) {
				referencedModelItem.addEventListener(this, null, 'onItemChanged', this.referenceItemChangeHandler);
			}
		},

		removeModelEventListeners: function() {
			var referencedModelItem = this.internal.modelItem;

			if (referencedModelItem) {
				referencedModelItem.removeEventListeners(this);
			}
		},

		isBlocked: function() {
			var referencedModelItem = this.internal.modelItem;

			if (referencedModelItem) {
				return referencedModelItem.isBlocked();
			}
		},

		isUpdatable: function() {
			return false;
		},

		isEmpty: function() {
			return !this.internal.modelItem;
		},

		Item: function(value) {
			if (value === undefined) {
				return this.internal.modelItem;
			}

			var itemId = value ? value.Id() : undefined;

			this.removeModelEventListeners();

			this.internal.modelItem = value;
			this.Attribute('aras:id', itemId);
			this._SetUid();

			if (this.isRegistered()) {
				this.attachModelEventListeners();
			}
		},

		getProperty: function(propertyName, defaultValue) {
			return this.isEmpty() ? (defaultValue || '') : this.internal.modelItem.getProperty(propertyName, defaultValue);
		},

		ItemAttribute: function(attributeName, newValue) {
			if (!this.isEmpty()) {
				if (newValue === undefined) {
					return this.internal.modelItem.getAttribute(attributeName);
				}

				this.internal.modelItem.setAttribute(attributeName, newValue);
			}
		},

		ItemId: function() {
			return this.ItemAttribute('id');
		},

		ItemType: function() {
			return this.ItemAttribute('type');
		},

		referenceItemChangeHandler: function(modelItem) {
			this.NotifyChanged();
		}
	});
});
