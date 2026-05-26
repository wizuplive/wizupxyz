import { LegalPage } from '@/components/legal-page';

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy Policy"
      updated="May 26, 2026"
      intro="This policy explains what WIZUP collects, how it is used, and the providers involved in running the product. It is intentionally short and practical."
      sections={[
        {
          title: 'Information we collect',
          body: [
            'We collect account and authentication information such as your email address, profile details, login state, and settings needed to operate your account.',
            'When you use WIZUP, we may store product ideas, prompts, generated drafts, saved projects, workflow activity, and other content you choose to create in the app.',
          ],
        },
        {
          title: 'Analytics and product usage',
          body: [
            'We may collect basic usage data such as pages visited, feature interactions, device/browser information, and error logs so we can understand reliability and improve the product.',
            'We do not use analytics to make guarantees about your business results, revenue, or product performance.',
          ],
        },
        {
          title: 'Payments',
          body: [
            'Payment processing may be handled by third-party providers, including crypto payment providers such as NOWPayments. We store payment status, provider references, invoice details, and webhook events needed to reconcile billing.',
            'We do not store private wallet keys. Crypto transactions may be visible on public blockchains depending on the network used.',
          ],
        },
        {
          title: 'AI generation',
          body: [
            'WIZUP uses AI providers to help generate ideas, product drafts, sales assets, and related content. Your prompts and relevant context may be sent to AI services so the requested output can be created.',
            'AI-generated content can be inaccurate or incomplete. You are responsible for reviewing and editing outputs before using them.',
          ],
        },
        {
          title: 'Third-party providers',
          body: [
            'WIZUP may use third-party providers for authentication, database hosting, AI generation, payments, analytics, and infrastructure. These providers process data only as needed to deliver the service.',
            'Provider availability, policies, and processing locations may change over time as the product evolves.',
          ],
        },
        {
          title: 'Cookies and local storage',
          body: [
            'WIZUP may use cookies, browser storage, and similar technologies to keep you signed in, remember preferences, support security, and improve app behavior.',
            'You can control browser storage through your browser settings, but disabling it may affect core product functionality.',
          ],
        },
        {
          title: 'Contact',
          body: [
            'For privacy questions or requests, contact wizuplive@gmail.com.',
          ],
        },
      ]}
    />
  );
}
