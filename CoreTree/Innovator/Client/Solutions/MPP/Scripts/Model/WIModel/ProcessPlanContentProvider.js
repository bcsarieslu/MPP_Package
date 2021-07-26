define([
	'dojo/_base/declare',
	'dojox/uuid/generateRandomUuid'
],
function(declare, generateRandomUuid) {
	return declare('Aras.Client.Controls.MPP.WIModel.ProcessPlanContentProvider', null, {
		referenceAttributeName: 'ref-id',
		aras: null,
		datamodel: null,
		_processPlanCache: {},
		rootProcessPlanId: null,

		constructor: function(inputArguments) {
			this.aras = inputArguments.aras;
			this.rootProcessPlanId = inputArguments.rootPlanId;
			this.datamodel = inputArguments.datamodel;
		},

		createDocumentFromXml: function(xmlContent) {
			if (xmlContent) {
				var resultDocument = new XmlDocument();

				resultDocument.preserveWhiteSpace = true;
				resultDocument.loadXML(xmlContent);

				if (this.aras.Browser.isIe()) {
					resultDocument.setProperty('SelectionNamespaces', 'xmlns="http://www.aras.com/MPP" xmlns:aras="http://aras.com/ArasTechDoc"');
				} else {
					resultDocument.documentElement.setAttribute('xmlns', 'http://www.aras.com/MPP');
					resultDocument.documentElement.setAttribute('xmlns:aras', 'http://aras.com/ArasTechDoc');
				}

				return resultDocument;
			}
		},

		loadProcessPlans: function(planIds, parameters) {
			planIds = planIds ? (Array.isArray(planIds) ? planIds : [planIds]) : [];
			parameters = (parameters && typeof parameters === 'object') ? parameters : {};

			if (planIds.length) {
				var requestItem = this.aras.newIOMItem('mpp_ProcessPlan', 'mpp_getWIProcessPlanStructure');
				var languageCode = parameters.language;
				var datamodel = this.datamodel;
				var clientPlanAmls = {};
				var processPlanModelitem, processPlanId, responceXmlDocument, documentXml, responceXml, i;

				// setup request parameters
				if (planIds.indexOf(this.rootProcessPlanId) > -1) {
					requestItem.setProperty('include_wi_details', this.rootProcessPlanId);
				}

				requestItem.setAttribute('language', languageCode);
				requestItem.setProperty('plan_ids', planIds.join(','));

				for (i = 0; i < planIds.length; i++) {
					processPlanId = planIds[i];
					processPlanModelitem = datamodel.getProcessPlan(processPlanId);

					if (processPlanModelitem) {
						clientPlanAmls[processPlanId] = processPlanModelitem.serializeToAml({fullHierarchy: true, expandRelated: true});
					}
				}

				if (Object.keys(clientPlanAmls).length > 0) {
					requestItem.setProperty('plan_amls', JSON.stringify(clientPlanAmls));
				}

				requestItem = requestItem.apply();

				if (requestItem.isError()) {
					this.aras.AlertError(requestItem.getErrorString());
				} else {
					var responcePlanXmls = JSON.parse(requestItem.getResult());
					var resultProcessPlans = {};
					var plansCache = this.getPlansCache();

					for (i = 0; i < planIds.length; i++) {
						processPlanId = planIds[i];
						responceXml = responcePlanXmls[processPlanId];

						if (responceXml) {
							documentXml = responcePlanXmls[processPlanId];
							responceXmlDocument = this.createDocumentFromXml(documentXml);

							plansCache[processPlanId] = {document: responceXmlDocument};
							resultProcessPlans[processPlanId] = responceXmlDocument;
						} else {
							delete plansCache[processPlanId];
						}
					}

					return resultProcessPlans;
				}
			}
		},

		updateProcessPlans: function(parameters) {
			var plansCache = this.getPlansCache();
			var planIds = Object.keys(plansCache);

			this.loadProcessPlans(planIds, parameters);
		},

		getProcessPlanDocument: function(processPlanId) {
			if (processPlanId) {
				var plansCache = this.getPlansCache();
				return plansCache[processPlanId] && plansCache[processPlanId].document;
			}
		},

		getPlansCache: function() {
			return this._processPlanCache;
		}
	});
});
