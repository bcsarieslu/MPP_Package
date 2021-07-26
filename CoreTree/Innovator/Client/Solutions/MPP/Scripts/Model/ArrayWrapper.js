define([
	'dojo/_base/declare'
],
function(declare) {
	var ArrayWrapper = declare('Aras.Client.Controls.MPP.Model.ArrayWrapper', null, {
		owner: null,
		aras: null,
		_items: null,
		_indexHash: null,

		constructor: function(args) {
			this.owner = args.owner;
			this.aras = this.owner && this.owner.aras;
			this._indexHash = [];

			this.initialize(args.array || []);
			this.suspended = false;
		},

		initialize: function(itemArray) {
			itemArray = Array.isArray(itemArray) ? itemArray : [];

			for (var i = 0; i < itemArray.length; i++) {
				itemArray[i].Parent = this.owner;
			}

			this._items = itemArray;
			this._RebuildIndexes();
		},

		getItem: function(itemIndex) {
			if (itemIndex > 0 && itemIndex < this.itemCount()) {
				return this._items[itemIndex];
			}
		},

		getAllItems: function() {
			return this._items.slice();
		},

		itemCount: function() {
			return this._items.length;
		},

		add: function(newItem) {
			this.insertAt(this.itemCount(), newItem);
		},

		addRange: function(elementsArray) {
			var itemsCount = elementsArray.itemCount();
			var i;

			if (itemsCount) {
				this._suspendEvents();

				for (i = 0; i < itemsCount; i++) {
					this.add(elementsArray.getItem(i));
				}

				this._resumeEvents();
				this.fireChangedEvent();
			}
		},

		clear: function() {
			this.unregisterItems();

			this._items.length = 0;

			this.fireChangedEvent();
		},

		remove: function(startIndex, deleteCount) {
			var itemsCount = this.itemCount();
			var result, removedItems;

			if (itemsCount) {
				startIndex = Math.min(Math.max(startIndex, 0), itemsCount - 1);
				deleteCount = (startIndex + deleteCount > itemsCount) ? itemsCount - startIndex : deleteCount;

				this._suspendEvents();

				//ctor of ArrayWrapper will update Parent of the spliced elements by setting null to it
				removedItems = this._items.splice(startIndex, deleteCount);
				result = new ArrayWrapper({owner: this.owner, array: removedItems});
				result.unregisterItems();

				this._resumeEvents();
				this.fireChangedEvent();
			}

			return result;
		},

		insertAt: function(itemIndex, newElement) {
			var itemsCount = this.itemCount();

			if (itemIndex >= 0 && itemIndex <= itemsCount) {
				this._suspendEvents();

				this._items.splice(itemIndex, 0, newElement);

				//set parent before registration, because registration need to make sure is parent registered or not
				newElement.Parent = this.owner;
				newElement.registerItem();

				this._resumeEvents();
				this.fireChangedEvent();
			} else {
				this.aras.AlertError(this.aras.getResource('../Modules/aras.innovator.TDF', 'helper.insert_out_range'));
			}
		},

		index: function(/*WrappedObject*/ targetElement) {
			var itemId = targetElement.Id();
			var itemIndex = this._indexHash[itemId];
			var i;

			if (isNaN(itemIndex)) {
				for (i = 0; i < this._items.length; i++) {
					if (this._items[i] === targetElement) {
						this._indexHash[itemId] = i;
						itemIndex = i;
						break;
					}
				}
			}

			return isNaN(itemIndex) ? -1 : itemIndex;
		},

		forEach: function(/*Function*/ handler) {
			var itemsCount = this.itemCount();
			var i;

			for (i = 0; i < itemsCount; i++) {
				handler(this._items[i]);
			}
		},

		registerItems: function() {
			this.forEach(function(element) {
				element.registerItem();
			});
		},

		unregisterItems: function() {
			this.forEach(function(element) {
				element.unregisterItem();
			});
		},

		_suspendEvents: function() {
			this.suspended = true;
		},

		_resumeEvents: function() {
			this.suspended = false;
		},

		_RebuildIndexes: function() {
			var element, i;

			this._indexHash.length = 0;
			for (i = 0; i < this._items.length; i++) {
				element = this._items[i];
				this._indexHash[element.Id()] = i;
			}
		},

		fireChangedEvent: function() {
			if (!this.suspended) {
				this._RebuildIndexes();
				this.onChanged(this);
			}
		},

		onChanged: function(sender) {
			sender.owner._onChildItemsChanged(sender);
		}
	});

	return ArrayWrapper;
});
