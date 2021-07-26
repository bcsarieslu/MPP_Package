define([
	'dojo/_base/declare',
	'MPP/Model/WIModel/ArasDetailedXmlSchemaElement'
],
function(declare, ArasDetailedXmlSchemaElement) {
	return declare('Aras.Innovator.Solutions.MPP.Model.WIModel.ArasStepXmlSchemaElement', ArasDetailedXmlSchemaElement, {
		constructor: function(args) {
			this.internal.assignedNumber = '';

			this.registerType('ArasStepXmlSchemaElement');
		},

		assignNumber: function(newNumber) {
			this.internal.assignedNumber = newNumber;
		},

		getAssignedNumber: function() {
			return this.internal.assignedNumber;
		},

		referenceItemChangeHandler: function() {
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
