DECLARE @UpdateString nvarchar(2000)
DECLARE @PropertyName nvarchar(32)
SET @PropertyName = 'label_zt'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='ITEMTYPE') 
BEGIN
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zt = N''SOP模板'' where name = ''BCS SOP Template''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zt = N''SOP模板'' where name = ''BCS SOP Template''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zt = N''廠區'' where name = ''mpp_Location''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zt = N''廠區'' where name = ''mpp_Location''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zt = N''機台'' where name = ''mpp_Machine''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zt = N''機台'' where name = ''mpp_Machine''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zt = N''製造流程規劃'' where name = ''mpp_ProcessPlan''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zt = N''製造流程規劃'' where name = ''mpp_ProcessPlan''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zt = N''MPP資源'' where name = ''mpp_Resource''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zt = N''MPP資源'' where name = ''mpp_Resource''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zt = N''技能'' where name = ''mpp_Skill''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zt = N''技能'' where name = ''mpp_Skill''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zt = N''工具'' where name = ''mpp_Tool''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zt = N''工具'' where name = ''mpp_Tool''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zt = N''標準工序庫'' where name = ''mpp_OperationTemplate''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zt = N''標準工序庫'' where name = ''mpp_OperationTemplate''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zt = N''檢驗項'' where name = ''mpp_Test''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zt = N''檢驗項'' where name = ''mpp_Test''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zt = N''資源規劃'' where name = ''mpp_ResourceTemplate''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zt = N''資源規劃'' where name = ''mpp_ResourceTemplate''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zt = N''所需技能'' where name = ''mpp_SkillTemplate''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zt = N''所需技能'' where name = ''mpp_SkillTemplate''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zt = N''工序步驟'' where name = ''mpp_StepTemplate''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zt = N''工序步驟'' where name = ''mpp_StepTemplate''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zt = N''變更履歷'' where name = ''mpp_Changes''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zt = N''變更記錄'' where name = ''mpp_Changes''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zt = N''插入物件類型屬性配置(隱藏)'' where name = ''mpp_ItemPropertyLayout''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zt = N''插入物件類型屬性配置(隱藏)'' where name = ''mpp_ItemPropertyLayout''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zt = N''工序庫'' where name = ''mpp_Operation''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zt = N''工序庫'' where name = ''mpp_Operation''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zt = N''廠區'' where name = ''mpp_ProcessPlanLocation''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zt = N''廠區'' where name = ''mpp_ProcessPlanLocation''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zt = N''生產零件'' where name = ''mpp_ProcessPlanProducedPart''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zt = N''生產零件'' where name = ''mpp_ProcessPlanProducedPart''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zt = N''受影響物件'' where name = ''MPP Affected Item''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zt = N''受影響物件'' where name = ''MPP Affected Item''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zt = N''變更控制物件'' where name = ''MPP Change Controlled Item''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zt = N''變更控制物件'' where name = ''MPP Change Controlled Item''';
EXEC SP_EXECUTESQL @UpdateString;
END
SET @PropertyName = 'label_zc'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='ITEMTYPE') 
BEGIN
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zc = N''SOP模板'' where name = ''BCS SOP Template''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zc = N''SOP模板'' where name = ''BCS SOP Template''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zc = N''厂区'' where name = ''mpp_Location''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zc = N''厂区'' where name = ''mpp_Location''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zc = N''机台'' where name = ''mpp_Machine''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zc = N''机台'' where name = ''mpp_Machine''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zc = N''工艺流程规划'' where name = ''mpp_ProcessPlan''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zc = N''工艺流程规划'' where name = ''mpp_ProcessPlan''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zc = N''MPP资源'' where name = ''mpp_Resource''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zc = N''MPP资源'' where name = ''mpp_Resource''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zc = N''技能'' where name = ''mpp_Skill''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zc = N''技能'' where name = ''mpp_Skill''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zc = N''工具'' where name = ''mpp_Tool''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zc = N''工具'' where name = ''mpp_Tool''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zc = N''标准工序库'' where name = ''mpp_OperationTemplate''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zc = N''标准工序库'' where name = ''mpp_OperationTemplate''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zc = N''检验项'' where name = ''mpp_Test''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zc = N''检验项'' where name = ''mpp_Test''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zc = N''资源规划'' where name = ''mpp_ResourceTemplate''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zc = N''资源规划'' where name = ''mpp_ResourceTemplate''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zc = N''所需技能'' where name = ''mpp_SkillTemplate''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zc = N''所需技能'' where name = ''mpp_SkillTemplate''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zc = N''工序步骤'' where name = ''mpp_StepTemplate''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zc = N''工序步骤'' where name = ''mpp_StepTemplate''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zc = N''变更记录'' where name = ''mpp_Changes''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zc = N''变更记录'' where name = ''mpp_Changes''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zc = N''插入对象属性配置(隐藏)'' where name = ''mpp_ItemPropertyLayout''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zc = N''插入对象属性配置(隐藏)'' where name = ''mpp_ItemPropertyLayout''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zc = N''工序库'' where name = ''mpp_Operation''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zc = N''工序库'' where name = ''mpp_Operation''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zc = N''厂区'' where name = ''mpp_ProcessPlanLocation''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zc = N''厂区'' where name = ''mpp_ProcessPlanLocation''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zc = N''生产零部件'' where name = ''mpp_ProcessPlanProducedPart''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zc = N''生产零部件'' where name = ''mpp_ProcessPlanProducedPart''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zc = N''影响对象'' where name = ''MPP Affected Item''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zc = N''影响对象'' where name = ''MPP Affected Item''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_zc = N''变更控制对象'' where name = ''MPP Change Controlled Item''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural_zc = N''变更控制对象'' where name = ''MPP Change Controlled Item''';
EXEC SP_EXECUTESQL @UpdateString;
END
SET @PropertyName = 'label'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='ITEMTYPE') 
BEGIN
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label = N''SOP Template'' where name = ''BCS SOP Template''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural = N''SOP Template'' where name = ''BCS SOP Template''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label = N''Location'' where name = ''mpp_Location''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural = N''Locations'' where name = ''mpp_Location''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label = N''Machine'' where name = ''mpp_Machine''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural = N''Machines'' where name = ''mpp_Machine''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label = N''Process Plan'' where name = ''mpp_ProcessPlan''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural = N''Process Plans'' where name = ''mpp_ProcessPlan''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label = N''Resource'' where name = ''mpp_Resource''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural = N''Resources'' where name = ''mpp_Resource''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label = N''Skill'' where name = ''mpp_Skill''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural = N''Skills'' where name = ''mpp_Skill''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label = N''Tool'' where name = ''mpp_Tool''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural = N''Tools'' where name = ''mpp_Tool''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label = N''Standard Operations'' where name = ''mpp_OperationTemplate''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural = N''Standard Operations'' where name = ''mpp_OperationTemplate''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label = N''Inspection'' where name = ''mpp_Test''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural = N''Inspections'' where name = ''mpp_Test''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label = N''Resource Planning'' where name = ''mpp_ResourceTemplate''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural = N''Resource Plannings'' where name = ''mpp_ResourceTemplate''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label = N''Required Skill'' where name = ''mpp_SkillTemplate''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural = N''Required Skills'' where name = ''mpp_SkillTemplate''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label = N''Operation Step'' where name = ''mpp_StepTemplate''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural = N''Operations Steps'' where name = ''mpp_StepTemplate''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label = N''Change Record'' where name = ''mpp_Changes''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural = N''Change Records'' where name = ''mpp_Changes''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label = N''Insert ItemType Property Configuration (Hide)'' where name = ''mpp_ItemPropertyLayout''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural = N''Insert ItemType Property Configuration (Hide)'' where name = ''mpp_ItemPropertyLayout''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label = N''Operation'' where name = ''mpp_Operation''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural = N''Operations'' where name = ''mpp_Operation''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label = N''Location'' where name = ''mpp_ProcessPlanLocation''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural = N''Locations'' where name = ''mpp_ProcessPlanLocation''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label = N''Produced Part'' where name = ''mpp_ProcessPlanProducedPart''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural = N''Produced Part'' where name = ''mpp_ProcessPlanProducedPart''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label = N''Affected Item'' where name = ''MPP Affected Item''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural = N''Affected Items'' where name = ''MPP Affected Item''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label = N''Change Controlled Item'' where name = ''MPP Change Controlled Item''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[ITEMTYPE] set label_plural = N''Change Controlled Item'' where name = ''MPP Change Controlled Item''';
EXEC SP_EXECUTESQL @UpdateString;
END