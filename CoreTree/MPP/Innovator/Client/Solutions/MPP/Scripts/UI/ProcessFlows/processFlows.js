var myflow = $.myflow;
var aras = parent.aras;
var itemID = parent.itemID;
function myflowjpdl($) {
    $.extend(true, myflow.config.rect, {
        attr: {
            r: 8,
            fill: '#F6F7FF',
            stroke: '#03689A',
            "stroke-width": 2
        }
    });
    if (toolLoad != 0) {
        $.extend(true, myflow.config.props.props, {
            name: { name: 'name', label: aras.getResource("../Solutions/MPP","processflow.number"), value: aras.getItemProperty(parent.item, "item_number"), editor: function () { return new myflow.editors.inputEditor(); } },
            key: { name: 'key', label: aras.getResource("../Solutions/MPP","processflow.name"), value: aras.getItemProperty(parent.item, "name"), editor: function () { return new myflow.editors.inputEditor(); } },
            desc: { name: 'desc', label: '../Solutions/MPP","processflow.description', value: aras.getItemProperty(parent.item, "description"), editor: function () { return new myflow.editors.inputEditor(); } }
        });
    }
    //根据数据库生成节点 
    //2021/6/10  zhou
    var toolBar = getAllOperation();
    $.extend(true, myflow.config.tools.states, toolBar);
}

//页面加载
function getAllOperation() {
    if (processGridData) {
        return createTool(addModelDiv(processGridData));
    }
    else {
        return [];
    }
}

//页面加载动态加载左侧工具栏内容
function addModelDiv(processData) {
    var Operations = [];
    var id, sort_order, name, bcs_hours, operation_name, bcs_is_flow, display, divNode;
    $("#replacement").after("<div id='hr'>  <hr /> </div>");
    for (var i = 0; i < processData.length; i++) {
        id = processData[i].userdata.id;
        name = processData[i].fields.name;
        sort_order = processData[i].fields.sort_order;
        bcs_hours = processData[i].fields.bcs_hours;
        bcs_operation_image = processData[i].fields.bcs_operation_image;
        bcs_is_flow = processData[i].fields.bcs_is_flow;
        if (bcs_is_flow == "1") {
            display = "display:none";
        }
        else {
            display = "display:block";
        }
        if (bcs_operation_image) {
            if (bcs_operation_image.indexOf(".") != -1) {
                bcs_operation_image = "../" + bcs_operation_image;
            }
            else {
                bcs_operation_image = dojoConfig.arasContext.adjustIconUrl(bcs_operation_image);
            }
        }
        else {
            bcs_operation_image = "../../images/ProcessOperation.svg";
        }
        if (name == "") {
            operation_name = sort_order;
        }
        else if (sort_order == "") {
            operation_name = name;
        }
        else {
            operation_name = sort_order + ":" + name;
        }
        Operations.push({
            id: id,
            name: name,
            sort_order: sort_order,
            bcs_hours: bcs_hours,
            bcs_operation_image: bcs_operation_image,
            operation_name: operation_name
        });
        divNode = `<div title="${operation_name}" class="node state" id="${id}" type="${id}" style="${display}">`;
        divNode += `<img src="${bcs_operation_image}" style="width: 16px;height: 16px;margin-bottom: -4px;padding-left: 3px;" />&nbsp;&nbsp;${operation_name} </div>`;
        $("#hr").append(divNode);
    }
    return Operations;
}

//工艺流程规划下工序获取并转换为对应工艺流程图对应格式
function createTool(Operations) {
    var tool = {};
    var id, text, img;
    for (var i = 0; i < Operations.length; i++) {
        id = Operations[i]['id'];
        img = Operations[i]["bcs_operation_image"];
        text = Operations[i]["operation_name"];
        tool[id] = {};
        tool[id]['id'] = id;
        tool[id]['showType'] = 'image';
        tool[id]['type'] = id;
        tool[id]['name'] = { text: '<<' + id + '>>' };
        tool[id]['img'] = { src: img, width: 48, height: 48 };
        tool[id]['fromId'] = itemID;
        tool[id]['text'] = {};
        tool[id]['text']['text'] = text;
        tool[id]['text']['"font-size"'] = ": 13";
        tool[id]['props'] = {};
        tool[id]['props']['text'] = {};
        tool[id]['props']['text']['name'] = "text";
        tool[id]['props']['text']['label'] = "名称"
        tool[id]['props']['text']['value'] = text;
        tool[id]['props']['text']['editor'] = function () { return new myflow.editors.textEditor(); };
    }
    return tool;
}

//添加工序
//添加工序后工具栏移除工序
var proceses = {};
function addProcessData(process) {
    //工序添加
    if (!proceses[process.getId()]) {
        proceses[process.getId()] = [];
        proceses[process.getId()] = process;
        for (var i = 0; i < processGridItem.length; i++) {
            var processGrid = processGridItem[i];
            if (processGrid._id == process.getId().slice(4)) {
                var processData = eval('(' + process.toJson() + ')');
                processGrid.setProperty("bcs_is_flow", "1");
                processGrid.setProperty("bcs_flow_x", processData.attr.x);
                processGrid.setProperty("bcs_flow_y", processData.attr.y);
                processGrid.setProperty("bcs_flow_height", processData.attr.height);
                processGrid.setProperty("bcs_flow_width", processData.attr.width);
                $("#" + processGrid._id).attr("style", "display:none");
            }
        }
    }
}

//工序位置变更
function processAmend(processCoord) {
    if (!flowState) {
        return;
    }
    if (proceses["rect" + processCoord.id]) {
        for (var i = 0; i < processGridItem.length; i++) {
            var processGrid = processGridItem[i];
            if (processGrid._id == processCoord.id) {
                processGrid.setProperty("bcs_flow_x", processCoord.X);
                processGrid.setProperty("bcs_flow_y", processCoord.Y);
                processGrid.setProperty("bcs_flow_height", processCoord.H);
                processGrid.setProperty("bcs_flow_width", processCoord.W);
            }
        }
    }
    else if (restore.states["rect" + processCoord.id]) {
        for (var i = 0; i < processGridItem.length; i++) {
            var processGrid = processGridItem[i];
            if (processGrid._id == processCoord.id) {
                processGrid.setProperty("bcs_flow_x", processCoord.X);
                processGrid.setProperty("bcs_flow_y", processCoord.Y);
                processGrid.setProperty("bcs_flow_height", processCoord.H);
                processGrid.setProperty("bcs_flow_width", processCoord.W);
            }
        }
    }
}

//工序移除出工程图
//移除工程图工具栏显示
function removeparocess(id) {
    for (var i = 0; i < processGridItem.length; i++) {
        var processGrid = processGridItem[i];
        if (processGrid._id == id.slice(4)) {
            processGrid.setProperty("bcs_is_flow", "0");
            $("#" + processGrid._id).attr("style", "display:block");
        }
        if (proceses[id]) {
            delete proceses[id];
        }
    }
}

//添加流程线
var courses = {};
var flowCourses;
function addCourseData(course) {
    courses[course.getId()] = [];
    courses[course.getId()] = course;
    var flowCourse = aras.newRelationship(aras.getRelationshipTypeId("mpp_process_flow"), parent.item, false, Window, null);
    // id修改,数据录入
    var toJson = eval('(' + course.toJson() + ')');
    flowCourse.setAttribute("id", course.id().slice(4));
    aras.setItemProperty(flowCourse, "path_to_id", toJson.to);
    aras.setItemProperty(flowCourse, "path_from_id", toJson.from);
    aras.setItemProperty(flowCourse, "path_name", course.text());
    aras.setItemProperty(flowCourse, "path_name_pos", JSON.stringify(toJson.textPos));
    aras.setItemProperty(flowCourse, "path_dots", JSON.stringify(toJson.dots));
    flowCourses = aras.getRelationships(parent.item, "mpp_process_flow");
}

//流程线弯曲路径
var courseID;
function courseAmend(dots, id) {
    changeData(id, "path_dots", dots);
}

//流程线名称修改
function courseNameAmend(coursename, ID) {
    changeData(ID, "path_name", coursename);
}

//流程线名称位置变更
function courseNamePosAmend(pos, ID) {
    changeData(ID, "path_name_pos", JSON.stringify(pos));
}

//流程线移除
function removecourse(id) {
    if (id.length > 32) {
        id = id.slice(4);
    }
    flowCourses = aras.getRelationships(parent.item, "mpp_process_flow");
    if (flowCourses.length >= 1) {
        for (var i = 0; i < flowCourses.length; i++) {
            var flowItem = flowCourses[i];
            if (flowItem.id == id) {
                flowItem.setAttribute("action", "delete");
                delete courses["path" + id];
            }
        }
    }
}

//对于流程线处理
function changeData(ID, pathTypeName, pathData) {
    if (!pathTypeName || !ID || !flowState) {
        return;
    }
    if (ID.length > 32) {
        ID = ID.slice(4);
    }
    flowCourses = aras.getRelationships(parent.item, "mpp_process_flow");
    if (flowCourses.length >= 1) {
        for (var i = 0; i < flowCourses.length; i++) {
            var flowItem = flowCourses[i];
            if (flowItem.id == ID) {
                //对于新增的线进行数据更改,action不做变更
                //数据读取的线action更改为update
                if (!(flowItem.getAttribute("action") == "add")) {
                    flowItem.setAttribute("action", "update");
                }
                aras.setItemProperty(flowItem, pathTypeName, pathData);
            }
        }
    }
}