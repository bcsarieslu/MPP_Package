define([
	'dojo/_base/declare',
	'MPP/Model/WIModel/ArasInternalItemXmlSchemaElement'
],
function(declare, ArasInternalItemXmlSchemaElement) {
	return declare('Aras.Innovator.Solutions.MPP.Model.WIModel.ArasDetailedXmlSchemaElement', ArasInternalItemXmlSchemaElement, {
		constructor: function(args) {
			this.internal.detailsElement = null;
			this.internal.detailsPropertyName = 'wi_details';
			this.registerType('ArasDetailedXmlSchemaElement');
		},

		updateContentProperty: function() {
			var internalData = this.internal;

			if (!internalData.isContentPropertyUpdating) {
				internalData.isContentPropertyUpdating = true;

				if (!this.isEmpty()) {
					var detailsOrigin = internalData.detailsElement.origin;
					var currentChildNode = detailsOrigin.firstChild;
					var modelItem = internalData.modelItem;
					var savedContent = modelItem.getProperty(internalData.detailsPropertyName) || '';
					var currentDetailsContent = '';
					var initialReferences = internalData.initialReferences;
					var currentReferences = this.getReferenceIdHash(true);
					var externalElement, referenceId;

					while (currentChildNode) {
						currentDetailsContent += currentChildNode.xml;
						currentChildNode = currentChildNode.nextSibling;
					}

					if ((savedContent.length !== currentDetailsContent.length) || (currentDetailsContent !== savedContent)) {
						modelItem.setProperty(internalData.detailsPropertyName, currentDetailsContent, this.ownerDocument.CurrentLanguageCode());
					}

					for (referenceId in currentReferences) {
						if (!initialReferences[referenceId]) {
							externalElement = currentReferences[referenceId];

							if (externalElement.is('ArasImageXmlSchemaElement') && modelItem.addImageReference) {
								modelItem.addImageReference(referenceId, externalElement.ImageId());
								initialReferences[referenceId] = true;
							}
						}
					}

					this.attachUpdateContentHandlers();
				}

				this.internal.isContentPropertyUpdating = false;
			}
		},

		_parseOriginInternal: function() {
			this.inherited(arguments);

			// search wiDetails element
			this.internal.detailsElement = this._childItems.get(0);
			this.internal.initialReferences = this.getReferenceIdHash();
		},

		getReferenceIdHash: function(withElements) {
			var detailsElement = this.internal.detailsElement;
			var resultHash = {};

			if (detailsElement) {
				var allChildren = detailsElement.getAllChilds();
				var currentChild, i;

				for (i = 0; i < allChildren.length; i++) {
					currentChild = allChildren[i];

					if (currentChild.is('XmlSchemaExternalElement')) {
						resultHash[currentChild.ReferenceId()] = withElements ? currentChild : true;
					}
				}
			}

			return resultHash;
		},

		assignNumber: function(newNumber) {
			this.internal.assignedNumber = newNumber;
		},

		registerDocumentElement: function() {
			this.attachUpdateContentHandlers();
			this.inherited(arguments);
		},

		unregisterDocumentElement: function() {
			this.removeUpdateContentHandlers();
			this.inherited(arguments);
		},

		attachUpdateContentHandlers: function() {
			var allContentChildren = this.internal.detailsElement.getAllChilds();
			var self = this;
			var modifiedChangeHandler = function() {
				self.updateContentProperty();
				this.internal.originNotifyChangedMethod();
			};
			var childItem, i;

			for (i = 0; i < allContentChildren.length; i++) {
				childItem = allContentChildren[i];

				if (!childItem.internal.operationHandlerAttached) {
					childItem.internal.originNotifyChangedMethod = childItem.NotifyChanged.bind(childItem);
					childItem.internal.operationHandlerAttached = true;

					childItem.NotifyChanged = modifiedChangeHandler;
				}
			}
		},

		removeUpdateContentHandlers: function() {
			var allContentChildren = this.internal.detailsElement.getAllChilds();
			var childItem, i;

			for (i = 0; i < allContentChildren.length; i++) {
				childItem = allContentChildren[i];

				if (childItem.internal.operationHandlerAttached) {
					childItem.NotifyChanged = childItem.internal.originNotifyChangedMethod;

					delete childItem.internal.originNotifyChangedMethod;
					childItem.internal.operationHandlerAttached = false;
				}
			}
		},

		NotifyChanged: function() {
			this.inherited(arguments);

			if (!this.internal.isParsing) {
				this.updateContentProperty();
			}
		}
	});
});
