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

const util = require('util');
const okta = require('@okta/okta-sdk-nodejs');
const oktaConfig = require('./config');
const async = require('async');

function UserProfileDiff(mapping) {
	this._count = 0;
	this._queue = async.queue(worker, 10);
	this._done = false;
	this._mapping = mapping;
	that = this;

	this._queue.drain = function () {
		if (that._done) {
			console.log('Done');
			console.log('Total Count: ' + that._count);
			process.exit(1);
		}
	};
}

function worker(user, callback) {
	that._count++;
	if (that._count % 20 == 0) console.log('processed ' + that._count);
	//perform diff
	Object.keys(that._mapping).forEach(function (key) {
		var val = o[key];
		if (user[key] === user[value]) {
		}
	});
}

UserProfileDiff.prototype.update = function (user) {
	this._queue.push(user);
};

UserProfileDiff.prototype.complete = function () {
	this._done = true;
};

module.exports = UserProfileDiff;
