/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2017-07-16
* Updated at  : 2017-08-24
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start

/* globals */
/* exported */

// ignore:end

var $q = require("jeefo_q");

var JSON_STRING = JSON.stringify;
var DONE = 4; // readyState 4 means the request is done.
var OK = 200; // status 200 is a successful return.

var JS   = 1,
	TEXT = 2;

var ajax = function (method, path, data, mime) {
	var xhr      = new XMLHttpRequest(),
		deferred = $q.defer();

	xhr.onreadystatechange = function () {
		if (xhr.readyState === DONE) {
			if (xhr.status === OK) {
				switch (mime) {
					case JS   : 
					case TEXT :
						deferred.resolve(xhr.responseText);
						break;
					default:
						try {
							var json = JSON.parse(xhr.responseText);
							deferred.resolve(json);
						} catch (e) {
							deferred.reject("Parse Error: " + xhr.status);
						}
				}
			} else {
				// An error occurred during the request.
				deferred.reject("Error: " + xhr.status);
			}
		}
	};

	xhr.open(method, path, true);
	switch (mime) {
		case JS   : xhr.overrideMimeType("text/javascript"); break;
		case TEXT : break;
		default :
			xhr.setRequestHeader("Content-Type", "application/json");
	}
	xhr.send(data);

	return deferred.promise;
};

module.exports = {
	API_PREFIX : '',
	get_text : function (path) {
		return ajax("GET", path, null, TEXT);
	},
	get_js_code : function (path) {
		return ajax("GET", path, null, JS);
	},
	get : function (path) {
		return ajax("GET", path, null);
	},
	get_all : function (urls) {
		var promises = urls.split(/\s*,\s*/).map(this.get);
		return $q.all(promises);
	},
	get_api : function (path) {
		return this.get(this.API_PREFIX + path);
	},
	put : function (path, data) {
		return ajax("PUT", path, JSON_STRING(data));
	},
	save : function (path, data) {
		return ajax("POST", path, JSON_STRING(data));
	},
	update_api : function (path, data) {
		return this.put(this.API_PREFIX + path, data);
	},
	save_api : function (path, data) {
		return this.save(this.API_PREFIX + path, data);
	}
};
