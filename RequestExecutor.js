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

const okta = require('@okta/okta-sdk-nodejs');
const oktaConfig = require('./config.json');

class RequestExecutorWithRateLimiting extends okta.DefaultRequestExecutor {
	constructor(config = {}) {
		super();

		this.rateLimitThreshold = oktaConfig.rateLimitThreshold || 0;

		if (this.rateLimitThreshold < 0) {
			throw new Error(
				`okta.client.rateLimitThreshold provided as ${oktaConfig.rateLimitThreshold} but must be 0 (disabled) or greater than zero. Set the appropriate value in config.json.`
			);
		}

		if (this.rateLimitThreshold > 1) {
			throw new Error(
				`okta.client.rateLimitThreshold provided as ${oktaConfig.rateLimitThreshold} but cannot be greater than 100% (1). Set the appropriate value in config.json.`
			);
		}

		this.rateLimitLimitHeader =
			oktaConfig.rateLimitLimitHeader || 'x-rate-limit-limit';
		this.rateLimitRemainingHeader =
			oktaConfig.rateLimitRemainingHeader || 'x-rate-limit-remaining';
	}

	fetch(request) {
		if (!request.startTime) {
			request.startTime = new Date();
		}
		return super.fetch(request).then(this.parseResponse.bind(this, request));
	}

	getRateLimitRemaining(response) {
		return parseInt(response.headers.get(this.rateLimitRemainingHeader));
	}

	getRateLimitLimit(response) {
		return parseInt(response.headers.get(this.rateLimitLimitHeader));
	}

	parseResponse(request, response) {
		if (this.rateLimitThreshold > 0) {
			if (
				response.status === 200 &&
				super.validateRetryResponseHeaders(response)
			) {
				const elapsedMs = Date.now() - request.startTime,
					delayMs = super.getRetryDelayMs(response),
					delayDelta = elapsedMs + delayMs,
					rateLimitRemaining = this.getRateLimitRemaining(response),
					rateLimitLimit = this.getRateLimitLimit(response);

				if (this.requestTimeout > 0) {
					if (elapsedMs >= this.requestTimeout) {
						return Promise.reject(
							new Error(
								'HTTP request time exceeded okta.client.rateLimit.requestTimeout'
							)
						);
					}
					if (delayDelta >= this.requestTimeout) {
						return Promise.reject(
							new Error(
								'HTTP retry delay would exceed okta.client.rateLimit.requestTimeout'
							)
						);
					}
				}

				let rateLimitLeftPercentage = rateLimitRemaining / rateLimitLimit;

				if (rateLimitLeftPercentage < this.rateLimitThreshold && delayMs > 0) {
					const requestId = super.getOktaRequestId(response);

					console.log('Rate limit threshold hit!');
					console.log('Limit: ', rateLimitLimit);
					console.log('Remaining: ', rateLimitRemaining);
					console.log('Pausing for ', delayMs, 'ms');

					return new Promise(resolve => {
						this.emit('backoff', request, response, requestId, delayMs);
						setTimeout(resolve, delayMs);
					}).then(() => {
						this.emit('resume', requestId);
						return response;
					});
				}
			}
			return response;
		} else {
			console.log('do normal parseResponse');
			super.parseResponse(request, response);
		}
	}
}

module.exports = RequestExecutorWithRateLimiting;
