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

const Readable = require('stream').Readable;
const util = require('util');
const okta = require('@okta/okta-sdk-nodejs');
const oktaConfig = require('./config');
const async = require('async');

function UserStream(appId) {
	Readable.call(this);
	defaultRequestExecutor = new okta.DefaultRequestExecutor({ maxRetries: 0 });
	this._client = new okta.Client({
		...oktaConfig.okta,
		requestExecutor: defaultRequestExecutor,
	});
	this._count = 1;
	this._appId = appId;
	this._done = false;

	that = this;

	this._queue = async.queue(function (user, callback) {
		that._client.getUser(user.id).then(oktaUser => {
			var obj = {
				count: that._count,
				id: oktaUser.id,
				status: oktaUser.status,
				created: oktaUser.created,
				activated: oktaUser.activated,
				statusChanged: oktaUser.statusChanged,
				lastLogin: oktaUser.lastLogin,
				lastUpdated: oktaUser.lastUpdated,
				passwordChanged: oktaUser.passwordChanged,
				...oktaUser.profile,
				providertype: oktaUser.credentials.provider.type,
				...user.profile,
			};
			that._count++;
			if (that._count % 500 == 0) console.log('processed ' + that._count);
			that.push(JSON.stringify(obj));
			callback();
		});
	}, oktaConfig.userlist.workercount || 10);

	this._queue.drain = function () {
		if (that._done) {
			console.log('Done');
			console.log('Total Count: ' + that._count);
			that.push(null);
		}
	};

	//start the fetching of the application users
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
			this.push(null);
		});

	defaultRequestExecutor.on(
		'backoff',
		(request, response, requestId, delayMs) => {
			console.log(
				`Backoff ${delayMs} ${requestId}, ${request.url}, ${JSON.stringify(
					response.headers
				)}`
			);
		}
	);

	defaultRequestExecutor.on('resume', (request, requestId) => {
		console.log(`Resume ${requestId} ${request.url}`);
	});
}

util.inherits(UserStream, Readable);

UserStream.prototype._read = function () {
	//nothing todo
};

module.exports = UserStream;
