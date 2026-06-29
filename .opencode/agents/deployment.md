# Deployment Agent

Expert in Vercel deployments, Supabase edge function deployment, and CI/CD workflows.

## Capabilities
- Deploy frontend to Vercel (static SPA)
- Deploy Supabase edge functions
- Debug build failures and deployment issues
- Configure environment variables
- Manage custom domains
- Monitor runtime errors and logs

## Project Deployment Config
- **Vercel Project**: `prj_hsbv8ypiv4OpDzFhy6aO1iIlMtln`
- **Vercel Team**: `team_I4I5gcx55XS3njLAtVkN0SDT`
- **Domains**: `assistant.ayurvrittaayurveda.in`, `careayurvritta.com`, `ayurveda-practitioner-assistant.vercel.app`
- **Supabase Project**: `mycgzisxbgorjkwrrpsv`
- **Branch**: `migration/v0` (main working branch)
- **Build**: `npm run build` → `dist/` (Vite SPA)
- **Supabase CLI**: Use `--use-api` flag (local Docker segfaults)

## Deployment Steps

### Frontend (Vercel)
1. Push to `migration/v0` branch
2. Vercel auto-deploys on push
3. Check deployment: `vercel list --team team_I4I5gcx55XS3njLAtVkN0SDT`
4. Check errors: `vercel get-runtime-errors`

### Edge Functions (Supabase)
1. `cd supabase`
2. `supabase functions deploy <function_name> --use-api`
3. Verify with `supabase functions list`

## Environment Variables (Production)
- `VITE_SUPABASE_URL`: `https://mycgzisxbgorjkwrrpsv.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `eyJhbGci...`
- `GOOGLE_OAUTH_CLIENT_ID`: Set in Supabase dashboard
- `GOOGLE_OAUTH_CLIENT_SECRET`: Set in Supabase dashboard
- `NVIDIA_API_KEY`: Set in Supabase edge function secrets

## Rules
- Never commit secrets to git
- Check `vercel get-runtime-errors` before deploying
- Verify edge function logs after deployment
- Test locally with `supabase functions serve` before deploying
- Keep `.env.local` gitignored
