DECLARE @UpdateString nvarchar(2000)
DECLARE @PropertyName nvarchar(32)
SET @PropertyName = 'label_zt'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='COMMANDBARBUTTON') 
BEGIN
SET @UpdateString = N'update [Innovator].[COMMANDBARBUTTON] set label_zt = N''顯示製程規劃'' where keyed_name = ''mpp_show_pp_view''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[COMMANDBARBUTTON] set label_zt = N''顯示MBOM'' where keyed_name = ''mpp_show_mbom_view''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[COMMANDBARBUTTON] set label_zt = N''顯示EBOM'' where keyed_name = ''mpp_show_ebom_view''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[COMMANDBARBUTTON] set label_zt = N''頁首頁尾'' where keyed_name = ''mpp_show_headerfooter''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[COMMANDBARBUTTON] set label_zt = N''檢驗項目&工時定額'' where keyed_name = ''mpp_show_testworkhour''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[COMMANDBARBUTTON] set label_zt = N''製造流程'' where keyed_name = ''mpp_show_process_flows''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[COMMANDBARBUTTON] set tooltip_template_zt = N''檢驗項目&工時定額'' where keyed_name = ''mpp_show_testworkhour''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[COMMANDBARBUTTON] set tooltip_template_zt = N''製造流程'' where keyed_name = ''mpp_show_process_flows''';
EXEC SP_EXECUTESQL @UpdateString;
END

SET @PropertyName = 'label_zc'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='COMMANDBARBUTTON') 
BEGIN
SET @UpdateString = N'update [Innovator].[COMMANDBARBUTTON] set label_zc = N''显示工艺规划'' where keyed_name = ''mpp_show_pp_view''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[COMMANDBARBUTTON] set label_zc = N''显示MBOM'' where keyed_name = ''mpp_show_mbom_view''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[COMMANDBARBUTTON] set label_zc = N''显示EBOM'' where keyed_name = ''mpp_show_ebom_view''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[COMMANDBARBUTTON] set label_zc = N''页头页尾'' where keyed_name = ''mpp_show_headerfooter''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[COMMANDBARBUTTON] set label_zc = N''检验项目&工时定额'' where keyed_name = ''mpp_show_testworkhour''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[COMMANDBARBUTTON] set label_zc = N''工艺流程'' where keyed_name = ''mpp_show_process_flows''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[COMMANDBARBUTTON] set tooltip_template_zc = N''检验项目&工时定额'' where keyed_name = ''mpp_show_testworkhour''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[COMMANDBARBUTTON] set tooltip_template_zc = N''工艺流程'' where keyed_name = ''mpp_show_process_flows''';
EXEC SP_EXECUTESQL @UpdateString;
END