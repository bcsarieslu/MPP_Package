DECLARE @UpdateString nvarchar(2000)
DECLARE @PropertyName nvarchar(32)
SET @PropertyName = 'HEADER_ZT'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='rb_ColumnDefinition') 
BEGIN
SET @UpdateString = N'update [Innovator].[rb_ColumnDefinition] set HEADER_ZT = N''狀態'' where id = ''0F0EC21A186B4AD3B42B2E80F3F31BFF''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[rb_ColumnDefinition] set HEADER_ZT = N''名稱'' where id = ''17C8C884C736478C8E3657BC067133C4''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[rb_ColumnDefinition] set HEADER_ZT = N''創建者'' where id = ''20044C0C51F94CB999A007CCA736B84F''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[rb_ColumnDefinition] set HEADER_ZT = N''所有權人'' where id = ''45E3FC37A02B48BF9B0B36476F18DB67''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[rb_ColumnDefinition] set HEADER_ZT = N''工藝流程規劃編號'' where id = ''61734EFC96FB41AB8F8A7A0737AE9F5F''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[rb_ColumnDefinition] set HEADER_ZT = N''版本'' where id = ''D915603335AC4FA1BA7B4DAAEEF1FF40''';
EXEC SP_EXECUTESQL @UpdateString;
END
SET @PropertyName = 'HEADER_ZC'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='rb_ColumnDefinition') 
BEGIN
SET @UpdateString = N'update [Innovator].[rb_ColumnDefinition] set HEADER_ZC = N''状态'' where id = ''0F0EC21A186B4AD3B42B2E80F3F31BFF''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[rb_ColumnDefinition] set HEADER_ZC = N''名称'' where id = ''17C8C884C736478C8E3657BC067133C4''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[rb_ColumnDefinition] set HEADER_ZC = N''创建者'' where id = ''20044C0C51F94CB999A007CCA736B84F''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[rb_ColumnDefinition] set HEADER_ZC = N''所有权人'' where id = ''45E3FC37A02B48BF9B0B36476F18DB67''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[rb_ColumnDefinition] set HEADER_ZC = N''工艺流程规划编号'' where id = ''61734EFC96FB41AB8F8A7A0737AE9F5F''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[rb_ColumnDefinition] set HEADER_ZC = N''版本'' where id = ''D915603335AC4FA1BA7B4DAAEEF1FF40''';
EXEC SP_EXECUTESQL @UpdateString;
END
SET @PropertyName = 'HEADER'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='rb_ColumnDefinition') 
BEGIN
SET @UpdateString = N'update [Innovator].[rb_ColumnDefinition] set HEADER = N''state'' where id = ''0F0EC21A186B4AD3B42B2E80F3F31BFF''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[rb_ColumnDefinition] set HEADER = N''name'' where id = ''17C8C884C736478C8E3657BC067133C4''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[rb_ColumnDefinition] set HEADER = N''creator'' where id = ''20044C0C51F94CB999A007CCA736B84F''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[rb_ColumnDefinition] set HEADER = N''owner'' where id = ''45E3FC37A02B48BF9B0B36476F18DB67''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[rb_ColumnDefinition] set HEADER = N''Process planning number'' where id = ''61734EFC96FB41AB8F8A7A0737AE9F5F''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [Innovator].[rb_ColumnDefinition] set HEADER = N''versions'' where id = ''D915603335AC4FA1BA7B4DAAEEF1FF40''';
EXEC SP_EXECUTESQL @UpdateString;
END