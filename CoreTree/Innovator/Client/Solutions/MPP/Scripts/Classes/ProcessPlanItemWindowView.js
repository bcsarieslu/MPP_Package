ModulesManager.define(
	['aras.innovator.core.ItemWindow/DefaultItemWindowView'],
	'aras.innovator.solutions.MPP/ProcessPlanItemWindowView',
	function(DefaultItemWindowView) {
		function ProcessPlanItemWindowView(inDom, inArgs) {
			DefaultItemWindowView.call(this, inDom, inArgs);
		}

		ProcessPlanItemWindowView.prototype = new DefaultItemWindowView();

		ProcessPlanItemWindowView.prototype.getViewUrl = function() {
			return '/Solutions/MPP/ProcessPlanItemWindowLayout';
		};

		return ProcessPlanItemWindowView;
	});
