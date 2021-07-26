DECLARE @UpdateString nvarchar(2000)
DECLARE @PropertyName nvarchar(32)
SET @PropertyName = 'label_zt'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='FIELD') 
BEGIN
SET @UpdateString = N'update [Innovator].[FIELD] set label_zt = N''名稱'' where id = ( select a.id from [innovator].[FIELD] as a left join [innovator].[PROPERTY] as b on a.propertytype_id=b.id left join [innovator].[ITEMTYPE] as c on b.source_id=c.id left join [innovator].[BODY] as d on a.source_id=d.id left join [innovator].[Form] as e on d.source_id=e.id where a.is_current=1 and e.name=''mpp_Step'' and a.name=''name'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[FIELD] set label_zt = N''說明'' where id = ( select a.id from [innovator].[FIELD] as a left join [innovator].[PROPERTY] as b on a.propertytype_id=b.id left join [innovator].[ITEMTYPE] as c on b.source_id=c.id left join [innovator].[BODY] as d on a.source_id=d.id left join [innovator].[Form] as e on d.source_id=e.id where a.is_current=1 and e.name=''mpp_Step'' and a.name=''description'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[FIELD] set label_zt = N''生產週期'' where id = ( select a.id from [innovator].[FIELD] as a left join [innovator].[PROPERTY] as b on a.propertytype_id=b.id left join [innovator].[ITEMTYPE] as c on b.source_id=c.id left join [innovator].[BODY] as d on a.source_id=d.id left join [innovator].[Form] as e on d.source_id=e.id where a.is_current=1 and e.name=''mpp_Step'' and a.name=''cycle_time'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[FIELD] set label_zt = N''生產週期'' where id = ( select a.id from [innovator].[FIELD] as a left join [innovator].[PROPERTY] as b on a.propertytype_id=b.id left join [innovator].[ITEMTYPE] as c on b.source_id=c.id left join [innovator].[BODY] as d on a.source_id=d.id left join [innovator].[Form] as e on d.source_id=e.id where a.is_current=1 and e.name=''mpp_StepQuickEdit'' and a.name=''cycle_time'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[FIELD] set label_zt = N''說明'' where id = ( select a.id from [innovator].[FIELD] as a left join [innovator].[PROPERTY] as b on a.propertytype_id=b.id left join [innovator].[ITEMTYPE] as c on b.source_id=c.id left join [innovator].[BODY] as d on a.source_id=d.id left join [innovator].[Form] as e on d.source_id=e.id where a.is_current=1 and e.name=''mpp_StepQuickEdit'' and a.name=''description'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[FIELD] set label_zt = N''名稱'' where id = ( select a.id from [innovator].[FIELD] as a left join [innovator].[PROPERTY] as b on a.propertytype_id=b.id left join [innovator].[ITEMTYPE] as c on b.source_id=c.id left join [innovator].[BODY] as d on a.source_id=d.id left join [innovator].[Form] as e on d.source_id=e.id where a.is_current=1 and e.name=''mpp_StepQuickEdit'' and a.name=''name'')';
EXEC SP_EXECUTESQL @UpdateString;
END
SET @PropertyName = 'label_zc'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='FIELD') 
BEGIN
SET @UpdateString = N'update [Innovator].[FIELD] set label_zc = N''名称'' where id = ( select a.id from [innovator].[FIELD] as a left join [innovator].[PROPERTY] as b on a.propertytype_id=b.id left join [innovator].[ITEMTYPE] as c on b.source_id=c.id left join [innovator].[BODY] as d on a.source_id=d.id left join [innovator].[Form] as e on d.source_id=e.id where a.is_current=1 and e.name=''mpp_Step'' and a.name=''name'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[FIELD] set label_zc = N''说明'' where id = ( select a.id from [innovator].[FIELD] as a left join [innovator].[PROPERTY] as b on a.propertytype_id=b.id left join [innovator].[ITEMTYPE] as c on b.source_id=c.id left join [innovator].[BODY] as d on a.source_id=d.id left join [innovator].[Form] as e on d.source_id=e.id where a.is_current=1 and e.name=''mpp_Step'' and a.name=''description'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[FIELD] set label_zc = N''生产周期'' where id = ( select a.id from [innovator].[FIELD] as a left join [innovator].[PROPERTY] as b on a.propertytype_id=b.id left join [innovator].[ITEMTYPE] as c on b.source_id=c.id left join [innovator].[BODY] as d on a.source_id=d.id left join [innovator].[Form] as e on d.source_id=e.id where a.is_current=1 and e.name=''mpp_Step'' and a.name=''cycle_time'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[FIELD] set label_zc = N''生产周期'' where id = ( select a.id from [innovator].[FIELD] as a left join [innovator].[PROPERTY] as b on a.propertytype_id=b.id left join [innovator].[ITEMTYPE] as c on b.source_id=c.id left join [innovator].[BODY] as d on a.source_id=d.id left join [innovator].[Form] as e on d.source_id=e.id where a.is_current=1 and e.name=''mpp_StepQuickEdit'' and a.name=''cycle_time'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[FIELD] set label_zc = N''说明'' where id = ( select a.id from [innovator].[FIELD] as a left join [innovator].[PROPERTY] as b on a.propertytype_id=b.id left join [innovator].[ITEMTYPE] as c on b.source_id=c.id left join [innovator].[BODY] as d on a.source_id=d.id left join [innovator].[Form] as e on d.source_id=e.id where a.is_current=1 and e.name=''mpp_StepQuickEdit'' and a.name=''description'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[FIELD] set label_zc = N''名称'' where id = ( select a.id from [innovator].[FIELD] as a left join [innovator].[PROPERTY] as b on a.propertytype_id=b.id left join [innovator].[ITEMTYPE] as c on b.source_id=c.id left join [innovator].[BODY] as d on a.source_id=d.id left join [innovator].[Form] as e on d.source_id=e.id where a.is_current=1 and e.name=''mpp_StepQuickEdit'' and a.name=''name'')';
EXEC SP_EXECUTESQL @UpdateString;
END