DECLARE @UpdateString nvarchar(2000)
DECLARE @PropertyName nvarchar(32)
SET @PropertyName = 'label_zt'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='CommandBarDropDown') 
BEGIN
SET @UpdateString = N'update [Innovator].[CommandBarDropDown] set label_zt = N''廠區:'' where id = ''29E700EDF7D649838671B90E2D1D498D''';
EXEC SP_EXECUTESQL @UpdateString;
END
SET @PropertyName = 'label_zc'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='CommandBarDropDown') 
BEGIN
SET @UpdateString = N'update [Innovator].[CommandBarDropDown] set label_zc = N''厂区:'' where id = ''29E700EDF7D649838671B90E2D1D498D''';
EXEC SP_EXECUTESQL @UpdateString;
END
SET @PropertyName = 'label'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='CommandBarDropDown') 
BEGIN
SET @UpdateString = N'update [Innovator].[CommandBarDropDown] set label = N''Location:'' where id = ''29E700EDF7D649838671B90E2D1D498D''';
EXEC SP_EXECUTESQL @UpdateString;
END