# Tanda Hackathon 2017 - Webhooks

> "This year we're celebrating our new Webhooks Platform and upgraded Tanda API. So come along and build something cool!"

The 2017 Tanda Hackathon in Brisbane went for about 24 hours between the 27th and 28th of October. I built a tool which leverages the Tanda Webhooks API to create and terminate EC2 instances for developers when they clock in or out. I used NodeJS, with the Serverless Framework to deploy AWS Lambda functions to achieve this.

Use case: a developer comes in to work and clocks in, this triggers the creation of an EC2 instance for them to work from. This instance is tagged with their `user_id` and `shift_id` which the Tanda Webhook provides in the POST body. When the developer clocks out; their EC2 instance is terminated.

## Set up

*Pre-requisites*

To deploy this you need to install the [Serverless](https://serverless.com/) Framework and set up your AWS credentials, you can find instructions on how to do that [here](https://serverless.com/framework/docs/getting-started/).

1. Clone or fork this repo

2. Update the `serverless.yml` file

  You need to provide an AWS Security Group id and Key Pair name. To make it easy to update these I define them under `environment` in the `serverless.yml` file.

  The Security Group id is used to allow SSH access on port 22 for the created EC2 instances.

3. Deploy Lambda

  ```bash
  $ sls deploy
  ```

  This will deploy your Lambda, upon completion you will be given a url, which will look something like `https://xxxxxx.execute-api.us-east-1.amazonaws.com/dev/hook`

4. Create your Webhook

  Now, create your [Tanda Webhook](https://my.tanda.co/api/webhooks) for the `clockin.updated` event, and provide the url you were given when you deployed the function. If you need to get that url again, you can run:
  ```bash
  $ sls info
  ```

After that you should be good to go, and you can test this by clocking in and out with the Tanda time clock. You should see EC2 instances being spun up and terminated, and you can look at the AWS CloudWatch Logs to see whats happening when the Lambda function is invoked.

It would be great to know if something is unclear or doesn't work as I have described, so don't hesitate to get in touch.

## Hackathon presentation - content from my slides

**Benefits**

 - Leverage cloud computing pricing
  - Not paying for unused servers overnight, or over weekends
 - Users Automatically get their environments spun up
 - Fresh environments (it works on my machine...?)

**Stack**

 - NodeJS
 - AWS Lambda/Serverless framework
 - AWS SDK
 - Tanda Webhooks api


**Future improvements**

- Notify relevant user (maybe via Slack or SMS) of the location of their new instance
  - No clicking through console to get the instance URL
- Dockerize - spin up server with fresh copy of codebase, database/s and any other resources
- Automatically configure the machine based on users preferences (e.g. their dotfiles)
- Improved key pair management

