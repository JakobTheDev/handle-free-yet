import boto3
from botocore.exceptions import ClientError
import json
import os
import twitter

def lambda_handler(event, context):
  # Authenticate to the twitter API
  api = twitter.Api(consumer_key=os.environ['CONSUMER_KEY'],
                    consumer_secret=os.environ['CONSUMER_SECRET'],
                    access_token_key=os.environ['ACCESS_TOKEN_KEY'],
                    access_token_secret=os.environ['ACCESS_TOKEN_SECRET'])

  for query in event:
    try:
      # Fetch the user by handle
      print('Querying handle ' + query['screen_name'])
      user = api.GetUser(screen_name=query['screen_name'])
    except:
      # Twitter package throws error on not found - this is our success case!
      print('Is it Christmas already 🎄 Your handle is available!')
      # Send the email and move on to the next query
      send_email(query)
      continue

    # Dang... the handle exists
    print('Handle is taken 😢')

def send_email(query):
  # Replace sender@example.com with your "From" address.
  # This address must be verified with Amazon SES.
  SENDER = "IisMyTwitterHandleAvailableYet <IsMyTwitterHandleAvailableYet@pennington.io>"
  
  # Replace recipient@example.com with a "To" address. If your account 
  # is still in the sandbox, this address must be verified.
  RECIPIENT = query['email']
  
  # Specify a configuration set. If you do not want to use a configuration
  # set, comment the following variable, and the 
  # ConfigurationSetName=CONFIGURATION_SET argument below.
  CONFIGURATION_SET = "ConfigSet"
  
  # If necessary, replace us-west-2 with the AWS Region you're using for Amazon SES.
  AWS_REGION = "ap-southeast-2"
  
  # The subject line for the email.
  SUBJECT = "Is it Christmas already 🎄 Your handle is available!"
  
  # The email body for recipients with non-HTML email clients.
  BODY_TEXT = ("Your handle " + query['screen_name'] + ' is available. Go grab it, quick!')
              
  # The HTML body of the email.
  BODY_HTML = f"""<html>
  <head></head>
  <body>
    <h1>Your handle <{query['screen_name']} is available.</h1>
    <p>Go grab it, quick!</p>
  </body>
  </html>
              """            
  
  # The character encoding for the email.
  CHARSET = "UTF-8"
  
  # Create a new SES resource and specify a region.
  client = boto3.client('ses',region_name=AWS_REGION)
  
  # Try to send the email.
  try:
      #Provide the contents of the email.
      response = client.send_email(
          Destination={
              'ToAddresses': [
                  RECIPIENT,
              ],
          },
          Message={
              'Body': {
                  'Html': {
                      'Charset': CHARSET,
                      'Data': BODY_HTML,
                  },
                  'Text': {
                      'Charset': CHARSET,
                      'Data': BODY_TEXT,
                  },
              },
              'Subject': {
                  'Charset': CHARSET,
                  'Data': SUBJECT,
              },
          },
          Source=SENDER,
          # If you are not using a configuration set, comment or delete the
          # following line
          # ConfigurationSetName=CONFIGURATION_SET,
      )
  # Display an error if something goes wrong.	
  except ClientError as e:
      print(e.response['Error']['Message'])
  else:
      print("Email sent! Message ID:"),
      print(response['MessageId'])