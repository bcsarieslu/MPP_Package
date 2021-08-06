define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/UI/Rendering/ArasImageXmlSchemaElementRenderer'
],
function(declare, ArasImageXmlSchemaElementRenderer) {
	return declare('Aras.Client.Controls.TechDoc.UI.Rendering.ArasImageXmlSchemaElementRenderer', ArasImageXmlSchemaElementRenderer, {
		_aras: null,

		constructor: function(args) {
			this._aras = args.factory._viewmodel._aras;
			this._imageplaceholder = this._aras.getResource('../Modules/aras.innovator.TDF', 'rendering.imageplaceholder');
		},

		RenderInnerContent: function(schemaElement, elementState) {
			var out = '';

			if (elementState.isEmpty) {
				out += '<div class="ArasElementPlaceholder">' + this._imageplaceholder + '</div>';
			} else if (elementState.isBlocked) {
				out += 'Content is blocked';
			} else {
				var imageSrc = schemaElement.Src();
				out += '<img src="' + imageSrc + '"/>';
			}

			return out;
		}
	});
});
