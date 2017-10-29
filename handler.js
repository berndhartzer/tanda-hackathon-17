'use strict';

const AWS = require('aws-sdk');

module.exports.handler = (event, context, callback) => {

  console.log(JSON.stringify(event));

  const data = JSON.parse(event.body);

  const isClockIn = data.payload.body.type == 'clockin' ? true : false;

  const tagName = data.payload.body.user_id + '-' + data.payload.body.shift_id;

  const ec2 = new AWS.EC2({apiVersion: '2016-11-15'});

  // If we're clocking in; create an ec2 instance
  if (isClockIn) {

    const ec2Params = {
      ImageId: 'ami-8c1be5f6',
      InstanceType: 't2.micro',
      MinCount: 1,
      MaxCount: 1,
      KeyName: process.env.SSH_KEY
    };

    // Create the instance
    ec2.runInstances(ec2Params, function(err, data) {

      if (err) {
        console.log('Could not create instance', err);
        callback(new Error(err));
        return;
      }

      const instanceId = data.Instances[0].InstanceId;
      console.log('Created instance', instanceId);

      // Add ssh access
      const secParams = {
        GroupId: process.env.SEC_GROUP_ID,
        IpPermissions: [
          {
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            IpRanges: [{'CidrIp':'0.0.0.0/0'}]
          }
        ]
      };

      ec2.authorizeSecurityGroupIngress(secParams, function(err, data) {
        if (err) {
          console.log('Error', err);
        } else {
          console.log('Ingress Successfully Set', data);
        }
      });

      // Add tag to the instance
      const tagParams = {
        Resources: [
          instanceId
        ], 
        Tags: [
          {
            Key: 'Name',
            Value: tagName
          }
        ]
      };

      ec2.createTags(tagParams, function(err) {
        console.log('Tagging instance', err ? 'failure' : 'success');
      });

      callback(
        null,
        {
          statusCode: 200,
          body: 'ok - instance created',
        }
      );
      return;

    });

  } else {

    // User is clocking out

    // Find this users instance
    const descInstancesParam = {
      Filters: [
        {
          Name: 'tag:Name',
          Values: [
            tagName
          ]
        }
      ]
    };

    ec2.describeInstances(descInstancesParam, function(err, data) {

      if (err) {
        console.log('Could not find instance', err);
        callback(new Error(err));
        return;
      }

      const instanceIdToTerminate = data.Reservations[0].Instances[0].InstanceId;

      console.log('terminate instance', instanceIdToTerminate);

      const terminateParams = {
        InstanceIds: [
          instanceIdToTerminate
        ]
      };

      ec2.terminateInstances(terminateParams, function(err, data) {

        if (err) {
          console.log('error terminating instance')
          callback(new Error(err));
        } else {

          console.log('success terminating instance: ' + data);

          callback(
            null,
            {
              statusCode: 200,
              body: 'ok - instance terminated',
            }
          );
          return;

        }

      });

    });

  }

}
