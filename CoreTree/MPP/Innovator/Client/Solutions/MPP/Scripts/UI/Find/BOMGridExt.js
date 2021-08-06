define([
	'dojo/_base/declare',
	'MPP/UI/Find/FindControl',
	'dojo/_base/connect'
],
function(declare, FindControl, connect) {
	return declare(null, {

		findControl: null,

		constructor: function() {
			var toolbarElement = document.getElementById('toolbarContainer');
			this.findControl = new FindControl(toolbarElement, false, false);
		},

		initTree: function() {
			if (this._grid) {
				this.findControl.reset();
			}
		},

		createTree: function() {
			this.findControl.init(this._grid);
			this.findControl.reload();

			this.eventHandlers.push(connect.connect(this, 'onDataChanged', this, function() {
				this.findControl.reset();
			}));
		}
	});
});
