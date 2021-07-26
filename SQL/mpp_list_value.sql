DECLARE @UpdateString nvarchar(2000)
DECLARE @PropertyName nvarchar(32)
SET @PropertyName = 'label_zt'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='VALUE') 
BEGIN
SET @UpdateString = N'update [Innovator].[VALUE] set label_zt = N''PDF'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''mpp_PublishingConversionFormat'' and a.value=''pdf'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zt = N''HTML'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''mpp_PublishingConversionFormat'' and a.value=''html'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zt = N''Word'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''mpp_PublishingConversionFormat'' and a.value=''word'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zt = N''Excel'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''mpp_PublishingConversionFormat'' and a.value=''excel'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zt = N''瀏覽器開啟'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''mpp_PublishingConversionResult'' and a.value=''window'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zt = N''存檔'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''mpp_PublishingConversionResult'' and a.value=''file'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zt = N''機械加工'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''bcs_mpp_OperationType'' and a.value=''0'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zt = N''裝配'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''bcs_mpp_OperationType'' and a.value=''1'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zt = N''一般工具'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''bcs_mpp_toolType'' and a.value=''tool'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zt = N''工裝'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''bcs_mpp_toolType'' and a.value=''tooling'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zt = N''模具'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''bcs_mpp_toolType'' and a.value=''mool'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zt = N''檢具'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''bcs_mpp_toolType'' and a.value=''checktool'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zt = N''夾具'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''bcs_mpp_toolType'' and a.value=''fixture'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zt = N''量具'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''bcs_mpp_toolType'' and a.value=''measuringtool'' )';
EXEC SP_EXECUTESQL @UpdateString;
END
SET @PropertyName = 'label_zc'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='VALUE') 
BEGIN
SET @UpdateString = N'update [Innovator].[VALUE] set label_zc = N''PDF'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''mpp_PublishingConversionFormat'' and a.value=''pdf'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zc = N''HTML'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''mpp_PublishingConversionFormat'' and a.value=''html'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zc = N''Word'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''mpp_PublishingConversionFormat'' and a.value=''word'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zc = N''Excel'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''mpp_PublishingConversionFormat'' and a.value=''excel'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zc = N''浏览器开启'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''mpp_PublishingConversionResult'' and a.value=''window'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zc = N''存档'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''mpp_PublishingConversionResult'' and a.value=''file'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zc = N''机械加工'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''bcs_mpp_OperationType'' and a.value=''0'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zc = N''装配'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''bcs_mpp_OperationType'' and a.value=''1'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zc = N''一般工具'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''bcs_mpp_toolType'' and a.value=''tool'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zc = N''工装'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''bcs_mpp_toolType'' and a.value=''tooling'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zc = N''模具'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''bcs_mpp_toolType'' and a.value=''mool'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zc = N''检具'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''bcs_mpp_toolType'' and a.value=''checktool'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zc = N''夹具'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''bcs_mpp_toolType'' and a.value=''fixture'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label_zc = N''量具'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''bcs_mpp_toolType'' and a.value=''measuringtool'' )';
EXEC SP_EXECUTESQL @UpdateString;
END
SET @PropertyName = 'label'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='VALUE') 
BEGIN
SET @UpdateString = N'update [Innovator].[VALUE] set label = N''PDF'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''mpp_PublishingConversionFormat'' and a.value=''pdf'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label = N''HTML'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''mpp_PublishingConversionFormat'' and a.value=''html'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label = N''Word'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''mpp_PublishingConversionFormat'' and a.value=''word'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label = N''Excel'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''mpp_PublishingConversionFormat'' and a.value=''excel'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label = N''Show in browser'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''mpp_PublishingConversionResult'' and a.value=''window'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label = N''Save to file'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''mpp_PublishingConversionResult'' and a.value=''file'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label = N''Machining'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''bcs_mpp_OperationType'' and a.value=''0'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label = N''Assembly'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''bcs_mpp_OperationType'' and a.value=''1'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label = N''General tools'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''bcs_mpp_toolType'' and a.value=''tool'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label = N''Tooling'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''bcs_mpp_toolType'' and a.value=''tooling'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label = N''Mool'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''bcs_mpp_toolType'' and a.value=''mool'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label = N''Check tool'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''bcs_mpp_toolType'' and a.value=''checktool'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label = N''Fixture'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''bcs_mpp_toolType'' and a.value=''fixture'' )';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[VALUE] set label = N''Measuring tool'' where id = ( select a.id from [innovator].[VALUE] as a left join [innovator].[LIST] as b on a.source_id=b.id where a.is_current=1 and b.name=''bcs_mpp_toolType'' and a.value=''measuringtool'' )';
EXEC SP_EXECUTESQL @UpdateString;
END