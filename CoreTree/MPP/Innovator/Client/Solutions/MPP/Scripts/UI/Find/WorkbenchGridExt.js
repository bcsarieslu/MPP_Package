define([
	'dojo/_base/declare',
	'MPP/UI/Find/FindControl',
	'dojo/_base/connect'
],
function(declare, FindControl, connect) {
	return declare(null, {

		findControl: null,

		_tgcEventHandlers: null,

		constructor: function() {
			var toolbarElement = document.getElementById('WorkbenchToolbar' + this.workbench.idPrefix);
			this.findControl = new FindControl(toolbarElement, this.workbench.isProcessPlanView, true);
			var findControl = this.findControl;
			this._tgcEventHandlers = [];
			this._tgcEventHandlers.push(connect.connect(this.grid_Experimental, 'refresh', this, function() {
				findControl.reset();
			}));
		},

		//TODO: need to remove _tgcEventHandlers in, e.g., destroy method to avoid memory leaks. But, for some reason. It's isn't called here.

		initXML: function() {
			this.findControl.reset();
			this.inherited(arguments);
			this.findControl.init(this);
			this.findControl.reload();
		}
	});
});
