import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="max-w-3xl mx-auto px-6 py-16">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>

      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: March 15, 2026</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-foreground/90">
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">1. Acceptance</h2>
          <p className="leading-relaxed">By using ICHEN Manuscript, you agree to these terms. If you do not agree, please do not use the service.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">2. Your Content</h2>
          <p className="leading-relaxed">You retain full ownership of everything you write. ICHEN Manuscript does not claim any rights over your manuscripts, chapters, or creative work. Your content is yours — always.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">3. Account Responsibility</h2>
          <p className="leading-relaxed">You are responsible for maintaining the security of your account credentials. Notify us immediately if you believe your account has been compromised.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">4. Acceptable Use</h2>
          <p className="leading-relaxed">Do not use the service to generate, store, or distribute content that is illegal, harmful, or violates the rights of others. Do not attempt to abuse, overload, or reverse-engineer the service.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">5. AI Features</h2>
          <p className="leading-relaxed">AI-powered features are provided as writing assistance tools. AI suggestions are not guaranteed to be accurate. You are responsible for reviewing and approving all changes to your work. Daily usage limits apply.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">6. Service Availability</h2>
          <p className="leading-relaxed">ICHEN Manuscript is currently in beta. We strive for reliability but cannot guarantee uninterrupted service. We may update, modify, or discontinue features as the product evolves.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">7. Limitation of Liability</h2>
          <p className="leading-relaxed">ICHEN Manuscript is provided "as is" without warranties of any kind. We are not liable for any data loss, though we take reasonable measures to protect your content. We recommend maintaining your own backups.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">8. Changes to Terms</h2>
          <p className="leading-relaxed">We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms.</p>
        </section>
      </div>
    </div>
  </div>
);

export default Terms;
