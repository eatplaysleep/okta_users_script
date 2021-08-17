<!-- @format -->

This node js application provides functions to list Okta users app profiles, delete users by appId, delete deactivated users, update user profiles and ~~generate a mapping comparison of the Okta profile to Application profile via CSV file~~.

This application requires node to be installed. Please visit the following url to install node js. https://nodejs.org/en/download/

After installation run `npm install` to download the required node packages.

Modify the config.json to with your specific Okta tenant configurations and specify the list of users excluded from the delete operations (if applicable).
**Note** that the userId is the Okta User `id` not the Okta user `login`. Most commands use a queue to process calls to Okta. This allows for the scripts to execute calls in parallel for better performance. The number of workers allowed in the queue can be configured in the config.json (default is 10 workers). Here is an example config.json.

```
{
  "okta": {
        "orgUrl": "https://{okta org}",
        "token": "{apikey}"
    },
    "excludeUsers": ["ID1", "ID2", "ID3"],
    "userlist": {
        "workercount": 25
    },
    "userdelete": {
        "workercount": 10
    },
    "rateLimitThreshold": 0.30
}
```

~~To simplify generation of the mapping of the user profiles. There is a helper command which pulls the mapping from Okta and creates the mapping used for the user profile diff.~~

~~The user profile diff uses the output from the user list.~~

For update users, the key is the Okta user `id`. Make sure the column names match the exact attributes in Okta. For Example:

> id,firstName,lastName
> 0ukgsvuo2BVCm4VQ0h7,Tim,changed
> 00ukkayfa1YrfTYnD0h7,Larry,changed1

To begin, simply type `npm start` in the command line and follow the on-screen prompts.

## TODO

- [ ] Implement CLI input for UserProfileDiff
- [ ] Implement UserProfileDiff combined mechanism
