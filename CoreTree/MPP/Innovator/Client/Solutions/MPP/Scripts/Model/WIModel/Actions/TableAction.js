define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/Action/TableAction'
],
function(declare, BaseTableAction) {
	return declare('Aras.Client.Controls.MPP.Action.TableAction', BaseTableAction, {
		getCreateSiblingMenu: function(/*WrappedObject*/ targetElement) {
			if (targetElement.is('ArasRowXmlSchemaElement')) {
				return [
					{id: 'table:appendrow', name: this.aras.getResource('../Modules/aras.innovator.TDF', 'contextmenu.row'), icon: '../../images/TableRow.svg'}
				];
			}
		}
	});
});
