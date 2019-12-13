import boto3
from boto3.dynamodb.conditions import Key, Attr
import json
import requests
import os

URL_RECAPTCHA = 'https://www.google.com/recaptcha/api/siteverify'

def lambda_handler(event, context):
    # Verify recaptcha
    data = {
      "secret": os.environ['CAPTCHA_KEY'],
      "response": event['recaptchaToken']
    }
    response = requests.post(url = URL_RECAPTCHA, data = data)
    if not json.loads(response.text)['success']:
        return {
            'success': False,
            'isDuplicate': False,
            'isJakob': False,
            'message': 'Error with CAPTCHA'
        }

    # Get the service resource.
    dynamodb = boto3.resource('dynamodb')
    
    # Instantiate a table resource object without actually
    # creating a DynamoDB table.
    table = dynamodb.Table('handleFreeYet')
    
    # Lowercase inputs for comparisons
    screen_name_lower = event['screen_name'].lower()
    email_lower = event['email'].lower()
    
    # Query the DB for the same handle / email combination
    response = table.scan(
        FilterExpression=Attr('screen_name').eq(screen_name_lower) & Attr('email').eq(email_lower)
    )
    items = response['Items']
    
    # if the combination exists, exit
    if len(items) > 0:
        print('User exists, exiting')
        return {
            'success': True,
            'isDuplicate': True,
            'isJakob': False,
            'message': 'You\'re already tracking this handle'
        }
    
    # Pls don't seal my handle...
    if (screen_name_lower == 'jakobpennington'):
        return {
            'success': True,
            'isDuplicate': False,
            'isJakob': True,
            'message': 'Oi!'
        }
    
    # Add it to the DB
    try:
        table.put_item(
           Item={
                'email': email_lower,
                'screen_name': screen_name_lower,
                'has_been_notified': False
            }
        )
    except:
        # Handle errors
        return {
            'success': False,
            'isDuplicate': False,
            'isJakob': False,
            'message': 'Something went wrong...'
        }
        
    return {
        'success': True,
        'isDuplicate': False,
        'isJakob': False,
        'message': 'We\'ll let you know when your handle is free'
    }
