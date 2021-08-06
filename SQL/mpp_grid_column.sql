DECLARE @UpdateString nvarchar(2000)
DECLARE @PropertyName nvarchar(32)
SET @PropertyName = 'label_zt'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='Grid_Column') 
BEGIN
SET @UpdateString = N'update [Innovator].[Grid_Column] set label_zt = N''特性描述'' where id = ''A663AB5042E44836A5C816ACF3204162''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[Grid_Column] set label_zt = N''產品或過程特性'' where id = ''EE5A1A9ADA5B4CC6AE5B2EA3B8ED8C5C''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[Grid_Column] set label_zt = N''特性分類'' where id = ''01CC5F676860434F937A2358A7FA0E9D''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[Grid_Column] set label_zt = N''特殊特性編號'' where id = ''D6EBCD98B397420F98DBD758B5399BE6''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[Grid_Column] set label_zt = N''特殊特性圖示'' where id = ''A414B460FDDB45008C3D7C04A4156CFB''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[Grid_Column] set label_zt = N''目標'' where id = ''648C98A6846B4CD8894FE0172396F5FE''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[Grid_Column] set label_zt = N''公差'' where id = ''A88209ED599147578C511F29FC019C23''';
EXEC SP_EXECUTESQL @UpdateString;
END
SET @PropertyName = 'label_zc'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='Grid_Column') 
BEGIN
SET @UpdateString = N'update [Innovator].[Grid_Column] set label_zc = N''特性描述'' where name = ''A663AB5042E44836A5C816ACF3204162''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[Grid_Column] set label_zc = N''产品或过程特性'' where id = ''EE5A1A9ADA5B4CC6AE5B2EA3B8ED8C5C''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[Grid_Column] set label_zc = N''特性分类'' where id = ''01CC5F676860434F937A2358A7FA0E9D''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[Grid_Column] set label_zc = N''特殊特性编号'' where id = ''D6EBCD98B397420F98DBD758B5399BE6''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[Grid_Column] set label_zc = N''特殊特性图示'' where id = ''A414B460FDDB45008C3D7C04A4156CFB''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[Grid_Column] set label_zc = N''目标'' where id = ''648C98A6846B4CD8894FE0172396F5FE''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[Grid_Column] set label_zc = N''公差'' where id = ''A88209ED599147578C511F29FC019C23''';
EXEC SP_EXECUTESQL @UpdateString;
END
SET @PropertyName = 'label'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='Grid_Column') 
BEGIN
SET @UpdateString = N'update [Innovator].[Grid_Column] set label = N''SpChar Description'' where name = ''A663AB5042E44836A5C816ACF3204162''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[Grid_Column] set label = N''Product or Process SpChar'' where id = ''EE5A1A9ADA5B4CC6AE5B2EA3B8ED8C5C''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[Grid_Column] set label = N''SpChar Class'' where id = ''01CC5F676860434F937A2358A7FA0E9D''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[Grid_Column] set label = N''SpChar Number'' where id = ''D6EBCD98B397420F98DBD758B5399BE6''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[Grid_Column] set label = N''PQD SpChar Image'' where id = ''A414B460FDDB45008C3D7C04A4156CFB''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[Grid_Column] set label = N''Target'' where id = ''648C98A6846B4CD8894FE0172396F5FE''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[Grid_Column] set label = N''Tolerance'' where id = ''A88209ED599147578C511F29FC019C23''';
EXEC SP_EXECUTESQL @UpdateString;
END