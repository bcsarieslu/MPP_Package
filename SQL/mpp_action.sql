DECLARE @UpdateString nvarchar(2000)
DECLARE @PropertyName nvarchar(32)
SET @PropertyName = 'label_zt'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='ACTION') 
BEGIN
SET @UpdateString = N'update [Innovator].[ACTION] set label_zt = N''新增至變更單...'' where name = ''bcs_MPP_AddToChange''';
EXEC SP_EXECUTESQL @UpdateString;
END
SET @PropertyName = 'label_zc'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='ACTION') 
BEGIN
SET @UpdateString = N'update [Innovator].[ACTION] set label_zc = N''添加至变更单...'' where name = ''bcs_MPP_AddToChange''';
EXEC SP_EXECUTESQL @UpdateString;
END
SET @PropertyName = 'label'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='ACTION') 
BEGIN
SET @UpdateString = N'update [Innovator].[ACTION] set label = N''Add Item(s) To Change…'' where name = ''bcs_MPP_AddToChange''';
EXEC SP_EXECUTESQL @UpdateString;
END