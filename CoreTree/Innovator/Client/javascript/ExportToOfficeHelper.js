function ExportToOfficeHelper(args) {
	this.aras = args.aras;
	this.baseSourceWorksheetName = 'Innovator';
	this.baseRelatedWorksheetName = 'RelationshipsTab';
}

ExportToOfficeHelper.prototype.saveContentToFile = function (
	content,
	extension,
	fileName
) {
	let ext = extension ? extension.toLowerCase() : 'unk';
	let fileNamePrefix = fileName || 'export2unknown_type';
	let mimeType = '';

	if (ext.indexOf('excel') !== -1) {
		ext = 'xls';
		mimeType = 'application/excel';
		//Modify by tengz 2019/7/2
		//修复方法使其可以接收fileName
		// fileNamePrefix = this.aras.getResource(
			// '',
			// 'aras_object.export2excel_file_prefix'
		// );
		fileNamePrefix = fileName||this.aras.getResource('', 'aras_object.export2excel_file_prefix');
	} else if (ext.indexOf('word') !== -1) {
		ext = 'doc';
		mimeType = 'application/msword';
		//Modify by tengz 2019/7/2
		//修复方法使其可以接收fileName
		// fileNamePrefix = this.aras.getResource(
			// '',
			// 'aras_object.export2word_file_prefix'
		// );
		fileNamePrefix = fileName||this.aras.getResource('', 'aras_object.export2word_file_prefix');
	}

	const blob = new Blob([content], { type: mimeType });
	ArasModules.vault.saveBlob(blob, fileNamePrefix + '.' + ext);
};

ExportToOfficeHelper.prototype.exportToWord = function (content, itemNode) {
	let html = this._generateHtmlForExportToWord(content);
	if (itemNode && itemNode.xml) {
		const itemTypeNd = this.aras.getItemTypeForClient(
			itemNode.getAttribute('type'),
			'name'
		).node;
		if (itemTypeNd) {
			const itemTypeID = itemTypeNd.getAttribute('id');
			const resDom = this.aras.createXMLDocument();
			resDom.loadXML('<Result>' + itemNode.xml + '</Result>');

			const propNds = itemTypeNd.selectNodes(
				'Relationships/Item[@type="Property"]'
			);
			this.aras.convertFromNeutralAllValues(
				resDom.selectSingleNode('/Result/Item')
			);

			this.aras.uiPrepareDOM4GridXSLT(resDom);
			const gridXml = this.aras.uiGenerateGridXML(
				resDom,
				propNds,
				null,
				itemTypeID,
				{ mode: 'forExport2Html' },
				true
			);
			let tmpHtml = this._generateHtmlForExportToWord(gridXml);
			if (tmpHtml.indexOf('<th') === -1) {
				const trIndex = tmpHtml.indexOf('<tr');
				tmpHtml =
					tmpHtml.substr(0, trIndex) +
					this._generateTableHeadersForExportToWord(propNds) +
					tmpHtml.substr(trIndex);
			}

			const i = html.indexOf('<table');
			const i2 = tmpHtml.indexOf('<table');
			const i3 = tmpHtml.lastIndexOf('</table>');
			if (i > 0) {
				html =
					html.substr(0, i) +
					tmpHtml.substr(i2, i3 - i2 + 8) +
					'<br/>' +
					html.substr(i);
			}
		}
	}
	this.saveContentToFile(html, 'word');
};

ExportToOfficeHelper.prototype._generateTableHeadersForExportToWord = function (
	properties
) {
	const tmpDom = this.aras.createXMLDocument();
	tmpDom.loadXML('<tr/>');
	for (let i = 0; i < properties.length; i++) {
		const propertyNode = properties[i];
		const newTh = tmpDom.documentElement.appendChild(
			tmpDom.createElement('th')
		);
		newTh.setAttribute('align', 'center');
		newTh.setAttribute('style', 'background-color:#d4d0c8;');
		newTh.text =
			this.aras.getItemProperty(propertyNode, 'label') ||
			this.aras.getItemProperty(propertyNode, 'name');
	}
	return tmpDom.xml;
};

ExportToOfficeHelper.prototype._generateHtmlForExportToWord = function (
	content
) {
	let res = '';
	const gridDom = this.aras.createXMLDocument();

	gridDom.loadXML(content || '<table></table>');
	if (gridDom.parseError.errorCode == 0) {
		const tableNode = gridDom.selectSingleNode('//table');
		if (tableNode) {
			tableNode.setAttribute('base_href', this.aras.getScriptsURL());
		}
		res = this.aras.applyXsltFile(
			gridDom,
			this.aras.getScriptsURL() + '../styles/printGrid4Export.xsl'
		);
	}
	return res;
};

ExportToOfficeHelper.prototype.exportToExcel = function (
	content,
	itemNode,
	sourceWorksheetName,
	relatedWorksheetName
) {
	let result;
	let relatedResult;
	let itemTypeNode;
	const itemNodeExists = itemNode && itemNode.xml;
	if (itemNodeExists) {
		itemTypeNode = this.aras.getItemTypeForClient(
			itemNode.getAttribute('type'),
			'name'
		).node;
	}

	sourceWorksheetName =
		sourceWorksheetName || itemTypeNode
			? this.aras.getItemProperty(itemTypeNode, 'name')
			: this.baseSourceWorksheetName;

	if (content !== '') {
		const contentDocument = this.aras.createXMLDocument();
		contentDocument.loadXML(content);
		const workSheetName = itemNodeExists
			? relatedWorksheetName || this.baseRelatedWorksheetName
			: sourceWorksheetName;
		result = this._generateXMLForExportToExcel(contentDocument, workSheetName);
	}

	if (itemNodeExists && itemTypeNode) {
		const itemTypeId = itemTypeNode.getAttribute('id');
		const resultNode = this.aras.createXMLDocument();
		resultNode.loadXML('<Result>' + itemNode.xml + '</Result>');

		const propertyNodes = itemTypeNode.selectNodes(
			'Relationships/Item[@type="Property"]'
		);

		this.aras.uiPrepareDOM4GridXSLT(resultNode);

		const gridXml = this.aras.uiGenerateGridXML(
			resultNode,
			propertyNodes,
			null,
			itemTypeId,
			{ mode: 'forExport2Html' },
			true
		);
		const itemContentDocument = this.aras.createXMLDocument();
		itemContentDocument.loadXML(gridXml);

		this._generateTableHeadersForExportToExcel(
			itemContentDocument,
			propertyNodes
		);
		this._generateColumnsForExportToExcel(itemContentDocument, propertyNodes);
		relatedResult = this._generateXMLForExportToExcel(
			itemContentDocument,
			sourceWorksheetName
		);
	}

	if (result && relatedResult) {
		result = this._mergeWorksheets(result, relatedResult);
	} else if (relatedResult) {
		result = relatedResult;
	}

	this.saveContentToFile(result, 'excel');
};

ExportToOfficeHelper.prototype._mergeWorksheets = function (
	sourceWorksheet,
	relatedWorksheet
) {
	const styleXpath = 'descendant-or-self::*[local-name()="Styles"]';
	const worksheetXpath = 'descendant-or-self::*[local-name()="Worksheet"]';

	const relatedResultNode = this.aras.createXMLDocument();
	relatedResultNode.loadXML(relatedWorksheet);
	const relatedResultStyles = relatedResultNode.selectSingleNode(styleXpath);

	const resultNode = this.aras.createXMLDocument();
	resultNode.loadXML(sourceWorksheet);
	const resultStyles = resultNode.selectSingleNode(styleXpath);

	// merge all styles from from and relationships grid
	let result =
		'<?xml version="1.0"?><ss:Workbook xmlns:p="urn:ExportBook" xmlns:msxsl="urn:schemas-microsoft-com:xslt" ' +
		'xmlns:usr="urn:the-xml-files:xslt" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">';
	const stylesXml = resultStyles.xml.replace(/<ss:Styles(.*?)>/g, '');
	result += relatedResultStyles.xml.replace('</ss:Styles>', stylesXml);

	// merge two worksheets
	const relatedWorksheetNode = relatedResultNode.selectSingleNode(
		worksheetXpath
	);
	if (relatedWorksheetNode) {
		result += relatedWorksheetNode.xml;
	}

	const sourceWorksheetNode = resultNode.selectSingleNode(worksheetXpath);
	if (sourceWorksheetNode) {
		result += sourceWorksheetNode.xml;
	}

	result += '</ss:Workbook>';

	return result;
};

ExportToOfficeHelper.prototype._generateColumnsForExportToExcel = function (
	structureDocument,
	properties
) {
	const columnsNode = structureDocument.selectSingleNode(
		'descendant-or-self::*[local-name()="columns"]'
	);
	if (columnsNode.childNodes.length == 0) {
		for (let i = 0; i < properties.length; i++) {
			const propertyNode = properties[i];
			const type = this.aras.getItemProperty(propertyNode, 'data_type');
			const widthAttr =
				(
					this.aras.getItemProperty(propertyNode, 'label') ||
					this.aras.getItemProperty(propertyNode, 'name')
				).length * 8;
			const newColumn = columnsNode.appendChild(
				structureDocument.createElement('column')
			);
			newColumn.setAttribute('width', widthAttr);
			newColumn.setAttribute('order', i);

			if (type === 'date') {
				newColumn.setAttribute('sort', 'DATE');
			} else if (
				type === 'integer' ||
				type === 'float' ||
				type === 'decimal' ||
				type === 'global_version' ||
				type === 'ubigint'
			) {
				newColumn.setAttribute('sort', 'NUMERIC');
			}
		}
	}
};

ExportToOfficeHelper.prototype._generateTableHeadersForExportToExcel = function (
	structureDocument,
	properties
) {
	const theadNode = structureDocument.selectSingleNode(
		'descendant-or-self::*[local-name()="thead"]'
	);
	if (theadNode.childNodes.length === 0) {
		for (let i = 0; i < properties.length; i++) {
			const propertyNode = properties[i];
			const newTh = theadNode.appendChild(
				structureDocument.createElement('th')
			);
			newTh.setAttribute('align', 'c');
			newTh.text =
				this.aras.getItemProperty(propertyNode, 'label') ||
				this.aras.getItemProperty(propertyNode, 'name');
		}
	}
};

ExportToOfficeHelper.prototype._generateXMLForExportToExcel = function (
	structureDocument,
	workSheetName
) {
	const tableNode = structureDocument.selectSingleNode(
		'descendant-or-self::*[local-name()="table"]'
	);
	if (tableNode) {
		tableNode.setAttribute('base_href', this.aras.getScriptsURL());

		if (workSheetName) {
			tableNode.setAttribute('workSheet', workSheetName);
		}
	}
	const xslt = ArasModules.xml.parseFile(
		this.aras.getScriptsURL() + '../styles/printGrid4ExportToExcel.xsl'
	);
	return ArasModules.xml.transform(structureDocument, xslt);
};
