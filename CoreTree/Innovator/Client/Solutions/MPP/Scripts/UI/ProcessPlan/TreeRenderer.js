define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/TreeRenderer',
	'MPP/UI/ProcessPlan/Rendering/RendererFactory'
],
function(declare, TDFTreeRenderer, RendererFactory) {
	return declare('Aras.Innovator.Solutions.MPP.UI.ProcessPlan.TreeRenderer', [TDFTreeRenderer], {
		constructor: function(args) {
			this._rendererFactory = new RendererFactory({viewmodel: this._viewmodel});
		}
	});
});
