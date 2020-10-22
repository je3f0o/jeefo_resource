/* -.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.
* File Name   : index.js
* Created at  : 2017-07-16
* Updated at  : 2020-10-22
* Author      : jeefo
* Purpose     :
* Description :
.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.-.*/
// ignore:start
"use strict";

/* globals AbortController*/
/* exported*/

// jshint curly: false

// ignore:end

const object_keys   = Object.keys;
const object_assign = Object.assign;

const has_blob = data => {
    for (const key of object_keys(data)) {
        if (data[key] instanceof Blob) return true;
    }
    return false;
};

class JeefoResourceService {
    constructor () {
        this.base_url      = location.origin;
        this.interceptors  = [];
        this.response_type = null;
    }

    head (url, config) {
		return this.request("HEAD", url, config);
    }

    async get (url, config) {
		const res = await this.request("GET", url, config);
        if (res.status !== 200) { return null; }

        let method = (config && config.response_type) || this.response_type;

        if (! method) {
            const content_type = res.headers.get("content-type").split(';')[0];
            if (content_type.startsWith("text/")) {
                method = "text";
            } else if (content_type === "application/json") {
                method = "json";
            } else {
                throw new Error(`Undefined Content-Type: ${content_type}`);
            }
        }

        return await res[method]();
    }

	get_all (urls) {
        return Promise.all(urls.map(req => {
            if (typeof url_or_object === "string") {
                return this.get(req);
            }
            return this.get(req.url, req.config);
        }));
	}

	save (url, data, config) {
		return this.request("POST", url, config, data);
	}

	update (url, data, config) {
		return this.request("PUT", url, config, data);
	}

	delete (url, data, config) {
		return this.request("DELETE", url, config, data);
	}

	upload (url, config) {
		return this.request(config);
	}

	request (method, url, config, data) {
        url = new URL(url, this.base_url);
        const init = {method, headers: {}};

        if (config) for (const prop of object_keys(config)) {
            switch (prop) {
                case "query":
                    for (const key of object_keys(config[prop])) {
                        url.searchParams.set(key, config[prop][key]);
                    }
                    break;
                case "headers" :
                    object_assign(init[prop], config[prop]);
                    break;
                default:
                    init[prop] = config[prop];
            }
        }

        if (data && typeof data === "object") {
            if (data instanceof FormData) {
                init.body = data;
            } else if (has_blob(data)) {
                const form_data = new FormData();
                for (const key of object_keys(data)) {
                    url.searchParams.set(key, data[key]);
                }
                init.body = form_data;
            } else {
                init.headers["Content-type"] = "application/json";
                init.body = JSON.stringify(data);
            }
        }

        for (const interceptor of this.interceptors) interceptor(init);

        let controller;
        if (! init.signal) {
            controller = new AbortController();
            init.signal = controller.signal;
        }

		const promise = fetch(new Request(url.href, init));
        if (controller) {
            promise.abort = () => controller.abort();
        }
        return promise;
	}
}

module.exports = new JeefoResourceService();
