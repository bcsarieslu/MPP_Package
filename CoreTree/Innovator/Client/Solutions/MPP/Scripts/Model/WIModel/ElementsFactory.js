define([
	'dojo/_base/declare',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/XmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/XmlSchemaText',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/ArasBlockXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/ArasTextXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/ArasListXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/ArasListItemXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/ArasTableXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/_ArasTableXmlSchemaElement/ArasRowXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/_ArasTableXmlSchemaElement/ArasCellXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/ArasImageXmlSchemaElement',
	'MPP/Model/WIModel/ArasInternalItemXmlSchemaElement',
	'MPP/Model/WIModel/ArasProcessPlanXmlSchemaElement',
	'MPP/Model/WIModel/ArasOperationXmlSchemaElement',
	'MPP/Model/WIModel/ArasStepXmlSchemaElement',
	'MPP/Model/WIModel/ArasConsumedPartXmlSchemaElement',
	'TechDoc/Aras/Client/Controls/TechDoc/ViewModel/Aras/ArasItemXmlSchemaElement',
	'MPP/Model/WIModel/WIModelEnums'
],
function(declare,
	XmlSchemaElement,
	XmlSchemaText,
	ArasBlockXmlSchemaElement,
	ArasTextXmlSchemaElement,
	ArasListXmlSchemaElement,
	ArasListItemXmlSchemaElement,
	ArasTableXmlSchemaElement,
	ArasRowXmlSchemaElement,
	ArasCellXmlSchemaElement,
	ArasImageXmlSchemaElement,
	ArasInternalItemXmlSchemaElement,
	ArasProcessPlanXmlSchemaElement,
	ArasOperationXmlSchemaElement,
	ArasStepXmlSchemaElement,
	ArasConsumedPartXmlSchemaElement,
	ArasItemXmlSchemaElement,
	Enums
) {
	return declare('Aras.Innovator.Solutions.MPP.Model.WIElementsFactory', null, {
		ownerDocument: null,
		aras: null,

		constructor: function(args) {
			this.ownerDocument = args.viewmodel;
			this.aras = this.ownerDocument._aras;
		},

		CreateElement: function(type, args) {
			var constructorArguments = args || {};
			var contentHelper = this.ownerDocument.ContentGeneration();
			var schemaHelper = this.ownerDocument.Schema();
			var schemaElementTypes = Enums.XmlSchemaElementType;
			var nodeType, createdElement, elementOrigin, constructorName;

			switch (type) {
				case 'element':
					elementOrigin = constructorArguments.origin || contentHelper.ConstructElementOrigin(constructorArguments.type);

					if (elementOrigin) {
						nodeType = schemaHelper.GetSchemaElementType(elementOrigin.nodeName);

						if ((nodeType & schemaElementTypes.Block) === schemaElementTypes.Block) {
							constructorName = ArasBlockXmlSchemaElement;
						} else if ((nodeType & schemaElementTypes.Text) === schemaElementTypes.Text) {
							constructorName = ArasTextXmlSchemaElement;
						} else if ((nodeType & schemaElementTypes.ListItem) === schemaElementTypes.ListItem) {
							constructorName = ArasListItemXmlSchemaElement;
						} else if ((nodeType & schemaElementTypes.List) === schemaElementTypes.List) {
							constructorName = ArasListXmlSchemaElement;
						} else if ((nodeType & schemaElementTypes.Image) === schemaElementTypes.Image) {
							constructorName = ArasImageXmlSchemaElement;
						} else if ((nodeType & schemaElementTypes.Item) === schemaElementTypes.Item) {
							var isInternalItem = schemaHelper.getSchemaAttribute(elementOrigin.nodeName, 'internalitem') !== undefined;

							if (isInternalItem) {
								switch (elementOrigin.nodeName) {
									case 'ProcessPlan':
										constructorName = ArasProcessPlanXmlSchemaElement;
										break;
									case 'Operation':
										constructorName = ArasOperationXmlSchemaElement;
										break;
									case 'Step':
										constructorName = ArasStepXmlSchemaElement;
										break;
									case 'Part':
										constructorName = ArasConsumedPartXmlSchemaElement;
										break;
									default:
										constructorName = ArasInternalItemXmlSchemaElement;
										break;
								}
							} else {
								constructorName = ArasItemXmlSchemaElement;
							}
						} else if ((nodeType & schemaElementTypes.Table) === schemaElementTypes.Table) {
							constructorName = ArasTableXmlSchemaElement;
						} else if ((nodeType & schemaElementTypes.TableRow) === schemaElementTypes.TableRow) {
							constructorName = ArasRowXmlSchemaElement;
						} else if ((nodeType & schemaElementTypes.TableCell) === schemaElementTypes.TableCell) {
							constructorName = ArasCellXmlSchemaElement;
						} else {
							constructorName = XmlSchemaElement;
						}
					}

					break;
				case 'text':
					elementOrigin = constructorArguments.origin || this.origin.ownerDocument.createTextNode('');
					constructorName = XmlSchemaText;
					break;
				default:
					break;
			}

			if (elementOrigin && constructorName) {
				constructorArguments.ownerDocument = this.ownerDocument;
				constructorArguments.aras = this.aras;
				constructorArguments.origin = elementOrigin;

				// jscs: disable
				createdElement = new constructorName(constructorArguments);
				// jscs: enable

				//we need to create textnode manually for editable types
				if ((nodeType & (schemaElementTypes.Text | schemaElementTypes.String)) !== 0 && !createdElement.ChildItems().length()) {
					createdElement.origin.text = '';
				}

				createdElement.parseOrigin();
			}

			return createdElement;
		},

		CreateElementFromModelItem: function(modelItem) {
			if (modelItem) {
				var modelType = modelItem.getType();
				var elementName = Enums.getElementNameFromModelType(modelType);
				var newElement;

				newElement = elementName && this.CreateElement('element', {type: elementName});

				if (newElement) {
					newElement.Item(modelItem);
					return newElement;
				}
			}
		}
	});
});
