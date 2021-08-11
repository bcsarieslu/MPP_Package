define([
    'dojo/_base/declare',
    'MPP/UI/Utils/UIUtils',
    'MPP/Model/ModelEnums'
],
    function (declare, UIUtils, Enums) {

        return declare('Aras.Client.Controls.MPP.UI.ProcessGridCommon', null, {
            _grid: null,
            _columnIndexByName: {},
            _isHeaderCreated: false,
            _eventHandlers: null,
            controlsFactory: null,
            producedPartId: null,
            producedPartIsPhantom: null,
            datamodel: null,
            data: null,
            uiUtils: null,
            _expandedConsumedIds: null,


            constructor: function (initialArguments) {
                var initialData = initialArguments.data;
                this.aras = initialArguments.aras;
                this.datamodel = initialArguments.datamodel;
                this.controlsFactory = initialArguments.controlsFactory;

                this.itemToRequest = this.aras.newIOMItem('Part', 'bcs_mpp_GetTestWorkHourTreeGrid');
                this._eventHandlers = [];
                this._expandedConsumedIds = [];
                this.uiUtils = new UIUtils({ aras: this.aras });

                if (initialData) {
                    this.data = initialData;
                }
            },

            setRequestProperty: function (propertyName, propertyValue) {
                if (propertyName) {
                    this.itemToRequest.setProperty(propertyName, propertyValue);
                }
            },


            //zhou 2021/6/28
            getMbomItemPropertyNames: function (modelItem) {
                if (modelItem) {
                    var modelItemType = modelItem.getType();
                    var propertyNames = [];
                    switch (modelItemType) {
                        case Enums.ModelItemTypes.Operation:
                            propertyNames.push("sort_order");
                            propertyNames.push("name");
                            propertyNames.push("bcs_hours");
                            propertyNames.push("bcs_flow_x");
                            propertyNames.push("bcs_flow_y");
                            propertyNames.push("bcs_flow_height");
                            propertyNames.push("bcs_flow_width");
                            propertyNames.push("bcs_is_flow");
                            propertyNames.push("bcs_operation_image");
                            break;
                        default:
                            break;
                    }
                    return propertyNames;
                }
                return [];
            },

            //zhou 2021/6/28
            createMBomItemFromModelItem: function (modelItem) {
                if (modelItem) {
                    var processPlanModelItem = this.datamodel.getParentProcessPlan(modelItem);
                    var partModelItem, operationModelItem, userData;
                    if (modelItem.getType() == Enums.ModelItemTypes.Operation) {
                        partModelItem = modelItem;
                        operationModelItem = modelItem;
                        userData = {
                            id: partModelItem.Id(),
                            pid: processPlanModelItem ? processPlanModelItem.Id() : ''
                        };
                    }
                    else {
                        partModelItem = modelItem.getRelatedItem();
                        operationModelItem = modelItem.Parent;
                        userData = {
                            id: partModelItem.Id(),
                            ocid: modelItem.Id(),
                            oid: operationModelItem ? operationModelItem.Id() : ''
                        };
                    }

                    var fieldsData = [], fieldValue;
                    var propertyNames = this.getMbomItemPropertyNames(modelItem);
                    for (var i = 0; i < propertyNames.length; i++) {
                        fieldValue = partModelItem.getProperty(propertyNames[i], '');
                        fieldsData[propertyNames[i]] = fieldValue;
                    }
                    fieldsData = {
                        userdata: userData,
                        fields: fieldsData
                    };
                    return fieldsData;
                }
            },

            //zhou 2021/6/28
            refreshFromModelItem: function (sourceModelItem) {
                if (sourceModelItem) {
                    var refreshCandidates = sourceModelItem.getChildrenByType('Operation');
                    var currentModelItem, newOperaiton;
                    this.processItems = [];
                    this.data = [];
                    for (var i = 0; i < refreshCandidates.length; i++) {
                        currentModelItem = refreshCandidates[i];
                        // 是否是新增数据
                        // currentModelItem.isNew()

                        // 数据是否移除了
                        // currentModelItem.isDeleted()
                        if (currentModelItem.isDeleted()) {
                            continue;
                        }
                        //工序添加添加
                        this.processItems.push(currentModelItem);

                        newOperaiton = this.createMBomItemFromModelItem(currentModelItem);
                        //工序内容添加
                        this.data.push(newOperaiton);
                    }
                }
            }
        });
    });
