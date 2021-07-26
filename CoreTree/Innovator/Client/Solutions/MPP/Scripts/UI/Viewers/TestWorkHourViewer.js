define([
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin'
],
function(declare, _WidgetBase, _TemplatedMixin) {
	return declare('Aras.Innovator.Solutions.MPP.TestWorkHourViewer', [_WidgetBase, _TemplatedMixin], {
		templateString: '<iframe id="mbom_editor_frame" src="../Solutions/MPP/TestWorkHourEditor" frameborder="0" scrolling="auto"' +
			' style="width: 100%; height: 100%;"></iframe>',

		getSwitchOffButtonIds: function() {
			return ['mpp_show_testworkhour'];
		},

		getSwitchOffDisabledButtonIcons: function() {
			return ['../images/xClassificationOff.svg'];
		}
	});
});
