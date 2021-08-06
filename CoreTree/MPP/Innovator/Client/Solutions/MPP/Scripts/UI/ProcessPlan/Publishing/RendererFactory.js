define([
	'dojo/_base/declare',
	'MPP/UI/ProcessPlan/Rendering/RendererFactory',
	'MPP/UI/ProcessPlan/Publishing/PublisingImageXmlSchemaElementRenderer'
],
function(declare, BaseRendererFactory, PublisingImageXmlSchemaElementRenderer) {
	return declare('Aras.Client.Controls.MPP.Publishing.RendererFactory', BaseRendererFactory, {
		constructor: function(args) {
			var ctorArguments = {factory: this};
			this._instances.ArasImageXmlSchemaElement = new PublisingImageXmlSchemaElementRenderer(ctorArguments);
		}
	});
});
