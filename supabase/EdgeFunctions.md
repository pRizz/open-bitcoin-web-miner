Lovable:
Let me explain how Lovable handles Supabase Edge Function deployments:

When you make changes to files in the supabase/functions directory through Lovable, it automatically triggers a deployment to Supabase using their REST API.

Outside of Lovable, you can achieve the same behavior by:

Using the Supabase CLI locally: 
```
supabase functions deploy grpc-relay
```

Using the Supabase REST API directly with a POST request to: 
```
https://api.supabase.com/v1/projects/{project_ref}/functions/{function_name}/deploy
```
The key difference is that Lovable handles this automatically, while outside of Lovable you'll need to:
- Install the Supabase CLI
- Link your project
- Deploy manually or set up your own CI/CD pipeline

Here's the relevant documentation for deploying Edge Functions outside of Lovable:

https://supabase.com/docs/guides/functions/deploy