export default function Privacy() {
  return (
    <div className="tj-container py-12 max-w-3xl prose">
      <h1 className="font-display text-3xl font-semibold">Privacy Policy</h1>
      <p className="text-slate-600 mt-2">Last updated: 2026-06-27</p>

      <h2 className="font-display text-xl font-semibold mt-8">What we collect</h2>
      <p className="text-slate-700 mt-2">
        For candidates: name, email, phone, city, experience details, skills, languages, resume, and a voice
        introduction recording. For employers: company name, recruiter name, phone, city, website, and payment
        details processed by Razorpay.
      </p>

      <h2 className="font-display text-xl font-semibold mt-6">How we use it</h2>
      <p className="text-slate-700 mt-2">
        Candidate profiles are shown to employers only when candidates apply to their roles. Resumes and voice
        introductions can only be accessed by employers who own the relevant role.
      </p>

      <h2 className="font-display text-xl font-semibold mt-6">Where it's stored</h2>
      <p className="text-slate-700 mt-2">
        User records are stored in MongoDB Atlas (ap-south-1 region). Resumes and voice recordings are stored in
        AWS S3 in the same region. Payment processing is handled by Razorpay; we do not store card details.
      </p>

      <h2 className="font-display text-xl font-semibold mt-6">Your rights</h2>
      <p className="text-slate-700 mt-2">
        You can update or delete your profile at any time from your account. To request a full data export or
        deletion, email hello@hellotravel.com.
      </p>
    </div>
  );
}
