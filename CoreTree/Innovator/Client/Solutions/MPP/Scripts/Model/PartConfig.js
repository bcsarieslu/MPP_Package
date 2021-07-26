define([], function() {
	var aras = parent.aras;
	var query = aras.newIOMItem('mpp_PartConfig', 'get');
	query.setProperty('source_id', '507A16AA36F94513AD7EC1F948B5B48F');
	var configInfo = query.apply();
	if (configInfo.isError()) {
		aras.AlertError(configInfo.getErrorString());
		return;
	}
	var configurationObject = {};

	function PopulateConfig(propertyName, defaultPropertyName, valuePreprocessor) {
		var propertyValue = configInfo.getProperty(propertyName);
		var defaultPropertyValue = configInfo.getProperty(defaultPropertyName);
		var configValue = propertyValue || defaultPropertyValue;
		configurationObject[propertyName] = valuePreprocessor && valuePreprocessor(configValue) || configValue;
	}

	function PopulateConfigItemTypeProperty(propertyName, defaultPropertyName) {
		PopulateConfig(propertyName, defaultPropertyName, function(value) {
			//we need to get from Server instead of use just defaultPropertyName to be sure that admin type item type name in right case (upper or lower)
			var itemTypeQuery = aras.newIOMItem('ItemType', 'get');
			itemTypeQuery.setAttribute('select', 'name');
			itemTypeQuery.setProperty('name', value);
			var itemTypeInfo = itemTypeQuery.apply();
			return itemTypeInfo.getProperty('name');
		});
	}

	PopulateConfigItemTypeProperty('part_it_name', 'default_part_it_name');
	PopulateConfig('name_p_name', 'default_name_p_name');
	PopulateConfig('item_number_p_name', 'default_item_number_p_name');
	PopulateConfig('make_buy_p_name', 'default_make_buy_p_name');
	PopulateConfig('phantom_class_path', 'default_phantom_class_path');
	PopulateConfig('mbom_only_class_path', 'default_mbom_only_class_path');
	PopulateConfigItemTypeProperty('bom_it_name', 'default_bom_it_name');
	PopulateConfig('bom_quantity_p_name', 'default_bom_quantity_p_name');
	PopulateConfig('bom_cost_p_name', 'default_bom_cost_p_name');
	PopulateConfigItemTypeProperty('part_alternate_it_name', 'default_part_alternate_it_name');
	PopulateConfigItemTypeProperty('bom_substitute_it_name', 'default_bom_substitute_it_name');

	return configurationObject;
});
