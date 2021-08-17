/** @format */

/*!
 * Copyright (c) 2017-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and limitations under the License.
 */

// List users
const fs = require('fs');
const csv = require('csvtojson');
const prompts = require('prompts');
const Json2csvTransform = require('json2csv').Transform;
const UserStream = require('./UserStream');
const UserDelete = require('./UserDelete');
const UpdateUser = require('./UpdateUser');
const CreateUser = require('./CreateUser');
const MappingGenerator = require('./MappingGenerator');
const UserProfileDiff = require('./UserProfileDiff');
const UserDeactivatedDelete = require('./UserDeactivatedDelete');
const PrompParams = require('./PromptParams');

let appId, outputPath, inputPath, command;

const onSubmit = (prompt, answer, answers) => {
	switch (prompt.name) {
		case 'output':
			outputPath = answer;
			appId = answers.listAllAppId;
			command = 'listusers';
			return true;

		case 'deleteDeactiveConfirm':
			command = 'deletedeactiveusers';
			return true;

		case 'deleteAllConfirm':
			appId = answers.deleteAllAppId;
			command = 'deleteusers';
			return true;

		case 'createInput':
			inputPath = answers.createInput;
			command = 'createusers';
			return true;

		case 'updateInput':
			inputPath = answers.updateInput;
			command = 'updateusers';
			return true;
		default:
			return false;
	}
};

const main = async () => {
	console.log('Welcome to the Okta CLI Utility!');

	await prompts(PrompParams.Questions, { onSubmit });

	switch (command) {
		case 'listusers': {
			console.log('starting listusers...');
			console.log('\n  appId\t\t', appId);
			console.log('  output\t', outputPath, '\n');
			await listUsers();
			break;
		}
		case 'deleteusers': {
			console.log('starting deleteusers...');
			console.log('\n  appId\t\t', appId);
			deleteUsers();
			break;
		}
		case 'deletedeactiveusers': {
			console.log('starting deactivated deleteusers...');
			await deleteAllDeactivatedUsers();
			break;
		}
		case 'updateusers': {
			console.log('starting updateusers...');
			console.log('\ninput\t', inputPath);
			console.log('\nprocessing CSV...');
			await updateUser();
			break;
		}
		case 'createusers': {
			console.log('starting createusers...');
			console.log('\ninput\t', inputPath);
			console.log('\nprocessing CSV...');
			await createUser();
			break;
		}
		default:
			console.log('command not provided!');
	}
};

main();

const createUser = async () => {
	var createUser = new CreateUser();
	const input = fs.createReadStream(inputPath, { encoding: 'utf8' });
	csv()
		.fromStream(input)
		.subscribe(
			(json, lineNumber) => {
				createUser.update(json);
			},
			err => console.log(err),
			() => {
				createUser.complete();
			}
		);
};

const updateUser = async () => {
	var updateUser = new UpdateUser();
	const input = fs.createReadStream(inputPath, { encoding: 'utf8' });
	csv()
		.fromStream(input)
		.subscribe(
			(json, lineNumber) => {
				updateUser.update(json);
			},
			err => console.log(err),
			() => {
				updateUser.complete();
			}
		);
};

const csvtoUserDiff = async () => {
	let rawdata = diffMapping;
	if (!rawdata) {
		console.log('no mappings provided');
		return;
	}
	let mapping = JSON.parse(rawdata);
	const input = fs.createReadStream(inputPath, { encoding: 'utf8' });
	const output = fs.createWriteStream(outputPath, { encoding: 'utf8' });
	const transformOpts = { highWaterMark: 1000000, encoding: 'utf-8' };
	const json2csv = new Json2csvTransform(
		{
			transforms: [
				item => {
					var diff = {
						id: item.id,
						login: item.login,
					};
					Object.keys(mapping).forEach(function (key) {
						var value = mapping[key];
						if (item[key] !== item[value]) {
							diff[key] = item[key] + ':' + item[value];
						} else {
							diff[key] = '';
						}
					});
					return diff;
				},
			],
		},
		transformOpts
	);
	input.pipe(csv()).pipe(json2csv).pipe(output);
};

const deleteUsers = async () => {
	var userDelete = new UserDelete(options.appId);
	userDelete.deleteUsers();
};

const deleteAllDeactivatedUsers = async () => {
	var deactivatedUserDelete = new UserDeactivatedDelete();
	deactivatedUserDelete.deleteUsers();
};

const listUsers = async () => {
	spinner.start('fetching all users...');
	const output = fs.createWriteStream(outputPath, { encoding: 'utf8' });

	const transformOpts = { highWaterMark: 1000000, encoding: 'utf-8' };
	const json2csv = new Json2csvTransform({}, transformOpts);

	var userStream = new UserStream(appId);

	userStream.pipe(json2csv).pipe(output);

	output.on('close', () => {
		process.exit(1);
	});
};

// const generateMapping = async () => {
// 	var mapping = new MappingGenerator();
// 	var result = await mapping.generate(appId);
// 	try {
// 		fs.writeFileSync(outputPath, JSON.stringify(result));
// 	} catch (err) {
// 		console.error(err);
// 	} finally {
// 		console.log('Mapping Generation Complete');
// 	}
// };
