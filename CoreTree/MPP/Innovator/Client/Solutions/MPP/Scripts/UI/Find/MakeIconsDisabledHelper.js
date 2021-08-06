/*jslint sloppy: true, nomen: true*/
/*global dojo, define, document, window, dojoConfig*/
define(['dojo/_base/declare', 'dojo/dom-construct'],
	function(declare, Dom) {
		//note that a simular class exists in Innovator.git - _ToolbarButtonMixin.
		return declare(null, {
			constructor: function() {
			},

			addInlineBackgroundImage: function(iconNode, imageSrc, heightStr, widthStr) {
				iconNode.style.display = 'inline-block';
				function isSvg(url) {
					return (url.toLowerCase().substring(url.length - 3, url.length) === 'svg');
				}
				function svgSerialize(url) {
					var response = dojo.xhr.get({url: url, sync: false});
					return response.promise;
				}

				if (isSvg(imageSrc) && dojoConfig.arasContext.browser.isIe &&
					dojoConfig.arasContext.browser.majorVersion >= 10) {
					var SVGElement = document.createElement('div');
					svgSerialize(imageSrc).then(function(res) {
						SVGElement.innerHTML = res;
						var svgNode = SVGElement.querySelector('svg');
						svgNode.setAttribute('height', heightStr);
						svgNode.setAttribute('width', widthStr);
						iconNode.appendChild(svgNode);
					});
				} else {
					var imgTag = Dom.create('img', {src: imageSrc}, iconNode);
					imgTag.style.width = widthStr;
					imgTag.style.width = heightStr;
				}
			}
		});
	});
