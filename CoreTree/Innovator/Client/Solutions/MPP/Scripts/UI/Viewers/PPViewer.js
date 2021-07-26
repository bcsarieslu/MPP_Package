define([
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin'
],
function(declare, _WidgetBase, _TemplatedMixin) {
	return declare('Aras.Innovator.Solutions.MPP.PPViewer', [_WidgetBase, _TemplatedMixin], {
		templateString: '<iframe id="pp_editor_frame" src="../Solutions/MPP/ProcessPlanEditor" frameborder="0" scrolling="auto"' +
			' style="width: 100%; height: 100%;"></iframe>',

		getSwitchOffButtonIds: function() {
			return ['mpp_show_pp_view'];
		},

		getSwitchOffDisabledButtonIcons: function() {
			return ['../images/ProcessPlanEditorOff.svg'];
		}
	});
});
