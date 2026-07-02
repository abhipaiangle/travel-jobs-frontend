import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight } from "lucide-react";

/**
 * Red bar shown when a job (or the whole dashboard) is on hold. A job goes
 * live only when BOTH an active subscription and approved KYC are in place.
 * Message + CTA adapt to whichever piece is missing.
 */
export default function PostActivationBanner({ hasActiveSub, kycStatus, scope = "dashboard" }) {
  const kycApproved = kycStatus === "approved";
  if (hasActiveSub && kycApproved) return null;

  let copy;
  let ctaText;
  let ctaTo;

  if (!hasActiveSub && !kycApproved) {
    copy =
      scope === "job"
        ? "This post is on hold. Purchase a subscription and complete KYC to make it live and start receiving candidates."
        : "Your job posts are on hold. Purchase a subscription and complete KYC to make them live.";
    ctaText = "View plans";
    ctaTo = "/employer/plans";
  } else if (!hasActiveSub) {
    copy =
      scope === "job"
        ? "Purchase a subscription to make this post live and get candidates."
        : "Purchase a subscription to make your job posts live and get candidates.";
    ctaText = "View plans";
    ctaTo = "/employer/plans";
  } else {
    copy =
      kycStatus === "submitted"
        ? scope === "job"
          ? "KYC is under review. This post will go live automatically once approved."
          : "KYC is under review. Your job posts will go live automatically once approved."
        : kycStatus === "rejected"
          ? "KYC was rejected. Update your details so this post can go live."
          : scope === "job"
            ? "Complete KYC to make this post live and get candidates."
            : "Complete KYC to make your job posts live and get candidates.";
    ctaText = kycStatus === "submitted" ? "View KYC" : kycStatus === "rejected" ? "Update KYC" : "Complete KYC";
    ctaTo = "/employer/profile?tab=kyc";
  }

  return (
    <div className="bg-rose-600 text-white border-b border-rose-700">
      <div className="tj-container py-2.5 flex items-center justify-between gap-3 text-sm flex-wrap">
        <div className="flex items-start gap-2 min-w-0">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="leading-snug">{copy}</span>
        </div>
        <Link
          to={ctaTo}
          className="inline-flex items-center gap-1 bg-white text-rose-700 hover:bg-rose-50 rounded-md px-3 py-1.5 text-xs font-medium shrink-0"
        >
          {ctaText} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
