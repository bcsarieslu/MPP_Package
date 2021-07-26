define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/DOMRenderer',
	'MPP/UI/ProcessPlan/Publishing/RendererFactory'
],
function(declare, BaseDomRenderer, RendererFactory) {
	return declare('Aras.Client.Controls.MPP.Publishing.DOMRenderer', BaseDomRenderer, {
		constructor: function(args) {
			this._rendererFactory = new RendererFactory({viewmodel: this._viewmodel});
		}
	});
});
