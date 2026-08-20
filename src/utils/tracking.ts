import { PostHog } from 'posthog-node';

// Singleton instance to avoid multiple clients in serverless environments
let posthogClient: PostHog | null = null;

export const getPostHogClient = () => {
  if (!posthogClient) {
    posthogClient = new PostHog(
      process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
      {
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      }
    );
  }
  return posthogClient;
};

// ==========================================
// BUSINESS TRACKING UTILITIES (SERVER-SIDE)
// ==========================================

export const trackUserRegistered = (userId: string, data: { personType: string; email: string }) => {
  const client = getPostHogClient();
  client.capture({
    distinctId: userId,
    event: 'user_registered',
    properties: {
      account_type: data.personType,
      email: data.email,
    },
  });
};

export const trackPlanUpgraded = (userId: string, data: { oldPlan: string; newPlan: string; planType: 'product' | 'service' }) => {
  const client = getPostHogClient();
  client.capture({
    distinctId: userId,
    event: 'plan_upgraded',
    properties: {
      old_plan: data.oldPlan,
      new_plan: data.newPlan,
      plan_type: data.planType,
    },
  });
};

export const trackReviewSubmitted = (userId: string, data: { targetId: string; rating: number }) => {
  const client = getPostHogClient();
  client.capture({
    distinctId: userId,
    event: 'review_submitted',
    properties: {
      target_id: data.targetId,
      rating: data.rating,
    },
  });
};

export const trackWhatsAppRedirect = (userId: string, data: { targetBusinessId: string }) => {
  const client = getPostHogClient();
  client.capture({
    distinctId: userId,
    event: 'whatsapp_redirect',
    properties: {
      target_business_id: data.targetBusinessId,
    },
  });
};

// Shutdown gracefully if needed (e.g. at the end of a long running process)
export const shutdownPostHog = async () => {
  if (posthogClient) {
    await posthogClient.shutdown();
  }
};
