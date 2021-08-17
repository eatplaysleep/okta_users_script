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

const optionDefinitions = [
	{
		title: 'List Users for an appId',
		value: 'listusers',
		description: 'List all users for a given application',
	},
	{
		title: 'Update Existing Users from CSV',
		value: 'updateusers',
		description:
			'Update users provided in a CSV with the provided values (from the CSV)',
	},
	{
		title: 'Create New Users from CSV',
		value: 'createusers',
		description: 'Create users provided in a CSV.',
	},
	{
		title: 'Delete Users for an appId',
		value: 'deleteusers',
		description: 'Delete all users for a given application',
	},
	{
		title: 'Delete All Deactive Users',
		value: 'deletedeactiveusers',
		description: 'Delete all deactivated users in an org.',
	},
];

const Questions = [
	{
		type: 'select',
		name: 'start',
		message: 'What would you like to do?',
		choices: optionDefinitions,
		hint: '⬆️  ⬇️  to select. Return to submit. `Esc` to cancel.',
		style: 'emoji',
		initial: 0,
	},
	{
		type: prev => {
			switch (prev) {
				case 'updateusers':
				case 'createusers':
				case 'listusers':
				case 'deleteusers':
					return 'text';
				case 'deletedeactiveusers':
					return 'confirm';
			}
		},
		name: prev => {
			switch (prev) {
				case 'listusers':
					return 'listAllAppId';
				case 'deleteusers':
					return 'deleteAllAppId';
				case 'deletedeactiveusers':
					return 'deleteDeactive';
				case 'updateusers':
					return 'updateInput';
				case 'createusers':
					return 'createInput';
			}
		},
		message: prev => {
			switch (prev) {
				case 'listusers':
				case 'deleteusers':
					return 'What is the Okta appId?';
				case 'deletedeactiveusers':
					return `All users that have a status of 'deactivated' will be deleted!\n\n  Are you sure you want to continue?`;
				case 'updateusers':
				case 'createusers':
					return 'What is the path for the input file?';
			}
		},
	},
	{
		type: (prev, values) => {
			// console.log('values', values);
			switch (true) {
				case values.start === 'listusers':
					return 'text';
				case prev === true:
				case values.start === 'deleteusers':
					return 'confirm';
				default:
					return null;
			}
		},
		name: (prev, values) => {
			switch (true) {
				case values.start === 'listusers':
					return 'output';
				case values.start === 'deleteusers':
					return 'deleteAll';
				case prev === true:
					return 'deleteDeactiveConfirm';
			}
		},
		message: (prev, values) => {
			switch (true) {
				case values.start === 'listusers':
					return 'Where should the output be saved?';
				case values.start === 'deleteusers':
					return `All users for appId ${values.deleteAllAppId} will be deleted!\n\n  Are you sure you want to continue?`;
				case prev === true:
					return 'THIS CANNOT BE UNDONE.\n\n  Are you sure you want to continue?';
			}
		},
	},
	{
		type: 'confirm',
		name: 'deleteAllConfirm',
		message: 'THIS CANNOT BE UNDONE!\n\n  Are you sure you want to continue?',
	},
];

module.exports = { Questions };
