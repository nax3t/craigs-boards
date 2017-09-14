// expose our config directly to our application using module.exports
module.exports = {
  'facebookAuth': {
    'clientID': process.env.FB_APP_ID, // your App ID
    'clientSecret': process.env.FB_APP_SECRET, // your App Secret
    'profileURL': 'https://graph.facebook.com/v2.5/me?fields=first_name,last_name,email'
  }
};