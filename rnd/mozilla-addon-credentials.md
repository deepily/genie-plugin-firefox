# Mozilla Add-ons API Credentials Setup

This guide explains how to set up API credentials for automated signing and publishing of the Genie in the Box Firefox extension.

## Step 1: Generate Mozilla API Credentials

1. Sign in to your [Mozilla Add-ons Developer Hub](https://addons.mozilla.org/en-US/developers/) account
2. Navigate to "My Account" → "API Keys" or go directly to: https://addons.mozilla.org/en-US/developers/addon/api/key/
3. Click "Generate new credentials"
4. Copy the generated JWT issuer and JWT secret - you'll need these for automated signing

## Step 2: Add Credentials to GitHub Secrets

To securely use these credentials in GitHub Actions:

1. Go to your GitHub repository
2. Navigate to "Settings" → "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Create two secrets:
   - Name: `AMO_JWT_ISSUER` - Value: your JWT issuer from Step 1
   - Name: `AMO_JWT_SECRET` - Value: your JWT secret from Step 1

## Step 3: Testing the Credentials

You can test your credentials locally by running:

```bash
# Install web-ext if you haven't already
npm install -g web-ext

# Test signing
web-ext sign --source-dir=/path/to/extension \
  --api-key=$AMO_JWT_ISSUER \
  --api-secret=$AMO_JWT_SECRET
```

## Security Considerations

- Never commit these credentials to your repository
- Only share credentials with team members who need to perform releases
- Rotate credentials periodically for increased security
- Consider using environment-specific credentials for staging vs. production releases

## Additional Resources

- [Mozilla Add-ons Developer Hub](https://addons.mozilla.org/en-US/developers/)
- [web-ext documentation](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/)
- [Mozilla Add-ons API Documentation](https://addons-server.readthedocs.io/en/latest/topics/api/auth.html)