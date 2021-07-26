define([
	'dojo/_base/declare',
	'MPP/Model/WIModel/ArasInternalItemXmlSchemaElement'
],
function(declare, ArasInternalItemXmlSchemaElement) {
	return declare('Aras.Innovator.Solutions.MPP.WIModel.ArasProcessPlanXmlSchemaElement', ArasInternalItemXmlSchemaElement, {
		constructor: function(initialArguments) {
			this.registerType('ArasProcessPlanXmlSchemaElement');
		},

		sortChilds: function() {
			this.inherited(arguments);
		}
	});
});
