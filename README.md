# Status

WARNING: This is currently in a pre-release state and is missing important steps in the documentation. Use at your own risk!


# Introduction

This project uses the Serverless Framework to provision AWS resources to receive https requests, store them in a queue, then process the queue via a Lambda function which sends each request to FMS via the Data API. The result of this is a record will be created in your FileMaker database for each request, and a script will be run for each created record, allowing you to control how to handle the webhook directly from a FileMaker script.

A goal of this project is to not have to put any custom business logic in AWS and just let a script in FileMaker determine how to handle the request (or not if it was spam, for example). That said, if you're comfortable writing JavaScript to run in an AWS Lambda, you can put business logic there as well.



# Setup

1. Download this project's files (via git clone, download zip, etc.)
2. [Install Node.js](https://nodejs.org/en/download/)
3. [Install serverless framework](https://www.serverless.com/framework/docs/getting-started): `npm install -g serverless`
4. Duplicate the `.env.template` file, rename to `.env`, modify values for your system.
5. [Configure AWS Credentials](https://www.serverless.com/framework/docs/providers/aws/guide/credentials#using-aws-profiles), then enter the profile name you stored credentials as in the `.env` file's AWS_PROFILE variable. If you chose not use a profile name to manage credentials, it's assumed that you also know how to modify the project accordingly.
6. Run installation script: `npm run setup` (from the project's root directory).
7. Deploy the project, which creates AWS resources: `npm run deploy`
	- note that you can run this command again in the future if you need to change something



# Prepare your FileMaker file

1. Copy the `ServerlessWebhookQueue` table from the included `FileMaker-serverless-webhook-queue.fmp12` file and paste it into your file.
	- Could alternatively host the included sample file and let it call your file as it processes webhooks.
2. Create a script named `serverless-webhook-queue` in your file. It doesn't have to do anything yet, you can add your own logic to it once you've confirmed your webhooks are working. You might want to use the script from the sample file as a starting point, but you don't have to.
3. Create a new account specifically for use by this process and give it `fmrest` extended privileges, allow creation of records in the `ServerlessWebhookQueue`, and allow it to perform the `serverless-webhook-queue` script.
	- I highly recommend against re-using an existing account for this. If you create a new account, it allows you to freely change the password both in your file and this project without worrying about breaking something else. Since this password is exposed to the Lambda function as plain text, anyone who has access to that function has access to your account.



# Configuring FMS Credentials in AWS

FMS DAPI user and password must be stored in [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html), so the Lambda function can access your FileMaker Server. There are two (documented) ways to configure this:

## Option 1: use the [AWS CLI](https://aws.amazon.com/cli/)  
run these commands (replacing the value with your own):  

	aws ssm put-parameter --name /FileMaker-serverless-webhook-queue/fmsUser --type String --value "YourFMSUsername"

	aws ssm put-parameter --name /FileMaker-serverless-webhook-queue/fmsPass --type SecureString --value "YourFMSPassword"

- can specify a `--profile`, if needed
- append ` --overwrite` to update the value

## Option 2: use the web interface
- From the [AWS Management Console](https://aws.amazon.com/console) go to **AWS Systems Manager** > **Parameter Store** (after signing in)
- create two parameters:
	- Name: **/FileMaker-serverless-webhook-queue/fmsUser**
		- Tier: **Standard**
		- Type: **String**
		- Data type: **text**
		- Value: **YourFMSUsername**
	- Name: **/FileMaker-serverless-webhook-queue/fmsPass**
		- Tier: **Standard**
		- Type: **SecureString**
		- KMS key source: **My current account**
		- Value: **YourFMSPassword**



# TODO for making this repo public:

- might want to update customDomain config based on your DNS settings for your domain, change createRoute53Record to true if you use Route 53 for DNS, for example
- https://www.serverless.com/plugins/serverless-domain-manager
- manually request certificate from **AWS Certificate Manager (ACM)**?
- [ ] create an FM sample file
	- [ ] add the script, table, layout, and field names to readme
		- [ ] add header comment to `serverless-webhook-queue` script
			- [ ] include repo url
- [ ] is the fmPass exposed in any local temp files in this build?
	- what about the Lambda? Are environment variables encrypted?
	- would it be difficult to securely retrieve credentials at runtime?
