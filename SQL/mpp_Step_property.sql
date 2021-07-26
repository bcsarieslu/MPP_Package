DECLARE @UpdateString nvarchar(2000)
DECLARE @PropertyName nvarchar(32)
SET @PropertyName = 'label_zt'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='PROPERTY') 
BEGIN
SET @UpdateString = N'update [Innovator].[PROPERTY] set label_zt = N'''' where id = (select a.id from [innovator].[PROPERTY] as a left join [innovator].[ITEMTYPE] as b on a.source_id=b.id where b.name=''mpp_Step'' and a.is_current=1 and a.name=''is_released'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[PROPERTY] set label_zt = N'''' where id = (select a.id from [innovator].[PROPERTY] as a left join [innovator].[ITEMTYPE] as b on a.source_id=b.id where b.name=''mpp_Step'' and a.is_current=1 and a.name=''team_id'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[PROPERTY] set label_zt = N''說明'' where id = (select a.id from [innovator].[PROPERTY] as a left join [innovator].[ITEMTYPE] as b on a.source_id=b.id where b.name=''mpp_Step'' and a.is_current=1 and a.name=''description'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[PROPERTY] set label_zt = N''生產週期'' where id = (select a.id from [innovator].[PROPERTY] as a left join [innovator].[ITEMTYPE] as b on a.source_id=b.id where b.name=''mpp_Step'' and a.is_current=1 and a.name=''cycle_time'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[PROPERTY] set label_zt = N''地區'' where id = (select a.id from [innovator].[PROPERTY] as a left join [innovator].[ITEMTYPE] as b on a.source_id=b.id where b.name=''mpp_Step'' and a.is_current=1 and a.name=''bcs_location'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[PROPERTY] set label_zt = N'''' where id = (select a.id from [innovator].[PROPERTY] as a left join [innovator].[ITEMTYPE] as b on a.source_id=b.id where b.name=''mpp_Step'' and a.is_current=1 and a.name=''classification'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[PROPERTY] set label_zt = N''名稱'' where id = (select a.id from [innovator].[PROPERTY] as a left join [innovator].[ITEMTYPE] as b on a.source_id=b.id where b.name=''mpp_Step'' and a.is_current=1 and a.name=''name'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[PROPERTY] set label_zt = N'''' where id = (select a.id from [innovator].[PROPERTY] as a left join [innovator].[ITEMTYPE] as b on a.source_id=b.id where b.name=''mpp_Step'' and a.is_current=1 and a.name=''wi_details'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[PROPERTY] set label_zt = N'''' where id = (select a.id from [innovator].[PROPERTY] as a left join [innovator].[ITEMTYPE] as b on a.source_id=b.id where b.name=''mpp_Step'' and a.is_current=1 and a.name=''sort_order'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[PROPERTY] set label_zt = N'''' where id = (select a.id from [innovator].[PROPERTY] as a left join [innovator].[ITEMTYPE] as b on a.source_id=b.id where b.name=''mpp_Step'' and a.is_current=1 and a.name=''not_lockable'')';
EXEC SP_EXECUTESQL @UpdateString;
END
SET @PropertyName = 'label_zc'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='PROPERTY') 
BEGIN
SET @UpdateString = N'update [Innovator].[PROPERTY] set label_zc = N'''' where id = (select a.id from [innovator].[PROPERTY] as a left join [innovator].[ITEMTYPE] as b on a.source_id=b.id where b.name=''mpp_Step'' and a.is_current=1 and a.name=''is_released'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[PROPERTY] set label_zc = N'''' where id = (select a.id from [innovator].[PROPERTY] as a left join [innovator].[ITEMTYPE] as b on a.source_id=b.id where b.name=''mpp_Step'' and a.is_current=1 and a.name=''team_id'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[PROPERTY] set label_zc = N''说明'' where id = (select a.id from [innovator].[PROPERTY] as a left join [innovator].[ITEMTYPE] as b on a.source_id=b.id where b.name=''mpp_Step'' and a.is_current=1 and a.name=''description'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[PROPERTY] set label_zc = N''生产周期'' where id = (select a.id from [innovator].[PROPERTY] as a left join [innovator].[ITEMTYPE] as b on a.source_id=b.id where b.name=''mpp_Step'' and a.is_current=1 and a.name=''cycle_time'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[PROPERTY] set label_zc = N''地区'' where id = (select a.id from [innovator].[PROPERTY] as a left join [innovator].[ITEMTYPE] as b on a.source_id=b.id where b.name=''mpp_Step'' and a.is_current=1 and a.name=''bcs_location'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[PROPERTY] set label_zc = N'''' where id = (select a.id from [innovator].[PROPERTY] as a left join [innovator].[ITEMTYPE] as b on a.source_id=b.id where b.name=''mpp_Step'' and a.is_current=1 and a.name=''classification'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[PROPERTY] set label_zc = N''名称'' where id = (select a.id from [innovator].[PROPERTY] as a left join [innovator].[ITEMTYPE] as b on a.source_id=b.id where b.name=''mpp_Step'' and a.is_current=1 and a.name=''name'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[PROPERTY] set label_zc = N'''' where id = (select a.id from [innovator].[PROPERTY] as a left join [innovator].[ITEMTYPE] as b on a.source_id=b.id where b.name=''mpp_Step'' and a.is_current=1 and a.name=''wi_details'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[PROPERTY] set label_zc = N'''' where id = (select a.id from [innovator].[PROPERTY] as a left join [innovator].[ITEMTYPE] as b on a.source_id=b.id where b.name=''mpp_Step'' and a.is_current=1 and a.name=''sort_order'')';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[PROPERTY] set label_zc = N'''' where id = (select a.id from [innovator].[PROPERTY] as a left join [innovator].[ITEMTYPE] as b on a.source_id=b.id where b.name=''mpp_Step'' and a.is_current=1 and a.name=''not_lockable'')';
EXEC SP_EXECUTESQL @UpdateString;
END