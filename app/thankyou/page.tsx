import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import ThankYouActions from "./ThankYouActions";

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}) {
  const query = await searchParams;
  const slug = typeof query.slug === "string" ? query.slug : "";
  const eventName =
    (typeof query.event === "string" ? query.event : undefined) ??
    (slug
      ? slug
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ")
      : "this event");

  const galleryHref = slug ? `/events/${slug}` : "/";
  const uploadHref = slug ? `/events/${slug}/upload` : "/";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          Thank you
        </p>
        <h1 className="mt-3 text-4xl font-bold text-slate-900">
          Thank you for sharing!
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Your photos are part of {eventName}. You can add more memories or log
          out whenever you&apos;re ready.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={uploadHref}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-base font-semibold text-white transition hover:bg-blue-700"
          >
            Upload more photos
            <ArrowRight className="h-4 w-4" />
          </Link>

          <ThankYouActions />
        </div>

        {slug && (
          <Link
            href={galleryHref}
            className="mt-6 inline-block text-sm font-medium text-blue-600 transition hover:text-blue-700"
          >
            View event gallery
          </Link>
        )}
      </div>
    </div>
  );
}
