define(['MPP/Model/PartConfig'], function(partConfig) {
	return {
		ModelItemTypes: {
			Unknown: 0,
			ProcessPlan: 10,
			ProcessPlanLocation: 15,
			Location: 16,
			Operation: 20,
			Step: 30,
			ConsumedPart: 40,
			Phantom: 41,
			Part: 42,
			OperationResource: 50,
			Resource: 51,
			Tool: 52,
			Machine: 53,
			OperationSkill: 60,
			Skill: 61,
			ProducedPart: 70,
			OperationDocument: 80,
			Document: 81,
			//Add by tengz 2019/6/4
			//ProcessPlan workbench里添加对象类
			OperationCAD:90,
			CAD:91,
			OperationTest:92,
			Test:93
		},

		getItemTypeFromModelType: function(elementType) {
			var itemTypes = this.ModelItemTypes;

			switch (elementType) {
				case itemTypes.ProcessPlan:
					return 'mpp_ProcessPlan';
				case itemTypes.ProcessPlanLocation:
					return 'mpp_ProcessPlanLocation';
				case itemTypes.Location:
					return 'mpp_Location';
				case itemTypes.Operation:
					return 'mpp_Operation';
				case itemTypes.Step:
					return 'mpp_Step';
				case itemTypes.ConsumedPart:
				case itemTypes.Phantom:
					return 'mpp_OperationConsumedPart';
				case itemTypes.Part:
					return partConfig.part_it_name;
				case itemTypes.OperationResource:
					return 'mpp_OperationResource';
				case itemTypes.Resource:
					return 'mpp_Resource';
				case itemTypes.Tool:
					return 'mpp_Tool';
				case itemTypes.Machine:
					return 'mpp_Machine';
				case itemTypes.OperationSkill:
					return 'mpp_OperationSkill';
				case itemTypes.Skill:
					return 'mpp_Skill';
				case itemTypes.ProducedPart:
					return 'mpp_ProcessPlanProducedPart';
				case itemTypes.OperationDocument:
					return 'mpp_OperationDocument';
				case itemTypes.Document:
					return 'Document';
				//Add by tengz 2019/6/4
				//Process Plan workbench 里添加对象类
				case itemTypes.CAD:
					return 'CAD';
				case itemTypes.OperationCAD:
					return 'mpp_OperationCAD';
				case itemTypes.Test:
					return 'mpp_Test';
				case itemTypes.OperationTest:
					return 'mpp_OperationTest';
				default:
					break;
			}
		},

		getElementTypeFromItemType: function(itemTypeName) {
			var itemTypes = this.ModelItemTypes;

			switch (itemTypeName) {
				case 'mpp_ProcessPlan':
					return itemTypes.ProcessPlan;
				case 'mpp_ProcessPlanLocation':
					return itemTypes.ProcessPlanLocation;
				case 'mpp_Location':
					return itemTypes.Location;
				case 'mpp_Operation':
					return itemTypes.Operation;
				case 'mpp_Step':
					return itemTypes.Step;
				case 'mpp_OperationConsumedPart':
					return itemTypes.ConsumedPart;
				case 'mpp_OperationResource':
					return itemTypes.OperationResource;
				case partConfig.part_it_name:
					return itemTypes.Part;
				case 'mpp_Resource':
					return itemTypes.Resource;
				case 'mpp_Tool':
					return itemTypes.Tool;
				case 'mpp_Machine':
					return itemTypes.Machine;
				case 'mpp_OperationSkill':
					return itemTypes.OperationSkill;
				case 'mpp_Skill':
					return itemTypes.Skill;
				case 'mpp_ProcessPlanProducedPart':
					return itemTypes.ProducedPart;
				case 'mpp_OperationDocument':
					return itemTypes.OperationDocument;
				case 'Document':
					return itemTypes.Document;
				//Add by tengz 2019/6/4
				//Process Plan workbench 里添加对象类
				case 'CAD':
					return itemTypes.CAD;
				case 'mpp_OperationCAD':
					return itemTypes.OperationCAD;
				case 'mpp_Test':
					return itemTypes.Test;
				case 'mpp_OperationTest':
					return itemTypes.OperationTest;
				default:
					break;
			}
		},

		getModelTypeFromWorkbenchType: function(workbenchType) {
			var itemTypes = this.ModelItemTypes;

			switch (workbenchType) {
				case 'Parts':
					return itemTypes.Part;
				case 'Tools':
					return itemTypes.Tool;
				case 'Machines':
					return itemTypes.Machine;
				case 'Documents':
					return itemTypes.Document;
				case 'Skills':
					return itemTypes.Skill;
				//Add by tengz 2019/6/4
				//Process Plan workbench 里添加对象类
				case 'CAD':
					return itemTypes.CAD;
				case 'Test':
					return itemTypes.Test;
				default:
					return itemTypes.Unknown;
			}
		},

		getItemTypeFromWorkbenchType: function(workbenchType) {
			switch (workbenchType) {
				case 'Parts':
					return partConfig.part_it_name;
				case 'Tools':
					return 'mpp_Tool';
				case 'Machines':
					return 'mpp_Machine';
				case 'Documents':
					return 'Document';
				case 'Skills':
					return 'mpp_Skill';
				//Add by tengz 2019/6/4
				//Process Plan workbench 里添加对象类
				case 'CAD':
					return 'CAD';
				case 'Test':
					return 'mpp_Test';
				default:
					break;
			}
		},

		PropertyStates: {
			Default: 0,
			Modified: 1,
			Deleted: 2
		},

		ItemAttributeNames: ['type', 'id', 'action', 'discover_only', 'itemStatus']
	};
});
