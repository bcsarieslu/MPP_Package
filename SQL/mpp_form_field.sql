DECLARE @UpdateString nvarchar(2000)
DECLARE @PropertyName nvarchar(32)
SET @PropertyName = 'label_zt'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='FIELD') 
BEGIN
SET @UpdateString = N'update [innovator].[FIELD] set label_zt=N''工時定額'' where id=''6E0CEA22A7B949D1BCE41086775741FA''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label_zt=N''工序類型'' where id=''C7EA35FEB35B4979B0B7AF2D80E2695A''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label_zt=N''生產時間'' where id=''B10DE7A2B14A4ECDA2113DCF5EA9C223''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label_zt=N''說明'' where id=''7F3E1FB0424B48ACAF9D2B274067000A''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label_zt=N''名稱'' where id=''9603A72160CF48BB87F19D69E9016A1A''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label_zt=N''準備時間'' where id=''3C5116F3DBF5491090B52877134A360C''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label_zt=N''製程編號'' where id=''AC7CF2540CD14C2D94D4997F5AA99212''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label_zt=N''生產週期'' where id=''526CD72CE4904F608F4DF954066407CA''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label_zt=N''名稱'' where id=''EE0535342C7242AEB625A871CE4415B8''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label_zt=N''物料編號'' where id=''71110787FC474100AD084F1773407032''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label_zt=N''料件名稱'' where id=''5364688A8F1244CCADE2BB1B10DB648A''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label_zt=N''樣本頻率'' where id=''22C4C1B565D742589F8FC608E94D1E2C''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label_zt=N''樣本容量'' where id=''CE603FC172BA412DA79A413E91FCACD4''';
EXEC SP_EXECUTESQL @UpdateString;
END
SET @PropertyName = 'label_zc'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='FIELD') 
BEGIN
SET @UpdateString = N'update [innovator].[FIELD] set label_zc=N''工时定额'' where id=''6E0CEA22A7B949D1BCE41086775741FA''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label_zc=N''工序类型'' where id=''C7EA35FEB35B4979B0B7AF2D80E2695A''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label_zc=N''生产时间'' where id=''B10DE7A2B14A4ECDA2113DCF5EA9C223''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label_zc=N''说明'' where id=''7F3E1FB0424B48ACAF9D2B274067000A''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label_zc=N''名称'' where id=''9603A72160CF48BB87F19D69E9016A1A''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label_zc=N''准备时间'' where id=''3C5116F3DBF5491090B52877134A360C''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label_zc=N''制程编号'' where id=''AC7CF2540CD14C2D94D4997F5AA99212''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label_zc=N''生产周期'' where id=''526CD72CE4904F608F4DF954066407CA''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label_zc=N''名称'' where id=''EE0535342C7242AEB625A871CE4415B8''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label_zc=N''物料编号'' where id=''71110787FC474100AD084F1773407032''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label_zc=N''料件名称'' where id=''5364688A8F1244CCADE2BB1B10DB648A''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label_zc=N''样本频率'' where id=''22C4C1B565D742589F8FC608E94D1E2C''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label_zc=N''样本容量'' where id=''CE603FC172BA412DA79A413E91FCACD4''';
EXEC SP_EXECUTESQL @UpdateString;
END
SET @PropertyName = 'label'
If exists (select * from information_schema.columns where COLUMN_NAME=@PropertyName and TABLE_NAME='FIELD') 
BEGIN
SET @UpdateString = N'update [innovator].[FIELD] set label=N''hour norm'' where id=''6E0CEA22A7B949D1BCE41086775741FA''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label=N''Operation type'' where id=''C7EA35FEB35B4979B0B7AF2D80E2695A''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label=N''Cycle Time'' where id=''B10DE7A2B14A4ECDA2113DCF5EA9C223''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label=N''Description'' where id=''7F3E1FB0424B48ACAF9D2B274067000A''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label=N''Name'' where id=''9603A72160CF48BB87F19D69E9016A1A''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label=N''Setup Time'' where id=''3C5116F3DBF5491090B52877134A360C''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label=N''Operation Number'' where id=''AC7CF2540CD14C2D94D4997F5AA99212''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label=N''Cycle Time'' where id=''526CD72CE4904F608F4DF954066407CA''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label=N''Name'' where id=''EE0535342C7242AEB625A871CE4415B8''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label=N''Part Number'' where id=''71110787FC474100AD084F1773407032''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label=N''Name'' where id=''5364688A8F1244CCADE2BB1B10DB648A''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label=N''Sample Frequency'' where id=''22C4C1B565D742589F8FC608E94D1E2C''';
EXEC SP_EXECUTESQL @UpdateString;
SET @UpdateString = N'update [innovator].[FIELD] set label_zc=N''Sample Size'' where id=''CE603FC172BA412DA79A413E91FCACD4''';
EXEC SP_EXECUTESQL @UpdateString;
END

