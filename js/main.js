var backPage = chrome.extension.getBackgroundPage();

function getDateStr() {
    var date = new Date();

    const dateTimeFormat = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const [{ value: month },, { value: day },, { value: year },, { value: hour },, { value: minute },, {value:second}] = 
        dateTimeFormat.formatToParts(date);

    return `${month}-${day}-${hour}-${minute}-${second}`;
}

var takeScreenshot = {
	/**
	 * @description ID of current tab
	 * @type {Number}
	 */
    tabId: null,

	/**
	 * @description Canvas element
	 * @type {Object}
	 */
    screenshotCanvas: null,

	/**
	 * @description 2D context of screenshotCanvas element
	 * @type {Object}
	 */
    screenshotContext: null,

	/**
	 * @description Number of pixels by which to move the screen
	 * @type {Number}
	 */
    scrollBy: 0,

	/**
	 * @description Sizes of page
	 * @type {Object}
	 */
    size: {
        width: 0,
        height: 0
    },

	/**
	 * @description Keep original params of page
	 * @type {Object}
	 */
    originalParams: {
        overflow: "",
        scrollTop: 0
    },

	/**
	 * @description Initialize plugin
	 */
    initialize: function () {
        this.screenshotCanvas = document.createElement("canvas");
        this.screenshotContext = this.screenshotCanvas.getContext("2d");

        this.bindEvents();
    },

	/**
	 * @description Bind plugin events
	 */
    bindEvents: function () {
        // handle onClick plugin icon event
        chrome.browserAction.onClicked.addListener(function (tab) {
            this.tabId = tab.id;

            chrome.tabs.sendMessage(tab.id, {
                "msg": "getPageDetails"
            });
        }.bind(this));

        // handle chrome requests
        chrome.runtime.onMessage.addListener(function (request, sender, callback) {
            backPage.console.log("Request:" + JSON.stringify(request));
            ///*
            if (request.msg === "setPageDetails") {
                this.size = request.size;
                this.scrollBy = request.scrollBy;
                this.originalParams = request.originalParams;

                // set width & height of canvas element
                this.screenshotCanvas.width = this.size.width;
                //this.screenshotCanvas.height = this.size.height;
                this.screenshotCanvas.height = this.scrollBy;

                this.capturePage(0, true);
                //this.scrollTo(0);
            } else if (request.msg === "capturePage") {
                this.capturePage(request.position, request.lastCapture);
            }
            //*/
        }.bind(this));
    },

	/**
	 * @description Send request to scroll page on given position
	 * @param {Number} position
	 */
    scrollTo: function (position) {
        chrome.tabs.sendMessage(this.tabId, {
            "msg": "scrollPage",
            "size": this.size,
            "scrollBy": this.scrollBy,
            "scrollTo": position
        });
    },

	/**
	 * @description Takes screenshot of visible area and merges it
	 * @param {Number} position
	 * @param {Boolean} lastCapture
	 */
    capturePage: function (position, lastCapture) {
        var self = this;

        setTimeout(function () {
            chrome.tabs.captureVisibleTab(null, {
                "format": "png"
            }, function (dataURI) {
                var newWindow,
                    image = new Image();

                if (typeof dataURI !== "undefined") {
                    image.onload = function () {
                        if (window.devicePixelRatio > 1) {
                            self.screenshotContext.scale(1 / window.devicePixelRatio, 1 / window.devicePixelRatio);
                        }

                        self.screenshotContext.drawImage(image, 0, position);

                        if (lastCapture) {
                            //self.resetPage();
                            var dataURL = self.screenshotCanvas.toDataURL("image/png");

                            var formData = new FormData();

                            var blobBin = atob(dataURL.split(',')[1]);
                            var array = [];
                            for (var i = 0; i < blobBin.length; i++) {
                                array.push(blobBin.charCodeAt(i));
                            }
                            var blob = new Blob([new Uint8Array(array)], { type: 'image/png' });


                            formData.append("file", blob, "Image"+getDateStr()+".png");
                            //*
                            const req = new XMLHttpRequest();
                            const baseUrl = "http://localhost:8080/api/";


                            req.open("POST", baseUrl, true);
                            //req.setRequestHeader("Content-type", "multipart/form-data");
                            req.send(formData);

                            req.onreadystatechange = function () { // Call a function when the state changes.
                                if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                                    console.log("Got response 200!");
                                }
                            }
                            //*/
                            /*
                            newWindow = window.open();dock
                            newWindow.location.href = self.screenshotCanvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
							//newWindow.document.write("<style type='text/css'>body {margin: 0;}</style>");
                            //newWindow.document.write("<img src='" + self.screenshotCanvas.toDataURL("image/png").replace("image/png", "image/octet-stream") + "'/>");
                            //*/
                        } else {
                            self.scrollTo(position + self.scrollBy);
                        }

                    };

                    image.src = dataURI;
                } else {
                    backPage.console.log("Error");
					/*chrome.tabs.sendMessage(self.tabId, {
						"msg": "showError",
						"originalParams": self.originalParams
					});*/
                }
            });
        }, 300);
    },

	/**
	 * @description Send request to set original params of page
	 */
    resetPage: function () {
        chrome.tabs.sendMessage(this.tabId, {
            "msg": "resetPage",
            "originalParams": this.originalParams
        });
    }
};


takeScreenshot.initialize();
