define([
    'dojo/_base/declare',
    'MPP/UI/ProcessPlan/DnD/DndSourceTarget/DndTarget',
    'MPP/UI/ProcessFlows/ProcessGridCommon',
],
    function (declare, DndTarget, ProcessGridCommon) {

        return declare('Aras.Client.Controls.MPP.ProcessGrid', [DndTarget, ProcessGridCommon], {
            waitTearoffWindows: null,
            isEditable: null,

            constructor: function (initialArguments) {
                var dragController = initialArguments.dragController;

                this.waitTearoffWindows = {};
                this.isEditable = this.datamodel.isEditable();

                if (dragController) {
                    dragController.registerTarget(this);
                }
            },


            dragEnter: function (dndEvent) {
                if (this.isRegistered()) {
                    var dragController = this.dndData.controller;
                    var dragData = dragController.getDragData();

                    if (typeof dragData === 'object' && dragData.dataType === 'WorkbenchItem') {
                        this.dndData.dragData = dragData;
                    }
                }
            },



            dragEnd: function (dragSource, dndEvent) {
                this.inherited(arguments);
                this.cleanupDropbox();
            },




            toggleCssClass: function (/*domNode*/ targetNode, /*String*/ toggleClassName, /*Boolean*/ addClass) {
                if (targetNode && toggleClassName) {
                    var toggleClasses = toggleClassName.split(' ');
                    var i;

                    for (i = 0; i < toggleClasses.length; i++) {
                        if (addClass) {
                            targetNode.classList.add(toggleClasses[i]);
                        } else {
                            targetNode.classList.remove(toggleClasses[i]);
                        }
                    }
                }
            },

            //zhou 2021/6/28
            initTree: function (sourceModelItem) {
                if (sourceModelItem) {
                    var processItems = sourceModelItem.getChildrenByType('Operation');
                    var processItem, oldOperation, processData = [];
                    this.processItems = [];
                    this.processItems = processItems;
                    for (var i = 0; i < processItems.length; i++) {
                        processItem = processItems[i];
                        oldOperation = this.createMBomItemFromModelItem(processItem);
                        processData.push(oldOperation);
                    }
                    this.data = processData;
                }
            },

            //Modify by tengz
            _onApplyEdit: function (rowId, fieldName, newValue) {
                if (newValue === this.originCellValue) {
                    return true;
                }

                switch (fieldName) {
                    case 'c_bcs_hours':
                        this.applyOperationNumberChange(rowId, newValue);
                        break;
                    case 'c_quantity':
                        this.applyQuantityChange(rowId, newValue);
                        break;
                    default:
                        break;
                }
            },
            setEditable: function (doEditable) {
                this.isEditable = doEditable === undefined ? true : Boolean(doEditable);
            },
        });
    });
