define([
	'dojo/_base/declare',
	'MPP/UI/TooltipDialog/TooltipDialog',
	'dojo/aspect'
],
function(declare, TooltipDialog, aspect) {
	return declare('MPP.UI.Utils', null, {
		aras: null,
		topWindow: null,
		tooltipDialog: null,
		resourceCache: null,

		constructor: function(args) {
			this.aras = args.aras;
			this.topWindow = this.aras.getMostTopWindowWithAras(window);
			this.tooltipDialog = new TooltipDialog({aras: this.aras});
			this.resourceCache = {};
		},

		getCurrentTooltipDialog: function() {
			return this.topWindow.currentMppTooltipDialog;
		},

		showEditorTearOff: function(editedItem, onCloseEditor) {
			this.aras.uiShowItemEx(editedItem.node).then(function() {
				var editorWindow = this.aras.uiFindWindowEx(editedItem.getID());
				if (editorWindow) {
					editorWindow.addEventListener('unload', function() {
						onCloseEditor();
					});
				} else {
					onCloseEditor();
				}
			});
		},

		showFormDialog: function(targetItem, optionalParameters) {
			//the function is unused for now. Can be removed. Perhaps will be used at once.
			optionalParameters = optionalParameters || {};
			var formNode = this._getFormNode(targetItem.node, optionalParameters.formType, optionalParameters.formId);

			if (formNode) {
				// prepare dialog settings
				var dialogParams = {
					title: optionalParameters.title || targetItem.getType(),
					aras: this.aras,
					editType: optionalParameters.formType,
					formNd: formNode,
					item: targetItem,
					dialogWidth: optionalParameters.formWidth || (parseInt(this.aras.getItemProperty(formNode, 'width')) || 400),
					dialogHeight: optionalParameters.formheight || (parseInt(this.aras.getItemProperty(formNode, 'height')) || 300),
					resizable: optionalParameters.resizable,
					content: 'ShowFormAsADialog.html',
					onload: function(popupDialog) {
						if (optionalParameters.onClose) {
							popupDialog.onCancel = function() {
								optionalParameters.onClose(popupDialog);
							};
						}
					}
				};
				var dialog = this.aras.getMostTopWindowWithAras(window).ArasModules.Dialog.show('iframe', dialogParams);

				dialog.promise.then(function() {
					if (optionalParameters.onClose) {
						optionalParameters.onClose(dialog);
					}
				});

				return true;
			}

			return false;
		},

		_prepareMultiligualProperties: function(itemNode, itemTypeNode, langCode) {
			if (!langCode) {
				return;
			}

			var mlProps = itemTypeNode.selectNodes('./Relationships/Item[@type="Property" and data_type="ml_string"]');

			for (var i = 0; i < mlProps.length; i++) {
				var propNode = mlProps[i];
				var propertyName = this.aras.getItemProperty(propNode, 'name');

				//eslint-disable-next-line no-loop-func
				this.aras.getItemTranslation(itemNode, propertyName, langCode, null, function(node) {
					if (node) {
						this.aras.setItemProperty(itemNode, propertyName, node.text);
					}
				});
			}
		},

		_restoreMultiligualProperties: function(itemNode, itemTypeNode, langCode) {
			if (!langCode) {
				return;
			}

			var defaultLangCode = this.aras.getSessionContextLanguageCode();
			var mlProps = itemTypeNode.selectNodes('./Relationships/Item[@type="Property" and data_type="ml_string"]');

			for (var i = 0; i < mlProps.length; i++) {
				var propNode = mlProps[i];
				var propertyName = this.aras.getItemProperty(propNode, 'name');
				var propertyValue = this.aras.getItemProperty(itemNode, propertyName);

				this.aras.removeItemTranslation(itemNode, propertyName, defaultLangCode);
				this.aras.setItemTranslation(itemNode, propertyName, propertyValue, langCode);
			}
		},

		showTooltipDialog: function(targetItemNode, tooltipDialogArguments, optionalParameters) {
			optionalParameters = optionalParameters || {};

			var formNode = this._getFormNode(targetItemNode, optionalParameters.formType, optionalParameters.formId);
			var height = this.aras.getItemProperty(formNode, 'height');
			var width = this.aras.getItemProperty(formNode, 'width');
			var itemTypeNd = this.aras.getItemTypeDictionary(targetItemNode.getAttribute('type')).node;
			var request;

			this._prepareMultiligualProperties(targetItemNode, itemTypeNd, tooltipDialogArguments.langCode);
			this.aras.uiPopulatePropertiesOnWindow(window, targetItemNode, itemTypeNd, formNode, true);
			request = this.aras.uiDrawFormEx(formNode, optionalParameters.formType || 'add', itemTypeNd);
			aspect.before(optionalParameters.callbacks, 'onClose', function() {
				this._restoreMultiligualProperties(targetItemNode, itemTypeNd, tooltipDialogArguments.langCode);
			}.bind(this));
			this.topWindow.currentMppTooltipDialog = this.tooltipDialog;
			this.tooltipDialog.showDialog(tooltipDialogArguments, request, optionalParameters.callbacks, height, width);
		},

		_getFormNode: function(targetItemNode, formType, formIdPar) {
			if (targetItemNode) {
				var formId = formIdPar || this.aras.uiGetFormID4ItemEx(targetItemNode, formType || 'add');

				if (formId) {
					// get corresponded form
					var formDisplay = this.aras.getFormForDisplay(formId);
					return formDisplay && formDisplay.node;
				}
			}
		},

		normalizeTooltipPositionArguments: function(tooltipArguments) {
			if (tooltipArguments) {
				var isPositionCalculated = tooltipArguments.around || (tooltipArguments.x && tooltipArguments.y);

				if (!isPositionCalculated) {
					// trying to get position with 'getPosition' method
					if (typeof tooltipArguments.getPosition === 'function') {
						var position = tooltipArguments.getPosition();

						if (position) {
							tooltipArguments.x = position.x;
							tooltipArguments.y = position.y;
							return;
						}
					}

					// trying to get position with 'getAroundNode' method
					if (typeof tooltipArguments.getAroundNode === 'function') {
						var aroundNode = tooltipArguments.getAroundNode();

						if (aroundNode) {
							tooltipArguments.around = aroundNode;
							return;
						}
					}
				}
			}
		},

		showSearchDialog: function(itemTypeName, searchCallback, optionalParameters) {
			optionalParameters = optionalParameters || {};

			if (itemTypeName) {
				var dialogParams = {
					aras: this.aras,
					type: 'SearchDialog',
					multiselect: optionalParameters.multiselect || false,
					itemtypeName: itemTypeName
				};
				var onCloseHandler = function(searchResult) {
					if (searchResult && typeof searchCallback === 'function') {
						searchCallback(dialogParams.multiselect ? Array.isArray(searchResult) ? searchResult : [searchResult.itemID] : searchResult.item);
					}
				};

				if (optionalParameters.dblclickclose === false) {
					var doubleClickhandler = function(result, actionType) {
						if (actionType === 'doubleclick') {
							onCloseHandler(result);
							return false;
						}

						return true;
					};

					dialogParams.handler = doubleClickhandler;
				}

				return this.topWindow.ArasModules.MaximazableDialog.show('iframe', dialogParams).promise.then(onCloseHandler);
			}
		},

		showConfirmDialog: function(confirmationMessage, optionalParameters) {
			optionalParameters = optionalParameters || {};

			var confirmDialogParams = {
				buttons: optionalParameters.buttons || {
					btnYes: this.aras.getResource('', 'common.ok'),
					btnCancel: this.aras.getResource('', 'common.cancel')
				},
				defaultButton: optionalParameters.defaultButton || 'btnCancel',
				aras: this.aras,
				dialogWidth: 300,
				dialogHeight: 200,
				center: true,
				content: 'groupChgsDialog.html',
				message: confirmationMessage
			};

			if (optionalParameters.sync) {
				var confirmationResult;

				if (this.aras.Browser.isCh()) {
					confirmationResult = this.topWindow.confirm(confirmationMessage) ? 'btnYes' : 'btnCancel';
				} else {
					confirmationResult = this.aras.modalDialogHelper.show('DefaultModal',
						this.topWindow,
						confirmDialogParams,
						confirmDialogParams,
						'groupChgsDialog.html');
				}

				if (typeof optionalParameters.onClose === 'function') {
					optionalParameters.onClose(confirmationResult);
				}
			} else {
				return this.topWindow.ArasModules.Dialog.show('iframe', confirmDialogParams).promise;
			}
		},

		getResource: function(resourceId) {
			var foundResource = this.resourceCache[resourceId];

			if (!foundResource || arguments.length > 1) {
				var extendedArguments = Array.prototype.slice.call(arguments);

				extendedArguments.unshift('MPP');
				foundResource = this.aras.getResource.apply(this.aras, extendedArguments);

				this.resourceCache[resourceId] = foundResource;
			}

			return foundResource;
		},

		_replaceDrawButtons: function(customization, copyToClipboardMsg) {
			var originalDrawButtons = customization.DrawButtons;

			customization.DrawButtons = function() {
				customization.DrawButtons = originalDrawButtons;
				var originalResult = originalDrawButtons.apply(this, arguments);
				var toAdd =
					'<script type="text/javascript">\n' +
					'	var btnToggle = document.getElementById(\'toggleInfo\');\n' +
					'	btnToggle.style.display = \'none\';\n' +

					'	function CopyToBufferCustom() {\n' +
					'		var buffer = \'' + copyToClipboardMsg + '\';\n' +
					'		if (window.clipboardData) {\n' +
					'			window.clipboardData.setData(\'Text\', buffer);\n' +
					'		} else {\n' +
					'			dialogArguments.aras.utils.setClipboardData(\'Text\', buffer);\n' +
					'		}\n' +
					'	}\n' +

					'	var btnCopy = document.getElementById(\'copyBuffer\');\n' +
					'	btnCopy.onclick = CopyToBufferCustom;\n' +
					'</script>';

				return originalResult + toAdd;
			};
		},

		customAlertInternal: function(fullErrorStr, shortErrorStr) {
			var aras = this.aras;
			var topWnd = aras.getMostTopWindowWithAras();
			var fullErrorStrReplaced = fullErrorStr.replace(/<b>/gi, '').replace(/<\/b>/gi, '').replace(/<br>/gi, '\n');
			var errorTitle = aras.getResource('', 'aras_object.error');
			var customization = {
				get img() {
					return aras.getBaseURL('/images/Error.svg');
				},
				title: errorTitle,

				copyCustomizator: function(copyButton) {
					copyButton.style.display = '';
					copyButton.addEventListener('click', function() {
						topWnd.ArasModules.copyTextToBuffer(this.text, this.container);
					}.bind({text: fullErrorStrReplaced, container: copyButton.parentElement}));
				}
			};
			topWnd.ArasModules.Dialog.alert(shortErrorStr, {
				customization: customization,
				isHtml: true
			});
		},

		convertNodeToIomItem: function(itemNode) {
			if (itemNode) {
				var iomItem = this.aras.newIOMItem();

				iomItem.dom = itemNode.ownerDocument;
				iomItem.node = itemNode;

				return iomItem;
			}
		}
		//don't use "," after the last property all over the file, e.g, here because documentation will not be built
	});
});
