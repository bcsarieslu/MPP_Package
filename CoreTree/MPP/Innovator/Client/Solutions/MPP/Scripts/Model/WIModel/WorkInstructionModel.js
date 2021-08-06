define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/StructuredDocument',
	'MPP/Model/WIModel/ElementsFactory',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/ViewModelSelection',
	'TechDoc/Aras/Client/Controls/TechDoc/Helper/ContentGenerationHelper',
	'TechDoc/Aras/Client/Controls/TechDoc/Helper/ExternalBlockHelper',
	'TechDoc/Aras/Client/Controls/TechDoc/Helper/TableHelper',
	'TechDoc/Aras/Client/Controls/TechDoc/Helper/ExternalContentHelper',
	'TechDoc/Aras/Client/Controls/TechDoc/Helper/Clipboard',
	'MPP/Model/WIModel/ProcessPlanContentProvider',
	'MPP/Model/WIModel/Actions/ActionsHelper',
	'MPP/Model/WIModel/WIModelEnums',
	'MPP/Model/PartConfig'
],
function(declare,
	TechDocStructuredDocument,
	ElementsFactory,
	ViewModelSelection,
	ContentGenerationHelper,
	ExternalBlockHelper,
	TableHelper,
	ExternalContentHelper,
	Clipboard,
	PlanContentProvider,
	ActionsHelper,
	Enums,
	PartConfig
) {
	return declare('Aras.Innovator.Solutions.MPP.Model.WorkInstructionModel', TechDocStructuredDocument, {
		_elementsFactory: null,

		constructor: function(args) {
		},

		postCreate: function(inputArguments) {
			var rootPlanId = this._item.getAttribute('id');
			var defaultLanguageCode = inputArguments.defaultLanguage || 'en';
			var currentLanguageCode = inputArguments.currentLanguage;

			this._defaultLanguageCode = defaultLanguageCode || currentLanguageCode;
			this._currentLanguageCode = currentLanguageCode || defaultLanguageCode;
			this._item = this._item.cloneNode(true);
			this.datamodel = inputArguments.datamodel;
			this.uiUtils = inputArguments.uiUtils;
			this.enums = Enums;
			this.partConfig = PartConfig;

			this._externalBlockHelper = new ExternalBlockHelper({viewmodel: this});
			this.tableHelper = new TableHelper({viewmodel: this});
			this.selection = new ViewModelSelection({viewmodel: this});
			this._externalHelper = new ExternalContentHelper({viewmodel: this});
			this._clipboardHelper = new Clipboard({aras: this._aras});
			this._actionsHelper = new ActionsHelper({viewmodel: this, datamodel: this.datamodel, clipboard: this._clipboardHelper, aras: this._aras});
			this._elementsFactory = new ElementsFactory({viewmodel: this});
			this._planContentProvider = new PlanContentProvider({aras: this._aras, rootPlanId: rootPlanId, datamodel: this.datamodel});
			this._InitializeStructureDocument(this.DefaultLanguageCode());

			this.attachDataModelListeners();
		},

		attachDataModelListeners: function() {
			this.datamodel.addEventListener(this, null, 'onDeleteItem', this.onDeleteModelItemHandler);
			this.datamodel.addEventListener(this, null, 'onNewItem', this.onNewModelItemHandler);
			this.datamodel.addEventListener(this, null, 'onProcessPlanRegistered', this.onProcessPlanRegistered);
			this.datamodel.addEventListener(this, null, 'onProcessPlanHashChanged', this.onProcessPlanHashChanged);
		},

		removeDataModelListeners: function() {
			this.datamodel.removeEventListeners(this);
		},

		onDeleteModelItemHandler: function(deletedItem) {
			if (deletedItem.isNew()) {
				var foundElements = this.GetElementsByUid(deletedItem.Id());

				if (foundElements.length) {
					var currentElement, parentElement, allSiblings, itemIndex, i;

					for (i = 0; i < foundElements.length; i++) {
						currentElement = foundElements[i];
						parentElement = currentElement.Parent;
						allSiblings = parentElement.ChildItems();
						itemIndex = allSiblings.index(currentElement);

						allSiblings.splice(itemIndex, 1);
					}
				}
			}
		},

		onNewModelItemHandler: function(newItem, parentItem, skipSelection) {
			var foundElements = this.GetElementsByUid(parentItem.Id());

			if (foundElements.length) {
				var addedElements = [];
				var currentElement, newElement, i;

				for (i = 0; i < foundElements.length; i++) {
					currentElement = foundElements[i];
					newElement = this._elementsFactory.CreateElementFromModelItem(newItem);

					if (newElement) {
						currentElement.ChildItems().add(newElement);
						addedElements.push(newElement);
					}
				}

				if (!skipSelection && addedElements.length === 1) {
					this.focusElement(addedElements[0]);
				}
			}
		},

		onProcessPlanRegistered: function(processPlanItem) {
			if (!this.datamodel.isLoading) {
				var producedPartItem = processPlanItem.getProducedPart();
				var processPlanId = processPlanItem.Id();

				this._planContentProvider.loadProcessPlans(processPlanId);

				if (producedPartItem) {
					var producedPartId = producedPartItem.Id();
					var allElements = this._allByIndex;
					var currentElement, partItem, relatedItem, i;

					for (i = 0; i < allElements.length; i++) {
						currentElement = allElements[i];

						if (currentElement.is('Part')) {
							partItem = currentElement.Item();
							relatedItem = partItem && partItem.getRelatedItem();

							if (relatedItem && relatedItem.Id() === producedPartId) {
								currentElement.parseOrigin();
							}
						}
					}
				}
			}
		},

		onProcessPlanHashChanged: function(partIds) {
			if (partIds.length) {
				var foundElementsHash = {};
				var foundElements, consumedPartItems, currentElement, consumedId, partId, parentElement, elementId,
					isTopLevel, allChildren, childItems, childElement, i, j, k;

				this.SuspendInvalidation();
				for (i = 0; i < partIds.length; i++) {
					partId = partIds[i];
					consumedPartItems = this.datamodel.getItemsByRelatedId(partId);

					for (j = 0; j < consumedPartItems.length; j++) {
						consumedId = consumedPartItems[j].Id();
						foundElements = this.GetElementsByUid(consumedId);

						if (foundElements.length) {
							for (k = 0; k < foundElements.length; k++) {
								currentElement = foundElements[k];
								elementId = currentElement.Id();
								foundElementsHash[elementId] = currentElement;
							}
						}
					}
				}

				// update only top-level elements
				for (elementId in foundElementsHash) {
					currentElement = foundElementsHash[elementId];
					parentElement = currentElement.Parent;
					isTopLevel = true;

					while (parentElement) {
						if (foundElementsHash[parentElement.Id()]) {
							isTopLevel = false;
							break;
						}

						parentElement = parentElement.Parent;
					}

					// if current item is top level, then cleanup origin from ProcessPlan nodes and parse again
					if (isTopLevel) {
						childItems = currentElement.ChildItems();
						allChildren = childItems.List();

						for (i = allChildren.length - 1; i >= 0; i--) {
							childElement = allChildren[i];

							if (childElement.is('ProcessPlan')) {
								childItems.splice(i, 1);
							}
						}

						currentElement.Attribute('haveProcessPlan', null);
						currentElement.Attribute('isPlanLoaded', null);
						currentElement.parseOrigin();

						this.onPlanRefreshed(currentElement.Id());
					}
				}

				this.ResumeInvalidation();
			}
		},

		_InitializeStructureDocument: function(langCode) {
			this._aras.setItemProperty(this._item, 'xml_schema', 'A8137FCA2D7C4E22833E6BD2359A891C');

			this._ResetSelectionAndCursor();
			this._SetOriginForStructureDocument();
			this._InitializeXmlSchema();
			this._SetDomForStructureDocument();

			if (!this._multilangcache[langCode]) {
				this._multilangcache[langCode] = {domObject: this.Dom(), xmlDomOrigin: this.origin};
			}
		},

		_SetDomForStructureDocument: function() {
			var languageCode = this._currentLanguageCode;
			var cachedData = this._multilangcache[languageCode];
			var processPlanElement = (cachedData && cachedData.domObject) || this.getProcessPlanElement(this._item.getAttribute('id'));
			var oldRootElement = this.Dom();

			if (oldRootElement) {
				processPlanElement.Id(oldRootElement.Id());
			}

			this.Dom(processPlanElement);
		},

		getProcessPlanOrigin: function(processPlanId) {
			var processPlanDocument = this._planContentProvider.getProcessPlanDocument(processPlanId);

			return processPlanDocument && processPlanDocument.documentElement.selectSingleNode('aras:content').firstChild;
		},

		getProcessPlanElement: function(processPlanId) {
			var processPlanDocument = this._planContentProvider.getProcessPlanDocument(processPlanId);

			if (processPlanDocument) {
				return this.CreateElement('element', {origin: processPlanDocument.documentElement.selectSingleNode('aras:content').firstChild});
			}
		},

		_PrepareDomByOrigin: function(newOrigin) {
			var rootBlockOriginNode = newOrigin.selectSingleNode('aras:content').firstChild;

			return this.CreateElement('element', {origin: rootBlockOriginNode});
		},

		CreateElement: function(type, args) {
			return this._elementsFactory.CreateElement(type, args);
		},

		ElementsFactory: function() {
			return this._elementsFactory;
		},

		Reload: function(newItem) {
			var languageCode = this._currentLanguageCode;
			var newRootPlanId = newItem.getAttribute('id');
			var newPlanDocument, newOrigin, newDom;

			this._item = newItem.cloneNode(true);
			this._planContentProvider.rootProcessPlanId = newRootPlanId;
			this._planContentProvider.updateProcessPlans({language: languageCode});

			newPlanDocument = this._planContentProvider.getProcessPlanDocument(newRootPlanId);

			this._externalHelper.DropProvider(languageCode);
			this._externalHelper.UpdateProvider(languageCode, newPlanDocument);

			newDom = this.getProcessPlanElement(newRootPlanId);
			newOrigin = newPlanDocument.documentElement;

			this._contentGenerationHelper.clearCache();
			this._contentGenerationHelper.updateCacheFromOrigin(languageCode, newPlanDocument);

			this._multilangcache[languageCode] = {domObject: newDom, xmlDomOrigin: newOrigin};
			this._InitializeStructureDocument(languageCode);
		},

		_GetDocumentXmlDomFromServer: function(langCode, blockId) {
			var processPlanId = blockId || this._item.getAttribute('id');

			this._planContentProvider.loadProcessPlans(processPlanId, {language: langCode});
			return this._planContentProvider.getProcessPlanDocument(processPlanId);
		},

		saveDocumentXml: function(documentXml, languageCode, skipPropertyUpdate) {
			var prevDocumentXml = this._savedDocumentXml[languageCode];

			if (documentXml && prevDocumentXml) {
				if (prevDocumentXml.length !== documentXml.length || prevDocumentXml !== documentXml) {
					if (!skipPropertyUpdate) {
						var wiDom = new XmlDocument();
						var processPlanNode;

						wiDom.preserveWhiteSpace = true;
						wiDom.loadXML(documentXml);

						processPlanNode = wiDom.documentElement.selectSingleNode('aras:content/aras:block/ProcessPlan');
						this._aras.setItemProperty(this._item, 'work_instruction_content', processPlanNode.xml);
					}

					this._savedDocumentXml[languageCode] = documentXml;
				}
			} else {
				this._savedDocumentXml[languageCode] = documentXml;
			}
		},

		IsEqualEditableLevel: function(levelType) {
			return this._aras.isEditStateEx(this._item);
		},

		setLanguage: function(languageCode) {
			this._currentLanguageCode = languageCode;
		},

		setEditState: function(isEditState) {
			this._aras.setItemEditStateEx(this._item, isEditState);
		}
	});
});
