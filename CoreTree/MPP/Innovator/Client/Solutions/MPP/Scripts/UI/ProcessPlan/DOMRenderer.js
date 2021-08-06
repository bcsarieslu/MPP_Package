define([
	'dojo/_base/declare',
	'dojo/dom-construct',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/DOMRenderer',
	'MPP/UI/ProcessPlan/Rendering/RendererFactory'
],
function(declare, domConstruct, BaseDomRenderer, RendererFactory) {
	return declare('Aras.Client.Controls.MPP.UI.DOMRenderer', BaseDomRenderer, {
		constructor: function(args) {
			this._rendererFactory = new RendererFactory({viewmodel: this._viewmodel});
		}
	});
});
