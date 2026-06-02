import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0F0A] px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.22),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(21,128,61,0.28),transparent_36%)]" />
      <div className="relative z-10 w-full max-w-3xl rounded-[32px] border border-white/15 bg-white/10 p-10 text-center text-white shadow-2xl backdrop-blur-2xl md:p-16">
        <span className="inline-flex rounded-full bg-white/10 px-5 py-2 text-sm font-semibold tracking-wide text-white/85">
          Page Not Found
        </span>
        <h1 className="mt-6 text-[72px] font-extrabold tracking-tight md:text-[96px]">404</h1>
        <p className="mx-auto mt-3 max-w-xl text-white/75">
          The store page you requested is unavailable. Browse the live catalog from the main store
          homepage instead.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-[linear-gradient(94.62deg,#2CB22C_-8.83%,#058A05_110.95%)] px-8 py-3 font-semibold text-white transition hover:opacity-90"
        >
          Go To Store Home
        </Link>
      </div>
    </div>
  );
}
