define([
	'MPP/Model/ModelEnums'
], function(ModelEnums) {
	var images = {
		0: '../../images/Folder.svg',
		4: '../../images/FormattedText.svg',
		32: '../../images/UnformattedText.svg',
		64: '../../images/List_2.svg',
		128: '../../images/ListItem.svg',
		256: '../../images/Image.svg',
		512: '../../images/ItemType.svg',
		1024: '../../images/Table.svg',
		2048: '../../images/TableRow.svg',
		4096: '../../images/TableCell.svg'
	};

	var imagesByName = {
		ProcessPlan: '../../images/ProcessPlan.svg',
		Operation: '../../images/ProcessOperation.svg',
		Step: '../../images/Step.svg',
		Part: '../../images/Part.svg',
		Phantom: '../../images/Phantom.svg',
		ProducedPart: '../../images/RightArrow.svg',
		Skill: '../../images/Skill.svg',
		Document: '../../images/Document.svg',
		Resource: 'blank',
		//Add by tengz 2019/6/5
		//ProcessPlan Tree 右键菜单,添加CAD图标
		CAD:'../../images/CAD.svg',
		Test:'../../images/ViewWorkflow.svg'
	};

	return {
		EditLevels: {
			FullAllow: 0,       // Document is locked by user; Language is current; Element don't placed in external block
			IgnoreExternal: 1,  // Document is locked by user; Language is current. On external block don't validate
			AllowExternal: 2,   // Document is locked by user; Language is current; Element placed in external block
			FullDeny: 4         // Document isn't locked by user; Language isn't current; Element placed in external block
		},

		XmlSchemaElementType: {
			Unknown: 0,
			SystemElement: 1,
			InteractiveElement: 2,
			Text: 4,
			String: 8,
			Block: 16,
			Mixed: 32,
			List: 64,
			ListItem: 128,
			Image: 256,
			Item: 512,
			Table: 1024,
			TableRow: 2048,
			TableCell: 4096
		},

		getImagefromType: function(type) {
			var enums = Object.keys(images);
			var number, i;

			for (i = 0; i < enums.length; i++) {
				number = parseInt(enums[i]);

				if (number && (type & number) === number) {
					return images[enums[i]];
				}
			}

			return images[this.XmlSchemaElementType.Unknown];
		},

		getImageFromName: function(elementName) {
			return imagesByName[elementName];
		},

		getElementNameFromModelType: function(modelItemType) {
			var modelItemTypes = ModelEnums.ModelItemTypes;

			switch (modelItemType) {
				case modelItemTypes.ProcessPlan:
					return 'ProcessPlan';
				case modelItemTypes.Operation:
					return 'Operation';
				case modelItemTypes.Step:
					return 'Step';
				case modelItemTypes.ConsumedPart:
					return 'Part';
				case modelItemTypes.Phantom:
					return 'Phantom';
				case modelItemTypes.OperationResource:
					return 'Resource';
				case modelItemTypes.OperationSkill:
					return 'Skill';
				case modelItemTypes.OperationDocument:
					return 'Document';
				//Add by tengz 2019/6/5
				//Process Plan workbench 里添加对象类
				case modelItemTypes.OperationCAD:
					return 'CAD';
				case modelItemTypes.OperationTest:
					return 'Test';
				default:
					return '';
			}
		},

		getModelTypeFromElementName: function(modelItemType) {
			var modelItemTypes = ModelEnums.ModelItemTypes;

			switch (modelItemType) {
				case 'ProcessPlan':
					return modelItemTypes.ProcessPlan;
				case 'Operation':
					return modelItemTypes.Operation;
				case 'Step':
					return modelItemTypes.Step;
				case 'Part':
					return modelItemTypes.ConsumedPart;
				case 'Phantom':
					return modelItemTypes.Phantom;
				case 'Resource':
					return modelItemTypes.OperationResource;
				case 'Skill':
					return modelItemTypes.OperationSkill;
				case 'Document':
					return modelItemTypes.OperationDocument;
				//Add by tengz 2019/6/5
				//ProcessPlan Tree 右键菜单添加对象类
				case 'CAD':
					return modelItemTypes.OperationCAD;
				case 'Test':
					return modelItemTypes.OperationTest;
				default:
					return modelItemTypes.Unknown;
			}
		},

		ElementContentType: {
			Common: 0,
			Static: 1,
			Dynamic: 2
		},

		ByReferenceType: {
			Unknown: 0,
			External: 1,
			Internal: 2
		},

		DisplayType: {
			Hidden: 0,
			Active: 1,
			Inactive: 2
		},

		ExternalTypes: {
			Block: 0,
			Image: 1,
			Link: 2,
			Item: 3
		},

		LinkTypes: {
			None: 0,
			ExternalDocument: 1,
			Url: 2
		},

		Directions: {
			Up: 0,
			Right: 1,
			Down: 2,
			Left: 3
		}
	};
});
