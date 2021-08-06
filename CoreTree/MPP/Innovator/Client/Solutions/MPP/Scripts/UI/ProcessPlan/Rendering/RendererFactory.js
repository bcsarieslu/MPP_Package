define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/RendererFactory',
	'MPP/UI/ProcessPlan/Rendering/ModelItemElementRenderer'

],
function(declare, BaseRendererFactory, ModelItemElementRenderer) {
	return declare('Aras.Client.Controls.MPP.UI.Rendering.RendererFactory', BaseRendererFactory, {
		constructor: function(args) {
			var ctorArguments = {factory: this};
			this._instances.ModelItemElement = new ModelItemElementRenderer(ctorArguments);
		},

		_GetDefaultRenderer: function(renderObject) {
			switch (renderObject.nodeName) {
				case 'ProcessPlan':
				case 'Operation':
				case 'Part':
				case 'Step':
				case 'Resource':
				case 'Skill':
				case 'Document':
				//Add by tengz 2019/6/5
				//ProcessPlan Tree 里添加对象类
				case 'CAD':
				case 'Test':
					return this._GetRendererByObjectAndType(renderObject, 'ModelItemElement');
				case 'WorkInstructionDetails':
					return this._GetRendererByObjectAndType(renderObject, 'XmlSchemaElement');
				case 'List':
					return this._GetRendererByObjectAndType(renderObject, 'ArasListXmlSchemaElement');
				case 'Table':
					return this._GetRendererByObjectAndType(renderObject, 'ArasTableXmlSchemaElement');
				default:
					return this.inherited(arguments);
			}
		}
	});
});
