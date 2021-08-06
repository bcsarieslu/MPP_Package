define([
	'dojo/_base/declare',
	'dijit/dijit',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
	'dijit/_WidgetsInTemplateMixin',
	'dijit/layout/ContentPane',
	'Controls/SimpleTabContainer',
	'CMF/Scripts/CMFViewer',
	'CMF/Scripts/Find/FindControl'
], function (
	declare,
	dijit,
	_WidgetBase,
	_TemplatedMixin,
	_WidgetsInTemplateMixin,
	ContentPane,
	SimpleTabContainer,
	_prevCmfViewer,
	FindControl
) {
	declare(
		'CMFContainer',
		[_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],
		{
			widgetsInTemplate: true,
			templateString:
				"<div style='height:100%'>" +
				"<div id='cmfMainToolbarContainer' data-dojo-type='dijit/layout/ContentPane'" +
				' style="padding: 0px;" data-dojo-props=\'region:"top", doLayout: false\'></div>' +
				"<div data-dojo-type='Controls/SimpleTabContainer' id='cmfTabContainer' style='height: calc(100% - 31px)'></div>" +
				'</div>',
			qpWindow: null,
			constructor: function (args) {
				this.args = args;
			},

			init: function () {
				var self = this;
				this.views = this.getViews();
				this.tabContainer = dijit.byId('cmfTabContainer');
				this.set('fixedSidebarButtonId', 'cmf_show_editor');
				this.tabContainer.set('noSidebar', true);
				for (var i = 0; i < this.views.length; i++) {
					var cmfViewer = new CMFViewer();
					this.tabContainer.createTab(cmfViewer, this.views[i].id);
				}

				// sidebar is loaded by _tabItemViewLayout.js later and toolbar loading is async
				document.addEventListener('commandBarChanged', function (evnt) {
					if (
						evnt.changeType === 'click' &&
						evnt.locationName === 'ItemWindowSidebar'
					) {
						if (!self.formPopulated) {
							aras.AlertError(
								aras.getResource(
									'../Modules/aras.innovator.CMF',
									'form_populated_handler_check'
								)
							);
						}

						var isShowFormClick = evnt.commandBarTarget === 'cmf_show_editor';
						if (isShowFormClick) {
							var selectedItem = self.contentToolbar
								.GetItem('cmf_view_dropdown')
								.GetSelectedItem();
							if (selectedItem) {
								self.loadTab(selectedItem);
							}
						}
						if (self.qpWindow) {
							var documentEditor = self.qpWindow.documentEditor;
							documentEditor.isHidden = !isShowFormClick;
							if (isShowFormClick) {
								documentEditor.restoreGrid();
							}
						}
						return;
					}

					if (evnt.changeType !== 'loaded') {
						return;
					}

					if (
						self.contentToolbar &&
						self.contentToolbar.GetItem('cmf_view_dropdown')
					) {
						self.contentToolbar.GetItem('cmf_view_dropdown')[
							'_item_Experimental'
						].domNode.style.margin = '6px 0px 6px 0px';
					}

					if (evnt.locationName !== 'cmfToolbar') {
						return;
					}

					self.contentToolbar = evnt.commandBar;

					var toolbarNode = self.contentToolbar[
						'getCurrentToolBarDomNode_Experimental'
					]();

					clientControlsFactory.on(evnt.commandBar, {
						onChange: function (dropDownItem) {
							if (!self.findControl) {
								self.findControl = new FindControl(
									document.getElementById('cmfMainToolbar')
								);
							}

							if (dropDownItem.getId() === 'cmf_view_dropdown') {
								self.viewTabClick(dropDownItem);
							}
							//Add by BCS Tengz 2021/6/10 PQD厂区列表切换事件
							else{
								const btnChangeEvent=dropDownItem.getId()+"_change";
								if(window[btnChangeEvent]){
									window[btnChangeEvent]();
								}
							}
						}
					});
				}); // commandBarChanged

				var topWindow = aras.getMostTopWindowWithAras(window);
				topWindow.cui.createConfigurableToolbar(
					'cmfMainToolbar',
					'cmfMainToolbarContainer',
					'cmfToolbar'
				);
			},

			getViews: function () {
				var views = aras.evalMethod('cmf_GetViewsForCommandBars', '', {
					itemTypeId: itemTypeID,
					itemId: itemID
				}); // tearoff window context call
				return views;
			},

			viewTabClick: function (dropDown) {
				var viewId = dropDown.getSelectedItem();
				var currentViewId = this.tabContainer.getCurrentTabId();
				if (currentViewId === viewId) {
					return;
				}

				if (currentViewId !== null) {
					var currentViewDiv = document.getElementById(currentViewId);
					var currentFrame = currentViewDiv.children[0];
					var currentQPWindow = currentFrame.contentWindow;
					currentQPWindow.destroySpreadsheet();
				}

				var viewDiv = document.getElementById(viewId);
				var frame = viewDiv.children[0];
				var qpWindow = frame.contentWindow;
				this.qpWindow = qpWindow;
				this.tabContainer.selectTab(viewId);
				this.loadQPDocument(qpWindow, viewId);
			},

			loadTab: function (viewId) {
				var dropDown = this.contentToolbar.getItem('cmf_view_dropdown');
				dropDown.setSelected(viewId);
			},

			getSwitchOffButtonIds: function () {
				///<summary>Widget sidebar button ID.
				///Actually single.
				///</summary>
				var ids = [];
				ids.push('cmf_show_editor');
				return ids;
			},

			getSwitchOffDisabledButtonIcons: function () {
				///<summary>Widget sidebar button &quot;turned off&quot;-state image</summary>
				var icons = [];
				icons.push('../images/QualityDocEditorOff.svg');
				return icons;
			}
		}
	);
});
