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

function UserDelete(appId) {
	this._client = new okta.Client({
		...oktaConfig.okta,
		requestExecutor: new okta.DefaultRequestExecutor(),
	});
	this._count = 0;
	this._appId = appId;
	this._queue = async.queue(worker, oktaConfig.userdelete.workercount || 10);
	this._done = false;
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
	if (!oktaConfig.excludeUsers.includes(user.id)) {
		that._count++;
		if (that._count % 20 == 0) console.log('processed ' + that._count);
		that._client.getUser(user.id).then(user =>
			user
				.deactivate()
				.then(() => user.delete())
				.catch(err => {
					user.delete();
				})
				.finally(() => {
					callback();
				})
		);
	}
}

UserDelete.prototype.deleteUsers = function () {
	this._client
		.listApplicationUsers(this._appId)
		.each(user => {
			this._queue.push(user);
		})
		.then(() => {
			this._done = true;
		})
		.catch(err => {
			console.log(err);
		});
};

module.exports = UserDelete;
