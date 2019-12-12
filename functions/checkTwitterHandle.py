import boto3
import json
import os
import twitter

from botocore.exceptions import ClientError

def lambda_handler(event, context):
  # Authenticate to the twitter API
  api = twitter.Api(consumer_key=os.environ['CONSUMER_KEY'],
                    consumer_secret=os.environ['CONSUMER_SECRET'],
                    access_token_key=os.environ['ACCESS_TOKEN_KEY'],
                    access_token_secret=os.environ['ACCESS_TOKEN_SECRET'])

  try:
    # Fetch the user by handle
    print('Querying handle ' + event['screen_name'])
    api.GetUser(screen_name=event['screen_name'])
  except Exception as e:
    # Yuck...
    # TwitterError has no property 'code', so this is my dumb workaround
    errorString = str(e)
    errorJSONString = errorString.replace("'", '"')
    errorObject = json.loads(errorJSONString)
    errorCode = errorObject[0].get('code')
    
    # Handle free account
    if(errorCode == 50):
      return {
              'success': True,
              'isFree': True,
              'message': 'The handle is free!'
            }

    # Handle suspended account
    if(errorCode == 63):
      return {
              'success': True,
              'isFree': False,
              'message': 'The account is suspended...'
             }
    
    # Handle other errors
    return {
            'success': False,
            'isFree': False,
            'message': 'Something went wrong...'
           }
  
  # Dang... the handle exists
  return {
          'success': True,
          'isFree': False,
          'message': 'The handle is taken'
         }