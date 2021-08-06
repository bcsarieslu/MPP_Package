define([
	'dojo/_base/declare',
	'MPP/Model/WIModel/ArasDetailedXmlSchemaElement'
],
function(declare, ArasDetailedXmlSchemaElement) {
	return declare('Aras.Innovator.Solutions.MPP.WIModel.ArasOperationXmlSchemaElement', ArasDetailedXmlSchemaElement, {
		constructor: function(initialArguments) {
			this.internal.stepIterator = initialArguments.stepIterator || {
				lastNumber: 0,
				getNextNumber: function() {
					this.lastNumber += 1;
					return this.lastNumber;
				},
				dropIterator: function() {
					this.lastNumber = 0;
				}
			};

			this.registerType('ArasOperationXmlSchemaElement');
		},

		sortChilds: function() {
			var allChildren = this._childItems.List();
			var sortChildren = allChildren.splice(1, allChildren.length - 1);

			sortChildren.sort(this.childItemSorter);
			Array.prototype.push.apply(allChildren, sortChildren);
			this._childItems._RebuildIndexes();

			this.renumberSteps();
		},

		renumberSteps: function() {
			var numberIterator = this.internal.stepIterator;
			var allChildren = this._childItems.List();
			var currentChild, i;

			numberIterator.dropIterator();

			for (i = 0; i < allChildren.length; i++) {
				currentChild = allChildren[i];

				if (currentChild.is('ArasStepXmlSchemaElement')) {
					currentChild.assignNumber(numberIterator.getNextNumber());
				}
			}
		},

		referenceItemChangeHandler: function(modelItem) {
			this.ownerDocument.SuspendInvalidation();
			this.inherited(arguments);
			if (this.Parent) {
				this.Parent.sortChilds();
				this.Parent.NotifyChanged();
			}
			this.ownerDocument.ResumeInvalidation();
		}
	});
});
