/**
 * /*!
 * Copyright (c) 2017-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and limitations under the License.
 *
 * @format
 */

var https = require('https');
var fs = require('fs');
const oktaConfig = require('./config');

function MappingGenerator() {
	this.options = {
		method: 'GET',
		hostname: oktaConfig.okta.orgUrl.replace(/(^\w+:|^)\/\//, ''),
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Authorization: 'SSWS ' + oktaConfig.okta.token,
		},
		maxRedirects: 20,
	};

	this.getMappingId = (appId, resolve) => {
		var _appId = appId;
		this.options.path = '/api/v1/mappings?sourceId=' + _appId;
		that = this;
		var req = https.request(this.options, function (res) {
			var chunks = [];

			res.on('data', function (chunk) {
				chunks.push(chunk);
			});

			res.on('end', function (chunk) {
				var body = JSON.parse(Buffer.concat(chunks));
				//console.log(JSON.stringify(body));
				that.getMapping(body[0].id, resolve);
			});

			res.on('error', function (error) {
				console.error(error);
			});
		});

		req.end();
	};

	this.getMapping = (mappingId, resolve) => {
		this.options.path = '/api/v1/mappings/' + mappingId;
		var req = https.request(this.options, function (res) {
			var chunks = [];

			res.on('data', function (chunk) {
				chunks.push(chunk);
			});

			res.on('end', function (chunk) {
				var body = JSON.parse(Buffer.concat(chunks));
				var props = body.properties;
				var mapping = {};
				Object.keys(props).forEach(function (key) {
					var val = props[key];
					mapping[key] = val.expression.replace(/^appuser\./, '');
				});
				resolve(mapping);
			});

			res.on('error', function (error) {
				console.error(error);
			});
		});

		req.end();
	};
}

MappingGenerator.prototype.generate = function (appId) {
	return new Promise(resolve => this.getMappingId(appId, resolve));
};

module.exports = MappingGenerator;
