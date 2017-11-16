/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2017-07-16
* Updated at  : 2017-11-16
* Author      : jeefo
* Purpose     :
* Description :
_._._._._._._._._._._._._._._._._._._._._.*/
// ignore:start
"use strict";

/* globals */
/* exported */

var DONE = PP.define("DONE", 4);
var OK   = PP.define("OK", 200);

// ignore:end

var $q     = require("jeefo_q"),
	assign = require("jeefo_utils/object/assign");

var JSON_PARSE     = JSON.parse;
var JSON_STRINGIFY = JSON.stringify;

var object_keys = Object.keys;

var uri_encode = function (data) {
	var i = 0, keys = object_keys(data), result = '';

	for (; i < keys.length; ++i) {
		if (result) {
			result += '&';
		}
		result += `${ encodeURIComponent(keys[i]) }=${ encodeURIComponent(data[keys[i]]) }`;
	}

	return result;
};

var response_text = function (status, headers, text) {
	return text;
};

var build_url = function (url, params) {
	if (params) {
		url += '?' + uri_encode(params);
	}

	return url;
};

var _response_handler = function (xhr, deferred, response_handler) {
	if (xhr.status === OK) {
		deferred.resolve(response_handler(xhr.status, xhr.getAllResponseHeaders(), xhr.responseText));
	} else {
		deferred.reject({
			error             : "response_error",
			status            : xhr.status,
			error_description : "Response code wasn't 200",
		});
	}
};

var Request = function (method, url, config, defaults) {
	if (! config) {
		config = {};
	}

	this.method = method;
	this.config = {
		url              : url,
		params           : config.params,
		method           : method,
		headers          : assign({}, defaults.headers, config.headers),
		content_type     : config.content_type     || defaults.content_type,
		response_handler : config.response_handler || defaults.response_handler,
		with_credentials : config.with_credentials !== void 0 ?
			config.with_credentials : defaults.with_credentials,
	};
};

Request.prototype = {
	intercept : function (interceptors) {
		for (var i = 0; i < interceptors.length; ++i) {
			if (interceptors[i].request) {
				this.config = interceptors[i].request(this.config);
			}
		}
	},

	send : function (data) {
		var	i        = 0,
			xhr      = new XMLHttpRequest(),
			config   = this.config,
			headers  = config.headers,
			keys     = object_keys(headers),
			deferred = $q.defer();

		xhr.open(this.method, build_url(config.url, config.params), true);

		for (; i < keys.length; ++i) {
			xhr.setRequestHeader(keys[i], headers[keys[i]]);
		}

		xhr.withCredentials = config.with_credentials;

		if (data) {
			xhr.setRequestHeader("Content-Type", config.content_type);

			switch (config.content_type) {
				case "application/json" :
					data = JSON_STRINGIFY(data);
					break;
				case "application/x-www-form-urlencoded" :
					data = uri_encode(data);
					break;
				default:
					deferred.reject({
						error             : "invalid_content_type",
						error_description : "Invalid content type"
					});
			}
		}

		xhr.onreadystatechange = function () {
			if (this.readyState === DONE) {
				_response_handler(this, deferred, config.response_handler);
			}
		};

		xhr.send(data || null);

		return deferred.promise;
	},

	upload : function (config) {
		var i        = 0,
			xhr      = new XMLHttpRequest(),
			form     = new FormData(),
			fields   = config.fields,
			_config  = this.config,
			headers  = _config.headers,
			keys     = object_keys(headers),
			deferred = $q.defer();
		
		xhr.upload.onload     = config.load;
		xhr.upload.onprogress = config.progress;

		xhr.open(
			this.method || "POST",
			build_url(_config.url, _config.params),
			true
		);

		for (; i < keys.length; ++i) {
			xhr.setRequestHeader(keys[i], headers[keys[i]]);
		}

		xhr.withCredentials = _config.with_credentials;

		xhr.onreadystatechange = function () {
			if (this.readyState === DONE) {
				_response_handler(this, deferred, _config.response_handler);
			}
		};

		form.append("file", config.file);

		if (fields) {
			keys = object_keys(fields);
			i = keys.length;
			while (i--) {
				form.append(keys[i], fields[keys[i]]);
			}
		}

		xhr.send(form);

		return deferred.promise;
	},
};

module.exports = {
	defaults : {
		headers          : {},
		content_type     : "application/json",
		response_handler : function (status, headers, data) {
			return JSON_PARSE(data);
		},
	},
	interceptors : [],

	get : function (url, config) {
		return this.request("GET", url, config);
	},
	get_text : function (url, config) {
		if (! config) {
			config = {};
		}
		config.response_handler = response_text;

		return this.get(url, config);
	},

	save : function (url, data, config) {
		return this.request("POST", url, config, data);
	},

	update : function (url, data, config) {
		return this.request("PUT", url, config, data);
	},

	$delete : function (url, data, config) {
		return this.request("DELETE", url, config, data);
	},

	request : function (method, url, config, data) {
		var request = new Request(method, url, config, this.defaults);
		request.intercept(this.interceptors);

		return request.send(data);
	},
	//get_all : function (urls) {
		//var promises = urls.split(/\s*,\s*/).map(this.get);
		//return $q.all(promises);
	//},

	upload : function (url, config) {
		var request = new Request(null, url, config, this.defaults);
		request.intercept(this.interceptors);

		return request.upload(config);
	}
};
