# Deployment Guide - Vercel

## Step-by-Step Deployment Instructions

### 1. Push to GitHub (if not already done)

```bash
git add .
git commit -m "prepare for Vercel deployment"
git push origin main
```

### 2. Deploy via Vercel Dashboard

1. **Go to [vercel.com](https://vercel.com)** and sign in with GitHub

2. **Click "Add New Project"**

3. **Import your GitHub repository:**
   - Select your `dlmm-pro-manager` repository
   - Click "Import"

4. **Configure Project:**
   - **Framework Preset:** Next.js (should auto-detect)
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run build` (auto-filled)
   - **Output Directory:** `.next` (auto-filled)
   - **Install Command:** `npm install` (auto-filled)

5. **Add Environment Variables:**

   Click "Environment Variables" and add:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SOLANA_NETWORK` | `mainnet-beta` |
   | `NEXT_PUBLIC_RPC_ENDPOINT` | Your Helius/QuickNode RPC URL |

   **IMPORTANT:** You MUST set `NEXT_PUBLIC_RPC_ENDPOINT` to a private RPC endpoint (Helius, QuickNode, or Alchemy), otherwise the app will only show demo data due to 403 errors from public RPCs.

   Example:
   ```
   NEXT_PUBLIC_RPC_ENDPOINT=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
   ```

6. **Click "Deploy"**

   Vercel will:
   - Clone your repository
   - Install dependencies
   - Build the Next.js app
   - Deploy to production

7. **Wait for deployment** (usually 2-3 minutes)

8. **Your app will be live at:** `https://your-project-name.vercel.app`

## Post-Deployment Steps

### 1. Verify the Deployment

- Open your Vercel URL
- Check browser console for `[DLMM]` logs
- Verify you see: `[DLMM] Found X pool addresses` (not 403 errors)
- Confirm no yellow "Demo Mode" banner appears

### 2. Set Up Custom Domain (Optional)

In Vercel dashboard:
1. Go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### 3. Configure Production Settings

**Recommended Vercel Settings:**

- **Node.js Version:** 18.x or 20.x
- **Function Regions:** Choose closest to your users
- **Analytics:** Enable for monitoring
- **Speed Insights:** Enable for performance tracking

## Environment Variables Reference

### Required Variables

```bash
# Network (mainnet-beta or devnet)
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta

# RPC Endpoint - MUST be a private RPC for real data
NEXT_PUBLIC_RPC_ENDPOINT=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

### Getting RPC Endpoints

1. **Helius (Recommended):**
   - Sign up: https://helius.dev
   - Free tier: 100k requests/day
   - URL format: `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`

2. **QuickNode:**
   - Sign up: https://quicknode.com
   - Free tier: 500k requests/day
   - URL format: `https://YOUR_ENDPOINT.solana-mainnet.quiknode.pro/YOUR_TOKEN/`

3. **Alchemy:**
   - Sign up: https://alchemy.com
   - URL format: `https://solana-mainnet.g.alchemy.com/v2/YOUR_KEY`

## Troubleshooting

### Build Fails

**Error: Module not found**
```bash
# Run locally to test build:
npm run build
```

**Error: Type errors**
```bash
# Fix TypeScript errors locally first
npm run lint
```

### 403 Errors After Deployment

If you see "Demo Mode" banner or 403 errors in console:

1. Check environment variables in Vercel dashboard
2. Ensure `NEXT_PUBLIC_RPC_ENDPOINT` is set correctly
3. Verify your RPC endpoint works by testing it locally
4. Redeploy after updating env vars

### App Shows Mock Data

- Environment variables must start with `NEXT_PUBLIC_` to be accessible in browser
- After changing env vars, redeploy the project
- Check browser console for `[DLMM]` logs to see which RPC is being used

## Continuous Deployment

Every push to your `main` branch will automatically trigger a new deployment on Vercel.

To deploy from a different branch:
1. Go to Vercel dashboard → Your project → Settings → Git
2. Change "Production Branch" to your desired branch

## Monitoring

### View Logs

1. Go to Vercel dashboard
2. Select your project
3. Click "Deployments"
4. Click on a deployment → "View Function Logs"

### Analytics

Enable Analytics in Settings to track:
- Page views
- User locations
- Performance metrics
- Error rates

## Alternative: Deploy via CLI

If you prefer CLI deployment:

```bash
# Login to Vercel
npx vercel login

# Deploy to production
npx vercel --prod

# Set environment variables
npx vercel env add NEXT_PUBLIC_SOLANA_NETWORK
npx vercel env add NEXT_PUBLIC_RPC_ENDPOINT
```

## Security Notes

- Never commit `.env.local` to Git (it's in `.gitignore`)
- Keep your RPC API keys secure
- Use Vercel's environment variables for sensitive data
- RPC endpoints in `NEXT_PUBLIC_*` are exposed to browser (this is expected)

## Cost

- **Vercel:** Free tier includes unlimited deployments
- **RPC Services:** All have generous free tiers
- **Total Cost:** $0/month for moderate usage

---

🎉 **Your DLMM Pro Manager is now live!**
