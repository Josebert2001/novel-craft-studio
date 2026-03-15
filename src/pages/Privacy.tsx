import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="max-w-3xl mx-auto px-6 py-16">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="h-4 w-4" /> Back to home
      </Link>

      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-10">Last updated: March 15, 2026</p>

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-foreground/90">
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">1. Information We Collect</h2>
          <p className="leading-relaxed">When you create an account, we collect your email address and display name. Your manuscripts, chapters, and writing data are stored securely in our database and are only accessible to you.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">2. How We Use Your Information</h2>
          <p className="leading-relaxed">Your data is used solely to provide the ICHEN Manuscript service — saving your work, syncing across devices, and powering AI-assisted writing features. We do not sell, share, or monetize your personal data or writing content.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">3. AI Processing</h2>
          <p className="leading-relaxed">When you use AI features (Craft Coach, Emotion Heatmap, Writing Agent, etc.), selected text is sent to Google's Gemini API for analysis. This text is not stored by Google beyond the duration of the request. We do not use your writing to train AI models.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">4. Grammar Checking</h2>
          <p className="leading-relaxed">Grammar analysis is powered by the LanguageTool API. Text is sent for real-time checking and is not stored by the service.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">5. Data Security</h2>
          <p className="leading-relaxed">All data is transmitted over HTTPS. Your manuscripts are protected by row-level security policies, ensuring only you can access your content. Authentication is handled by Supabase Auth with industry-standard encryption.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">6. Data Deletion</h2>
          <p className="leading-relaxed">You can delete your books and chapters at any time from within the editor. To delete your account entirely, contact us and we will remove all associated data.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-foreground mb-2">7. Contact</h2>
          <p className="leading-relaxed">For questions about this policy, reach out to us through the app or via email.</p>
        </section>
      </div>
    </div>
  </div>
);

export default Privacy;
