SENDING EMAIL FROM THE ADMIN
============================

The Send tab prepares a message and a list. To have it actually send,
deploy this function and Supabase will do the sending for you.

WHY IT CANNOT JUST BE IN THE ADMIN PAGE
A page in a browser can be read by anyone who opens it. If the sending
key were in there, someone could take it and send email as you. This
function keeps the key on Supabase's servers.

TO SET IT UP
  1. Sign up at resend.com and verify alteryouapp.com as a sending domain.
     Skipping this is the single biggest reason launch emails go to spam.
  2. In a terminal, in this folder:
       supabase secrets set RESEND_API_KEY=re_your_key_here
       supabase functions deploy send-broadcast
  3. Tell me it is deployed and I will wire the Send tab to call it.

TEXT MESSAGES
Same idea, with Twilio instead of Resend. Worth knowing that SMS costs
a few cents each in Australia and needs sender ID registration, so it is
usually only worth it for something time critical like doors closing.

BEFORE YOU SEND ANYTHING TO A LIST
Australian spam law needs three things: consent, your business details
in the message, and a working unsubscribe. The consent column on the
Leads tab is there for the first one. This function sets an unsubscribe
header for the third. The second is up to what you write.
