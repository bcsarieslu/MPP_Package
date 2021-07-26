define([
	'dojo/_base/declare',
	'MPP/Model/WIModel/ArasInternalItemXmlSchemaElement'
],
function(declare, ArasInternalItemXmlSchemaElement) {
	return declare('Aras.Innovator.Solutions.MPP.Model.ArasConsumedPartXmlSchemaElement', ArasInternalItemXmlSchemaElement, {
		constructor: function(args) {
			this.registerType('ArasConsumedPartXmlSchemaElement');
		},

		_getOriginToParse: function() {
			var modelItem = this.Item();

			if (modelItem && modelItem.isProducedPart()) {
				var processPlanId = modelItem.getRelatedProcessPlanId();
				var rootProcessPlanId = this.ownerDocument.getDocumentProperty('id');

				// added check on rootProcessPlanId, to avoid curcular references
				if (processPlanId !== rootProcessPlanId) {
					var processPlanOrigin = this.ownerDocument.getProcessPlanOrigin(processPlanId);

					this.origin.setAttribute('haveProcessPlan', 'true');

					if (processPlanOrigin && this.origin.getAttribute('isPlanLoaded') !== 'true') {
						this.origin.appendChild(processPlanOrigin.cloneNode(true));
						this.origin.setAttribute('isPlanLoaded', 'true');
					}
				}
			}

			return this.origin;
		},

		referenceItemChangeHandler: function(modelItem) {
			this.Parent.NotifyChanged();
		}
	});
});
