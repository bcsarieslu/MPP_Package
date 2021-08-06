define([
	'dojo/_base/declare',
	'MPP/Model/Eventable',
	'MPP/Model/ModelActions/ActionsHelper',
	'MPP/Model/ModelElementFactory',
	'MPP/Model/ModelEnums'
],
function(declare, Eventable, ActionsHelper, ElementFactory, Enums) {
	return declare('Aras.Innovator.Solutions.MPP.Model.Model', Eventable, {
		aras: null,
		_item: null,
		_currentUser: null,
		_rootProcessPlanId: null,
		data: null,
		actionsHelper: null,
		filterParameters: null,
		isLoading: null,

		constructor: function(initialArguments) {
			initialArguments = initialArguments || {};

			this.aras = initialArguments.aras;
			this._item = initialArguments.item;
			this._rootProcessPlanId = this._item && this._item.getAttribute('id');
			this._currentUser = this.aras && this.aras.getUserID();

			this.data = {
				all: {},
				track: {},
				changes: {},
				producedPartHash: {},
				processPlans: {},
				typeDescriptors: {},
				alternateParts: {}
			};
			this.filterParameters = {};

			this.postCreate();
		},

		setFilterParameter: function(parameterName, parameterValue, skipHashUpdate) {
			if (parameterName && this.filterParameters[parameterName] !== parameterValue) {
				this.filterParameters[parameterName] = parameterValue;

				if (!skipHashUpdate) {
					this.updateProcessPlansHash();
				}
			}
		},

		setUIUtils: function(UIUtils) {
			this.actionsHelper.UIUtils = UIUtils;
		},

		updateProcessPlansHash: function(partIds) {
			partIds = partIds ? (Array.isArray(partIds) ? partIds : [partIds]) : Object.keys(this.data.producedPartHash);

			if (partIds.length) {
				var plandIds = this.requestProcessPlanIdsForParts(partIds);
				var existingPlanHash = this.data.producedPartHash;
				var changedPartIds = [];
				var partId, existingPlans, newPlans, i, j, isPlansChanged;

				for (i = 0; i < partIds.length; i++) {
					partId = partIds[i];
					isPlansChanged = false;

					existingPlans = existingPlanHash[partId] || [];
					newPlans = plandIds[partId] || [];

					if (newPlans.length === existingPlans.length) {
						for (j = 0; j < existingPlans.length; j++) {
							if (newPlans[j].planId !== existingPlans[j].planId) {
								isPlansChanged = true;
								break;
							}
						}
					} else {
						isPlansChanged = true;
					}

					this.data.producedPartHash[partId] = plandIds[partId];

					if (isPlansChanged) {
						changedPartIds.push(partId);
					}
				}

				this.raiseEvent('onProcessPlanHashChanged', changedPartIds);
			}
		},

		loadStashedProcessPlans: function(targetPlanItem) {
			var stashedData = targetPlanItem && this.aras.getItemProperty(targetPlanItem, 'clientChanges');
			var loadedProcessPlans = {};

			if (stashedData) {
				var processPlanAMLs = JSON.parse(stashedData);
				var planDocument = new XmlDocument();
				var partIdsHash = {};
				var processPlanId, planAML, planModelItem, producedParts, consumedParts, partId, j;

				for (processPlanId in processPlanAMLs) {
					planAML = processPlanAMLs[processPlanId];
					planDocument.loadXML(planAML);

					planModelItem = this.elementFactory.createElementFromItemNode(planDocument.documentElement);
					planModelItem.isModified(true);

					this.registerProcessPlan(planModelItem);
					loadedProcessPlans[processPlanId] = planModelItem;

					// searching for parts in loaded process plans
					producedParts = planModelItem.getAllChildren(null, Enums.ModelItemTypes.ProducedPart);
					consumedParts = planModelItem.getAllChildren(null, Enums.ModelItemTypes.Part);

					for (j = 0; j < producedParts.length; j++) {
						partId = producedParts[j].getRelatedItemId();
						partIdsHash[partId] = true;
					}

					for (j = 0; j < consumedParts.length; j++) {
						partId = consumedParts[j].Id();
						partIdsHash[partId] = true;
					}
				}

				// update ProcessPlan ids for nested parts
				this.updateProcessPlansHash(Object.keys(partIdsHash));
			}

			return loadedProcessPlans;
		},

		Reload: function(targetItem) {
			this.isLoading = true;

			if (targetItem) {
				var newRootProcessPlanId = targetItem.getAttribute('id');
				var registeredPlans = this.data.processPlans;
				var currentRootProcessPlan = registeredPlans[this._rootProcessPlanId];
				var reloadCandidates = {};
				var isRootRefreshRequired, loadedProcessPlans, planId, planModelItem;

				if (newRootProcessPlanId === this._rootProcessPlanId) {
					isRootRefreshRequired = !currentRootProcessPlan || !currentRootProcessPlan.isModified();
				} else {
					if (currentRootProcessPlan) {
						currentRootProcessPlan.unregisterItem();
					}
					isRootRefreshRequired = true;
				}

				this._item = targetItem;
				this._rootProcessPlanId = newRootProcessPlanId;

				// include root planId in reload candidates
				if (isRootRefreshRequired) {
					reloadCandidates[newRootProcessPlanId] = true;
				}

				// put only unchanged plan ids in candidates
				for (planId in registeredPlans) {
					planModelItem = registeredPlans[planId];

					if (!planModelItem.isModified()) {
						reloadCandidates[planId] = true;
					}
				}

				loadedProcessPlans = this.loadProcessPlans(Object.keys(reloadCandidates), isRootRefreshRequired && this._rootProcessPlanId);

				if (!isRootRefreshRequired) {
					// in this case manually refresh process plans hash
					this.updateProcessPlansHash();
				}

				for (planId in reloadCandidates) {
					planModelItem = loadedProcessPlans[planId];

					if (planModelItem) {
						this.registerProcessPlan(loadedProcessPlans[planId]);
					} else {
						// if plan wasn't loaded, then it's allready deleted or permissions has changed
						// and we also should removeit from the model
						planModelItem = this.getProcessPlan(planId);

						if (planModelItem) {
							planModelItem.unregisterItem();
						}
					}
				}

				if (loadedProcessPlans[this._rootProcessPlanId]) {
					const newEditableState = this.aras.isEditStateEx(targetItem);
					const previousEditableState = Boolean(this.isEditable());
					if (newEditableState !== previousEditableState) {
						this.setEditState(this.aras.isEditStateEx(targetItem));
					}
				}

				this.refreshPartAlternates(this.rootProcessPlan);
			}

			this.isLoading = false;
		},

		refreshPartAlternates: function(targetProcessPlan) {
			if (targetProcessPlan) {
				var partIdsHash = {};
				var producedPart = targetProcessPlan.getProducedPart();
				var consumedParts, partId, alternateParts, i;

				// searching alternates for consumed parts
				consumedParts = targetProcessPlan.getAllChildren(null, Enums.ModelItemTypes.Part);

				for (i = 0; i < consumedParts.length; i++) {
					partId = consumedParts[i].Id();
					partIdsHash[partId] = true;
				}

				alternateParts = this.requestAlternateParts(producedPart && producedPart.Id(), Object.keys(partIdsHash));

				for (partId in alternateParts) {
					this.data.alternateParts[partId] = alternateParts[partId].slice();
				}
			}
		},

		dropModifiedStates: function(processPlanId) {
			var registeredPlans = this.data.processPlans;
			var processPlanIds = processPlanId ? (Array.isArray(processPlanId) ? processPlanId : [processPlanId]) : Object.keys(registeredPlans);
			var planId, i;

			for (i = 0; i < processPlanIds.length; i++) {
				planId = processPlanIds[i];

				if (registeredPlans[planId]) {
					registeredPlans[planId].isModified(false);
					delete this.data.changes[planId];
				}
			}
		},

		getRegisteredProcessPlans: function() {
			var registeredPlans = this.data.processPlans;
			var foundPlans = [];
			var planId;

			for (planId in registeredPlans) {
				foundPlans.push(registeredPlans[planId]);
			}

			return foundPlans;
		},

		postCreate: function() {
			var processPlanId = this._rootProcessPlanId;
			var loadedProcessPlans;

			this.actionsHelper = new ActionsHelper({datamodel: this, aras: this.aras});
			this.elementFactory = new ElementFactory({datamodel: this});

			// load stashed plans
			loadedProcessPlans = this.loadStashedProcessPlans(this._item);

			// if there is no stashed data for root process plan, then load from server
			if (!loadedProcessPlans[processPlanId]) {
				loadedProcessPlans = this.loadProcessPlans(processPlanId, processPlanId);
				this.registerProcessPlan(loadedProcessPlans[processPlanId], true);
			}

			this.refreshPartAlternates(this.rootProcessPlan);
		},

		requestProcessPlanIdsForParts: function(partIds, optionalParameters) {
			var foundPlans = {};

			partIds = partIds ? (Array.isArray(partIds) ? partIds : [partIds]) : [];
			optionalParameters = (optionalParameters && typeof optionalParameters === 'object') ? optionalParameters : {};

			if (partIds.length) {
				var locationId = optionalParameters.locationId || this.filterParameters.locationId;
				var requestItem = this.aras.newIOMItem('Method', 'mpp_getProcessPlanByPart');

				requestItem.setProperty('part_ids', partIds.join(','));
				requestItem.setProperty('location_id', locationId || '');
				requestItem = requestItem.apply();

				if (requestItem.isError()) {
					this.aras.AlertError(requestItem.getErrorString());
				} else {
					var currentItemNode = requestItem.getItemCount() ? requestItem.getItemByIndex(0).node : null;
					var partId, plansInfo;

					while (currentItemNode) {
						partId = this.aras.getItemProperty(currentItemNode, 'part_id');
						plansInfo = foundPlans[partId];

						if (!plansInfo) {
							plansInfo = [];
							foundPlans[partId] = plansInfo;
						}

						plansInfo.push({
							planId: this.aras.getItemProperty(currentItemNode, 'plan_id'),
							planItemNumber: this.aras.getItemProperty(currentItemNode, 'plan_item_number')
						});

						currentItemNode = currentItemNode.nextSibling;
					}
				}
			}

			return foundPlans;
		},

		requestAlternateParts: function(sourcePartId, partIds) {
			var foundAlternates = {};

			partIds = partIds ? (Array.isArray(partIds) ? partIds : [partIds]) : [];

			if (partIds.length) {
				var requestItem = this.aras.newIOMItem('Method', 'mpp_getPartAlterSubs');

				requestItem.setProperty('source_part_id', sourcePartId);
				requestItem.setProperty('part_ids', partIds.join(','));
				requestItem = requestItem.apply();

				if (requestItem.isError()) {
					this.aras.AlertError(requestItem.getErrorString());
				} else {
					var currentItemNode = requestItem.getItemCount() ? requestItem.getItemByIndex(0).node : null;
					var alternateModelItem, alternateParts;

					while (currentItemNode) {
						var partId = this.aras.getItemProperty(currentItemNode, 'source_part');
						alternateModelItem = this.elementFactory.createElementFromItemNode(currentItemNode);
						alternateParts = foundAlternates[partId];

						if (!alternateParts) {
							alternateParts = [];
							foundAlternates[partId] = alternateParts;
						}

						alternateParts.push(alternateModelItem);
						currentItemNode = currentItemNode.nextSibling;
					}
				}
			}

			return foundAlternates;
		},

		getAlternateParts: function(partId) {
			return this.data.alternateParts[partId] || [];
		},

		getItemsByRelatedId: function(relatedItemId) {
			var foundItems = [];

			if (relatedItemId) {
				var allItems = this.data.all;
				var currentItem, relatedItem, itemId;

				for (itemId in allItems) {
					currentItem = allItems[itemId];
					relatedItem = currentItem.getRelatedItem();

					if (relatedItem && (relatedItem.Id() === relatedItemId)) {
						foundItems.push(currentItem);
					}
				}
			}

			return foundItems;
		},

		loadProcessPlans: function(processPlanIds, withDetailsIds) {
			var loadedProcessPlans = {};

			processPlanIds = processPlanIds ? (Array.isArray(processPlanIds) ? processPlanIds : [processPlanIds]) : [];
			withDetailsIds = withDetailsIds ? (Array.isArray(withDetailsIds) ? withDetailsIds : [withDetailsIds]) : [];

			if (processPlanIds.length) {
				var requestItem = this.aras.newIOMItem('mpp_ProcessPlan', 'mpp_getProcessPlanStructure');
				var processPlanIdsHash = {};
				var processPlanId, i, producedParts, consumedParts, partId;

				for (i = 0; i < processPlanIds.length; i++) {
					processPlanId = processPlanIds[i];
					processPlanIdsHash[processPlanId] = true;
				}

				for (i = 0; i < withDetailsIds.length; i++) {
					processPlanId = withDetailsIds[i];
					delete processPlanIdsHash[processPlanId];
				}

				requestItem.setProperty('plan_ids', Object.keys(processPlanIdsHash).join(','));
				requestItem.setProperty('with_details_ids', withDetailsIds.join(','));
				if (this.filterParameters.langCode) {
					requestItem.setProperty('lang_code', this.filterParameters.langCode);
				}
				
				//Modify by tengz 2019/6/12
				//Location处理
				//查询ProcessPlan时增加location条件
				requestItem.setProperty("bcs_location",viewController.shareData.locationId);
				
				requestItem = requestItem.apply();

				if (!requestItem.isError()) {
					var currentItemNode = requestItem.getItemCount() ? requestItem.getItemByIndex(0).node : null;
					var partIdsHash = {};

					while (currentItemNode) {
						var processPlanModelItem = this.elementFactory.createElementFromItemNode(currentItemNode);

						if (processPlanModelItem) {
							processPlanId = processPlanModelItem.Id();
							producedParts = processPlanModelItem.getAllChildren(null, Enums.ModelItemTypes.ProducedPart);
							consumedParts = processPlanModelItem.getAllChildren(null, Enums.ModelItemTypes.Part);

							for (i = 0; i < producedParts.length; i++) {
								partId = producedParts[i].getRelatedItemId();
								partIdsHash[partId] = true;
							}

							for (i = 0; i < consumedParts.length; i++) {
								partId = consumedParts[i].Id();
								partIdsHash[partId] = true;
							}

							loadedProcessPlans[processPlanId] = processPlanModelItem;
						}

						currentItemNode = currentItemNode.nextSibling;
					}

					// update ProcessPlan ids for nested parts
					this.updateProcessPlansHash(Object.keys(partIdsHash));
				}
			}

			return loadedProcessPlans;
		},

		getDbProcessPlan: function(processPlanId) {
			var requestItem = this.aras.newIOMItem('mpp_ProcessPlan', 'mpp_getProcessPlanStructure');
			requestItem.setProperty('plan_ids', processPlanId);
			var responseItem = requestItem.apply();
			return !responseItem.isError() &&
				responseItem.getItemCount() === 1 &&
				this.elementFactory.createElementFromItemNode(responseItem.getItemByIndex(0).node);
		},

		getProcessPlanByPartId: function(partId) {
			return this.data.producedPartHash[partId];
		},

		getProcessPlan: function(processPlanId, optionalParameters) {
			optionalParameters = optionalParameters || {};

			if (processPlanId === undefined) {
				return this.rootProcessPlan;
			} else if (processPlanId) {
				var foundProcessPlan = this.data.processPlans[processPlanId];

				if (!foundProcessPlan && optionalParameters.loadPermitted) {
					optionalParameters.isFromServer = true;
					var loadedProcessPlans = this.loadProcessPlans(processPlanId, optionalParameters.withDetails ? processPlanId : undefined);

					foundProcessPlan = loadedProcessPlans[processPlanId];

					if (foundProcessPlan) {
						this.registerProcessPlan(foundProcessPlan);
					}
				}

				if (foundProcessPlan && optionalParameters.trackChanges) {
					this.startTrackItemChanges(foundProcessPlan);
				}

				return foundProcessPlan;
			}
		},

		registerProcessPlan: function(planModelItem, trackChanges) {
			if (planModelItem && planModelItem.is('ProcessPlan')) {
				var processPlanId = planModelItem.Id();
				var registeredProcessPlan = this.data.processPlans[processPlanId];

				if (registeredProcessPlan) {
					registeredProcessPlan.unregisterItem();
				}

				this.data.processPlans[processPlanId] = planModelItem;
				planModelItem.registerItem();

				if (processPlanId === this._rootProcessPlanId) {
					this.rootProcessPlan = planModelItem;
					trackChanges = true;
				}

				if (trackChanges) {
					this.startTrackItemChanges(planModelItem);
				}

				this.raiseEvent('onProcessPlanRegistered', planModelItem);
			}
		},

		startTrackItemChanges: function(targetItem) {
			if (targetItem && targetItem.isRegistered()) {
				var allChildren = targetItem.getAllChildren();
				var currentItem, itemId, i;

				for (i = 0; i < allChildren.length; i++) {
					currentItem = allChildren[i];
					itemId = currentItem.Id();

					if (!this.isItemChangesTracking(itemId)) {
						currentItem.addEventListener(this, null, 'onItemChanged', this.onItemChangeHandler);
						this.data.track[itemId] = true;
					}
				}
			}
		},

		stopTrackItemChanges: function(targetItem) {
			if (targetItem) {
				var targetItemId = targetItem.Id();

				if (this.isItemChangesTracking(targetItem.Id())) {
					var allChildren = targetItem.getAllChildren();
					var trackItems = this.data.track;
					var currentItem, itemId, i;

					for (i = 0; i < allChildren.length; i++) {
						currentItem = allChildren[i];
						itemId = currentItem.Id();

						if (trackItems[itemId]) {
							currentItem.removeEventListeners(this);
							delete trackItems[itemId];
						}
					}

					delete trackItems[targetItemId];

					if (targetItem.is('ProcessPlan')) {
						delete this.data.changes[targetItemId];
					}
				}
			}
		},

		isItemChangesTracking: function(itemId) {
			return this.data.track[itemId];
		},

		onItemChangeHandler: function(targetItem) {
			this.saveItemChanges(targetItem);
			this.raiseEvent('onModelItemChanged', targetItem);
		},

		getParentProcessPlan: function(targetItem) {
			while (targetItem && !targetItem.is('ProcessPlan')) {
				targetItem = targetItem.Parent;
			}

			return targetItem;
		},

		isFromRootProcessPlan: function(targetItems) {
			if (targetItems) {
				var currentItem, i;

				targetItems = Array.isArray(targetItems) ? targetItems : [targetItems];

				for (i = 0; i < targetItems.length; i++) {
					currentItem = targetItems[i];

					if (this.getParentProcessPlan(currentItem) !== this.rootProcessPlan) {
						return false;
					}
				}

				return true;
			}
		},

		isDeleted: function(targetItems) {
			if (targetItems) {
				var currentItem, i;

				targetItems = Array.isArray(targetItems) ? targetItems : [targetItems];

				for (i = 0; i < targetItems.length; i++) {
					currentItem = targetItems[i];

					if (currentItem.isDeleted() || currentItem.isParentDeleted()) {
						return true;
					}
				}
			}

			return false;
		},

		isRootProcessPlanContained: function(targetItems) {
			if (targetItems) {
				targetItems = Array.isArray(targetItems) ? targetItems : [targetItems];

				for (var i = 0; i < targetItems.length; i++) {
					if (targetItems[i] === this.rootProcessPlan) {
						return true;
					}
				}
			}

			return false;
		},

		getCurrentUserId: function() {
			return this._currentUser;
		},

		getRootProcessPlanId: function() {
			return this._rootProcessPlanId;
		},

		saveItemChanges: function(targetItem) {
			var changeStash = this.data.changes;
			var itemId = targetItem.Id();
			var parentProcessPlan = this.getParentProcessPlan(targetItem);
			var processPlanId = parentProcessPlan.Id();

			if (processPlanId) {
				var processPlanChanges = changeStash[processPlanId];

				if (!processPlanChanges) {
					processPlanChanges = [];
					changeStash[processPlanId] = processPlanChanges;
				}

				if (itemId !== processPlanId) {
					processPlanChanges.push(itemId);
				}

				parentProcessPlan.isModified(true);
			}
		},

		getItemIdPath: function(modelItem) {
			var targetItem = (typeof modelItem === 'string') ? this.getItemById(modelItem) : modelItem;
			var idPath = [];

			if (targetItem) {
				idPath.push(targetItem.Id());
				targetItem = targetItem.Parent;

				while (targetItem && !targetItem.is('ProcessPlan')) {
					idPath.push(targetItem.Id());
					targetItem = targetItem.Parent;
				}

				idPath.reverse();
			}

			return idPath;
		},

		deleteItem: function(modelItem, optionalParameters) {
			var targetItem = (typeof modelItem === 'string') ? this.getItemById(modelItem) : modelItem;

			if (targetItem && targetItem.isRegistered()) {
				if (targetItem.isNew()) {
					var parentItem = targetItem.Parent;

					if (parentItem) {
						parentItem.removeChildItem(targetItem);
					} else {
						targetItem.unregisterItem();
					}

					this.aras.itemsCache.deleteItem(targetItem.Id());
				} else {
					targetItem.setAttribute('action', 'delete');
				}

				this.raiseEvent('onDeleteItem', targetItem, optionalParameters);
			}
		},

		isEditable: function() {
			return this.rootProcessPlan && this.rootProcessPlan.isEditable();
		},

		_registerItem: function(modelItem) {
			var elementId = modelItem.Id();

			this.data.all[elementId] = modelItem;

			if (modelItem.isNew() && modelItem.Parent) {
				var parentId = modelItem.Parent.Id();

				if (this.isItemChangesTracking(parentId)) {
					this.startTrackItemChanges(modelItem);
				}

				this.raiseEvent('onNewItem', modelItem, modelItem.Parent);
			}

			this.OnItemRegistered(this, {registeredObject: modelItem});
		},

		_unregisterItem: function(modelItem) {
			var elementId = modelItem.Id();

			delete this.data.all[elementId];
			this.stopTrackItemChanges(modelItem);

			this.OnItemUnregistered(this, {unregisteredObject: modelItem});
		},

		getItemById: function(elementId) {
			return this.data.all[elementId];
		},

		// Model Events Section
		OnItemRegistered: function(sender, earg) {
			this.raiseEvent('OnItemRegistered', sender, earg);
		},

		_OnItemChanged: function(targetItem) {
			//this._OnStructureChanged(targetElement);
		},

		OnItemUnregistered: function(sender, earg) {
			this.raiseEvent('OnItemUnregistered', sender, earg);
		},

		getItemTypeDescriptor: function(itemTypeName) {
			var foundDescriptor = this.data.typeDescriptors[itemTypeName];

			if (!foundDescriptor) {
				foundDescriptor = this.aras.getItemTypeForClient(itemTypeName, 'name');
				this.data.typeDescriptors[itemTypeName] = foundDescriptor;
			}

			return foundDescriptor;
		},

		replaceRegisteredItemsFromNode: function(itemId, itemNode) {
			if (itemId) {
				var replaceCandidates = [];
				var registeredProcessPlans = this.getRegisteredProcessPlans();
				var processPlanItem, foundItems, targetItem, i, j;

				for (i = 0; i < registeredProcessPlans.length; i++) {
					processPlanItem = registeredProcessPlans[i];
					foundItems = processPlanItem.getAllChildren();

					for (j = 0; j < foundItems.length; j++) {
						targetItem = foundItems[j];

						if (targetItem.Id() === itemId) {
							replaceCandidates.push(targetItem);
						}
					}
				}

				if (replaceCandidates.length) {
					for (i = 0; i < replaceCandidates.length; i++) {
						targetItem = replaceCandidates[i];
						targetItem.deserializeItemNode(itemNode);
					}
				}
			}
		},

		setEditState: function(isEditState) {
			this.rootProcessPlan.setAttribute('isEditState', isEditState ? '1' : '0', {skipOnChangedEvent: true});
			this.onEditStateChange(isEditState);
		},

		onEditStateChange: function(isEditState) {}
	});
});
