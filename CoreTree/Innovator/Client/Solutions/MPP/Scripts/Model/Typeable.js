define([
	'dojo/_base/declare'
],
function(declare) {
	return declare('Aras.Innovator.Solutions.MPP.Typeable', null, {
		constructor: function(args) {
			this._type = [];
			this._type.hash = {};

			this.registerType('Typeable');
		},

		registerType: function(typeName) {
			this._type.push(typeName);
			this._type.hash[typeName] = true;
		},

		is: function(typeName) {
			return Boolean(this._type.hash[typeName]);
		},

		getTypes: function() {
			return this._type.slice(0);
		}
	});
});
