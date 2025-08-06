# Stripe Connect Setup Guide for Non-Technical Users

This guide will walk you through setting up Stripe Connect so users can receive payments through your app.

## What This Does
- Allows event hosts to receive money directly from ticket sales
- Handles all the complex payment processing automatically
- Ensures everyone gets paid securely and legally

## Before You Start
- Make sure you're logged into your Stripe account
- Have your business information handy (business name, address, etc.)
- Set aside 15-20 minutes to complete this

---

## Step-by-Step Instructions

### Step 1: Go to Stripe Connect Settings
1. Log into your Stripe Dashboard: https://dashboard.stripe.com
2. Look for "Settings" in the left menu and click it
3. Find "Connect" in the settings menu and click it
4. You should see "Platform profile" - click on that

### Step 2: Complete Your Platform Profile
You'll see several sections to fill out:

#### A. Basic Platform Information
- **Platform name**: Enter your app/business name (this is what users will see)
- **Platform description**: Write 1-2 sentences about what your platform does
- **Website URL**: Your main website address
- **Support email**: The email users should contact for help

#### B. Business Information
- **Business name**: Your official business name
- **Business address**: Your business address
- **Tax ID**: Your business tax ID number
- **Business type**: Select the option that best describes your business

#### C. Platform Usage
- **What does your platform do?**: Select "Marketplace" or "Software Platform"
- **How do payments work?**: Select "Users collect payments through my platform"
- **Who are your users?**: Describe who uses your platform (e.g., "Event organizers")

### Step 3: Acknowledge Legal Responsibilities
Stripe will show you information about:
- **Loss liability**: You're responsible if users can't pay back chargebacks or refunds
- **Compliance**: You'll help ensure users follow payment rules
- **Fraud prevention**: You'll watch for suspicious activity

**Important**: Read these carefully and check the boxes to acknowledge you understand.

### Step 4: Configure Account Settings
#### Platform Controls
- ✅ Enable "Allow connected accounts to access their Stripe Dashboard"
- ✅ Enable "Allow platform to manage connected account settings"
- ✅ Set "Payout schedule" to "Daily" (recommended)

#### Onboarding Experience  
- ✅ Enable "Use Stripe-hosted onboarding" (easiest option)
- Set "Return URL" to: `https://your-app-domain.com/stripe/connect` (replace with your actual domain)
- Set "Refresh URL" to: `https://your-app-domain.com/stripe/connect` (same as above)

### Step 5: Brand Customization (Optional but Recommended)
- Upload your company logo
- Set your brand color (the color users will see in Stripe interfaces)
- This makes the payment process look more professional

### Step 6: Review and Activate
1. Review all the information you entered
2. Look for any red warnings or missing information
3. Click "Save" or "Activate Platform" when everything is complete

---

## Common Issues and Solutions

### "Missing Required Information"
- Go back through each section and look for red asterisks (*) 
- These mark required fields that need to be filled out

### "Platform Profile Incomplete"
- Make sure you've acknowledged all the legal responsibilities
- Check that your business information is complete
- Ensure you've set the return/refresh URLs correctly

### "Bank Account Required"
- You'll need to add a bank account for your business
- This is where Stripe will deposit your platform fees
- Go to Settings > Bank accounts and routing numbers

---

## What Happens Next?

Once you complete this setup:
1. The "Platform configuration incomplete" error will disappear
2. Users will be able to click "Get Started" on the payment setup page
3. They'll be taken through Stripe's secure onboarding process
4. Once approved, they can start receiving payments

## Need Help?

If you get stuck:
1. Check the Stripe documentation: https://docs.stripe.com/connect
2. Contact Stripe support through your dashboard
3. Reach out to your technical team with screenshots of any errors

---

## Important Notes

- **This is a one-time setup** - you won't need to do this again
- **Test mode vs Live mode**: Make sure you're in "Live mode" (not "Test mode") when doing this setup
- **Processing time**: It may take a few hours for the changes to take effect
- **User experience**: After this setup, your users will have a smooth, professional payment onboarding experience

The app should work perfectly once this is complete!