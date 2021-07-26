DECLARE @UpdateString nvarchar(2000)
DECLARE @PropertyName nvarchar(32)
SET @PropertyName = 'label_zt'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='COMMANDBARMENU') 
BEGIN
SET @UpdateString = N'update [Innovator].[COMMANDBARMENU] set label_zt = N''製造流程'' where keyed_name = ''com.aras.innovator.cui_default.toc_Process Flow''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[COMMANDBARMENU] set label_zt = N''80.製程管理'' where keyed_name = ''com.aras.innovator.cui_default.toc_MPP''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[COMMANDBARMENU] set label_zt = N''標準資源庫'' where keyed_name like ''com.aras.innovator.cui_default.toc_Standard Resource_%''';
EXEC SP_EXECUTESQL @UpdateString;
END
SET @PropertyName = 'label_zc'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='COMMANDBARMENU') 
BEGIN
SET @UpdateString = N'update [Innovator].[COMMANDBARMENU] set label_zc = N''制造流程'' where keyed_name = ''com.aras.innovator.cui_default.toc_Process Flow''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[COMMANDBARMENU] set label_zc = N''80.工艺管理'' where keyed_name = ''com.aras.innovator.cui_default.toc_MPP''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[COMMANDBARMENU] set label_zc = N''标准资源库'' where keyed_name like ''com.aras.innovator.cui_default.toc_Standard Resource_%''';
EXEC SP_EXECUTESQL @UpdateString;
END
SET @PropertyName = 'label'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='COMMANDBARMENU') 
BEGIN
SET @UpdateString = N'update [Innovator].[COMMANDBARMENU] set label = N''Process Flow'' where keyed_name = ''com.aras.innovator.cui_default.toc_Process Flow''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[COMMANDBARMENU] set label = N''80.MPP'' where keyed_name = ''com.aras.innovator.cui_default.toc_MPP''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[COMMANDBARMENU] set label = N''Resources'' where keyed_name like ''com.aras.innovator.cui_default.toc_Standard Resource_%''';
EXEC SP_EXECUTESQL @UpdateString;
END