# ER Simulator - Subscription Platform Requirements

**Extracted From:** ChatGPT conversation on subscription architecture
**Date:** 2025-11-03
**Status:** Planning Phase - Pre-AWS Integration

---

## 🎯 Core Requirements

### Business Needs

1. **Scalability:** Handle 10,000+ subscribers
2. **Multi-Platform:** Web (desktop browser), iOS App Store, Google Play Store
3. **White-Label Branding:** Login on custom domain (e.g., `portal.ersimulator.com`)
4. **Self-Service:** Users manage their own subscriptions/memberships
5. **Global Reach:** Support international payments, currencies, tax compliance
6. **Hands-Off Maintenance:** Minimal ongoing subscription infrastructure work
7. **Multi-App Support:** Ability to run multiple apps with separate analytics

### Technical Requirements

1. **Unified Authentication:** Single login across web + mobile
2. **Cross-Platform Subscription State:** Purchase on iOS, access on web (and vice versa)
3. **Automated Payment Processing:** Apple IAP, Google Play, Stripe, all unified
4. **Customer Portal:** Users can view status, upgrade/downgrade, cancel
5. **Analytics Dashboard:** MRR, churn, subscriber metrics across platforms
6. **Compliance:** Automatic tax/VAT handling for 200+ regions

---

## ✅ Recommended Architecture

### Stack (From ChatGPT Analysis)

**Primary Components:**
1. **Paddle** - Merchant of Record (web/desktop payments)
2. **RevenueCat** - Subscription orchestration layer (unifies all platforms)
3. **Auth0/Clerk/Supabase Auth** - User authentication on custom domain
4. **Stripe** - (Optional) Secondary processor for enterprise/custom billing

### Why This Stack

**Paddle:**
- Handles tax/VAT globally (you never register for foreign tax accounts)
- Merchant of Record = they own compliance burden
- 5% + $0.50/transaction fee
- Built-in customer portal for subscription management

**RevenueCat:**
- Unifies Apple, Google Play, and Paddle transactions
- Cross-platform entitlement management
- ~1% of monthly tracked revenue (after free tier)
- Single API to check subscription status
- Analytics dashboard across all platforms

**Benefits:**
- No Stripe babysitting (Paddle handles web payments as MoR)
- Global currency and tax localization automatic
- Self-service customer management
- White-label login on your domain
- Scales from 0 → 10,000+ subscribers seamlessly

---

## 💰 Cost Structure

### At Different Scales

**0-100 Subscribers (Startup Phase):**
- Paddle: 5% + $0.50/transaction
- RevenueCat: Free tier (up to $2,500 monthly tracked revenue)
- Apple/Google: 30% (15% after year 1) on IAP
- **Estimated monthly:** Variable, but minimal fixed costs

**1,000 Subscribers:**
- Paddle: 5% of web revenue
- RevenueCat: ~1% of total revenue
- App stores: 15-30% of mobile revenue
- **Total platform fees:** ~10-15% of revenue (web), 30-40% (mobile)

**10,000+ Subscribers:**
- Same percentage-based fees
- RevenueCat may offer volume discounts
- Paddle pricing stays consistent
- No infrastructure scaling needed (handled by platforms)

---

## 🏗️ Integration Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    ER Simulator Platform                     │
│                   (portal.ersimulator.com)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
       ┌───────────────┴────────────────┐
       │                                │
       ▼                                ▼
┌──────────────┐              ┌──────────────────┐
│    Paddle    │              │   RevenueCat     │
│ (Web/Desktop)│◄─────────────┤  (Orchestration) │
└──────────────┘              └─────────┬────────┘
                                        │
                       ┌────────────────┼────────────────┐
                       ▼                ▼                ▼
                ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
                │  App Store  │  │ Google Play │  │   Stripe    │
                │    (iOS)    │  │  (Android)  │  │  (Optional) │
                └─────────────┘  └─────────────┘  └─────────────┘
```

### Data Flow

1. **User Signs Up:** Via Auth0/Clerk on `portal.ersimulator.com`
2. **User Subscribes:**
   - Web: Paddle checkout → Webhook → RevenueCat
   - iOS: Apple IAP → RevenueCat SDK
   - Android: Google Play → RevenueCat SDK
3. **Entitlement Check:** App queries RevenueCat API with user ID
4. **Subscription State:** Unified across all platforms
5. **Management:** User accesses Paddle portal or RevenueCat Customer Center

---

## 🔐 Security & Compliance

### Requirements

1. **HTTPS/HSTS:** All portal pages
2. **Webhook Verification:** Validate Paddle signatures with public key
3. **No PCI Compliance Needed:** Paddle is Merchant of Record
4. **API Key Rotation:** Annual rotation of RevenueCat keys
5. **GDPR/Privacy:** User data handling in Supabase (if used)

### Authentication Flow

```
User → portal.ersimulator.com
      → Auth0/Clerk login
      → JWT token
      → Pass user_id to RevenueCat API
      → Check entitlement
      → Grant/deny access to scenarios
```

---

## 📋 Implementation Phases

### Phase V.A - Prerequisites (Current)
**Before AWS Integration:**
- All tools tested individually ✅
- Modular architecture complete ✅
- Quality systems validated ✅

### Phase V.B - AWS Infrastructure
**Deploy core simulation engine:**
- API Gateway configuration
- Lambda functions
- S3 storage for scenarios
- CloudWatch monitoring

### Phase V.C - Subscription Platform Setup
**Integrate Paddle + RevenueCat:**
1. Create Paddle merchant account
2. Set up RevenueCat project
3. Configure authentication (Auth0/Clerk)
4. Build customer portal on custom domain
5. Integrate SDKs (web + mobile)
6. Set up webhooks and entitlement checks
7. Test cross-platform subscription flow

### Phase V.D - Database Migration
**Move from Google Sheets to Supabase/AWS RDS:**
- Migrate 206+ scenarios
- Set up real-time sync
- Connect to subscription entitlements
- Multi-user access control

### Phase V.E - AI Facilitator Integration
**Connect scenarios to subscription tier:**
- Basic scenarios (free tier)
- Premium scenarios (paid subscription)
- Adaptive AI facilitation (premium feature)
- Analytics tracking per tier

---

## 🧪 Testing Strategy

### Critical Test Cases

1. **Purchase Flow:**
   - [ ] Web checkout via Paddle
   - [ ] iOS in-app purchase
   - [ ] Android in-app purchase

2. **Entitlement Sync:**
   - [ ] Purchase on iOS, login on web → Access granted
   - [ ] Purchase on web, login on iOS → Access granted
   - [ ] Cancel subscription → Access revoked everywhere

3. **Customer Portal:**
   - [ ] User can view subscription status
   - [ ] User can upgrade/downgrade plan
   - [ ] User can cancel subscription
   - [ ] User receives invoices/receipts

4. **Edge Cases:**
   - [ ] Subscription expired → Graceful degradation
   - [ ] Payment failure → Retry logic
   - [ ] Refund request → Entitlement handling
   - [ ] Platform switching (iOS ↔ Android ↔ Web)

---

## 🔧 Developer Handoff Checklist

### Environment Variables Needed

```bash
# Paddle
PADDLE_VENDOR_ID=xxxxxxxx
PADDLE_API_KEY=xxxxxxxx
PADDLE_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----...-----END PUBLIC KEY-----

# RevenueCat
REVENUECAT_PROJECT_ID=your_project_id
REVENUECAT_API_KEY=rc_XXXXXXXXXXXXXXXX
REVENUECAT_WEBHOOK_SECRET=rcwh_XXXXXXXXXXXX

# Auth Provider (Auth0/Clerk)
AUTH_DOMAIN=ersimulator.clerk.accounts.dev
AUTH_CLIENT_ID=xxxxxxxxxxxxx
AUTH_CLIENT_SECRET=xxxxxxxxxxxxx

# Optional: Stripe
STRIPE_API_KEY=sk_live_xxxxxxxxxxxxx
```

### SDK Dependencies

**Web/Frontend:**
```bash
npm install @paddle/paddle-js
npm install @clerk/clerk-react  # or auth0-react
npm install axios
```

**Backend:**
```bash
npm install express body-parser axios
```

**iOS:**
- RevenueCat Purchases SDK: https://github.com/RevenueCat/purchases-ios

**Android:**
- RevenueCat Purchases SDK: https://github.com/RevenueCat/purchases-android

---

## 📊 Analytics & Monitoring

### Key Metrics to Track

1. **Subscription Metrics:**
   - Monthly Recurring Revenue (MRR)
   - Annual Recurring Revenue (ARR)
   - Churn rate
   - Customer Lifetime Value (LTV)
   - Subscriber count by platform

2. **Platform Distribution:**
   - Web vs iOS vs Android subscribers
   - Revenue by platform
   - Conversion rates per platform

3. **Scenario Usage:**
   - Most accessed scenarios
   - Premium vs free tier usage
   - AI facilitator engagement
   - Learning pathway completion rates

### Monitoring Tools

- **RevenueCat Dashboard:** MRR, churn, subscriber analytics
- **Paddle Dashboard:** Web payment metrics, tax reports
- **CloudWatch:** AWS infrastructure health
- **Supabase Analytics:** Database performance, user activity

---

## 🚀 Go-Live Checklist

### Pre-Launch

- [ ] Paddle merchant account approved
- [ ] RevenueCat project configured
- [ ] Auth provider (Clerk/Auth0) set up on custom domain
- [ ] Customer portal UI complete
- [ ] Webhook endpoints configured and tested
- [ ] Mobile apps submitted to App Store/Play Store
- [ ] Entitlement checks working across all platforms
- [ ] Customer support documentation ready

### Launch Day

- [ ] Enable Paddle live mode
- [ ] Enable RevenueCat production API
- [ ] DNS configured for custom domain
- [ ] SSL certificates valid
- [ ] Monitoring dashboards active
- [ ] Support team briefed on subscription flow

### Post-Launch

- [ ] Monitor webhook logs for errors
- [ ] Check RevenueCat dashboard for sync issues
- [ ] Verify first purchases flow correctly
- [ ] Validate cross-platform entitlements
- [ ] Gather user feedback on portal UX

---

## 🔄 Multi-App Support

### Extending to Multiple Apps

**Question:** "If I were to create multiple apps would these work the same for me?"

**Answer:** Yes - RevenueCat supports multiple apps:

1. **Separate Projects:** Create a RevenueCat project per app
2. **Unified Analytics:** View MRR and metrics separately or combined
3. **Shared Customer IDs:** Use same auth provider across apps
4. **Different Entitlements:** Each app can have its own subscription tiers

**Architecture:**
```
RevenueCat Account
├── Project: ER Simulator (emergency medicine)
│   ├── Entitlement: pro_monthly
│   └── Entitlement: pro_annual
├── Project: Anesthesia Simulator (anesthesiology)
│   ├── Entitlement: anes_pro_monthly
│   └── Entitlement: anes_pro_annual
└── Project: Surgery Simulator (surgery)
    ├── Entitlement: surg_pro_monthly
    └── Entitlement: surg_pro_annual
```

**Benefits:**
- Separate analytics per specialty
- Cross-app bundle subscriptions possible
- Shared user base (if desired)
- Independent pricing strategies

---

## 📝 Notes for Future Development

### Current Status (Phase I - Complete)

- ✅ 206+ medical scenarios created
- ✅ Google Sheets as temporary database
- ✅ Batch processing with OpenAI
- ✅ Quality control systems implemented
- ✅ No subscription platform yet

### When to Start Subscription Integration

**Prerequisites:**
1. ✅ All scenario generation tools tested (Phase I)
2. 📋 Modular Apps Script architecture (Phase III)
3. 📋 Quality scoring systems (Phase III)
4. 📋 AWS infrastructure deployed (Phase V.B)
5. 📋 Supabase database migration (Phase V.D)

**Then:** Implement Paddle + RevenueCat (Phase V.C)

### Questions to Answer Before Implementation

1. **Pricing Strategy:**
   - What's the monthly/annual subscription price?
   - Free tier scenarios vs premium scenarios?
   - Student discounts?

2. **Trial Period:**
   - 7-day free trial?
   - 14-day trial?
   - Limited free access?

3. **Subscription Tiers:**
   - Single tier (all scenarios)?
   - Multiple tiers (basic, pro, enterprise)?
   - Specialty-specific bundles?

4. **Custom Domain:**
   - `portal.ersimulator.com`?
   - `app.simmastery.com`?
   - Different domain per app?

---

## 🔗 Reference Links

### Documentation
- **Paddle Docs:** https://developer.paddle.com/
- **RevenueCat Docs:** https://docs.revenuecat.com/
- **Auth0 Docs:** https://auth0.com/docs
- **Clerk Docs:** https://clerk.com/docs

### Integration Guides
- **Paddle + RevenueCat:** https://docs.revenuecat.com/docs/paddle
- **Apple IAP + RevenueCat:** https://docs.revenuecat.com/docs/ios-products
- **Google Play + RevenueCat:** https://docs.revenuecat.com/docs/android-products

### Cost Calculators
- **Paddle Pricing:** https://paddle.com/pricing
- **RevenueCat Pricing:** https://revenuecat.com/pricing
- **Apple App Store Fees:** 30% (15% after year 1 or for small business program)
- **Google Play Fees:** 15% (service fee)

---

**Document Version:** 1.0
**Created:** 2025-11-03
**Status:** Planning Phase
**Next Review:** Before Phase V.C implementation
