import { LegalPage } from '@/components/legal-page';

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms of Service"
      updated="May 26, 2026"
      intro="These terms set the basic rules for using WIZUP. By using the product, you agree to use it responsibly and to review outputs before relying on them."
      sections={[
        {
          title: 'Using WIZUP',
          body: [
            'WIZUP helps users discover, build, and prepare digital product ideas and related sales assets. You are responsible for your account, your content, and how you use the outputs created in the app.',
            'You must provide accurate account information and keep your login credentials secure.',
          ],
        },
        {
          title: 'Acceptable use',
          body: [
            'Do not use WIZUP to create illegal, harmful, deceptive, abusive, infringing, or spam content. Do not attempt to disrupt, reverse engineer, overload, or misuse the service.',
            'You are responsible for making sure your products, claims, pricing, sales pages, and marketing comply with laws and platform rules that apply to you.',
          ],
        },
        {
          title: 'AI-generated content',
          body: [
            'WIZUP uses AI to generate drafts, suggestions, ideas, and business materials. AI output may be inaccurate, incomplete, outdated, or unsuitable for your specific situation.',
            'You should review, edit, fact-check, and legally clear any output before publishing, selling, or relying on it.',
          ],
        },
        {
          title: 'No business or revenue guarantees',
          body: [
            'WIZUP does not guarantee that any idea, product, launch, sales page, store, or workflow will produce revenue, profit, customers, traffic, or business success.',
            'Any market signals, examples, or generated suggestions are informational and should not be treated as financial, legal, or business advice.',
          ],
        },
        {
          title: 'Billing and payments',
          body: [
            'Paid features may require an active subscription or completed payment. Billing status can depend on provider confirmation, webhook processing, and reconciliation.',
            'Prices, plan availability, and payment methods may change over time. We will not intentionally mutate production pricing without updating the product experience.',
          ],
        },
        {
          title: 'Crypto payments',
          body: [
            'Crypto payments may involve network fees, settlement delays, exchange-rate movement, public blockchain records, wallet mistakes, and irreversible transactions.',
            'You are responsible for confirming the network, token, wallet, amount, and transaction details before sending a crypto payment.',
          ],
        },
        {
          title: 'Termination',
          body: [
            'We may suspend or terminate access if you violate these terms, misuse the service, create risk for WIZUP or other users, or if continued access would be unlawful or harmful.',
            'You may stop using WIZUP at any time.',
          ],
        },
        {
          title: 'Limitation of liability',
          body: [
            'WIZUP is provided as-is and as available. To the maximum extent allowed by law, WIZUP is not liable for lost profits, lost revenue, lost data, business interruption, or indirect, incidental, special, consequential, or punitive damages.',
            'If liability cannot be excluded, it is limited to the amount you paid to WIZUP for the service giving rise to the claim during the three months before the claim.',
          ],
        },
        {
          title: 'Contact',
          body: [
            'Questions about these terms can be sent to wizuplive@gmail.com.',
          ],
        },
      ]}
    />
  );
}
