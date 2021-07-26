DECLARE @UpdateString nvarchar(2000)
DECLARE @PropertyName nvarchar(32)
SET @PropertyName = 'label_zt'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='VALUE') 
BEGIN
SET @UpdateString = N'update [Innovator].[VALUE] set label_zt = N''80.製程管理'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''Categories'' and a.value=''MPP'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zt = N''標準資源庫'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''Categories'' and a.value=''MPP/Standard Resource'' )';
EXEC SP_EXECUTESQL @UpdateString;
END
SET @PropertyName = 'label_zc'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='VALUE') 
BEGIN
SET @UpdateString = N'update [Innovator].[VALUE] set label_zc = N''80.工艺管理'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''Categories'' and a.value=''MPP'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zc = N''标准资源库'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''Categories'' and a.value=''MPP/Standard Resource'' )';
EXEC SP_EXECUTESQL @UpdateString;
END
SET @PropertyName = 'label'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='VALUE') 
BEGIN
SET @UpdateString = N'update [Innovator].[VALUE] set label = N''80.MPP'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''Categories'' and a.value=''MPP'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label = N''Resources'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''Categories'' and a.value=''MPP/Standard Resource'' )';
EXEC SP_EXECUTESQL @UpdateString;
END