export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#EAF5EE_0%,#F7F9FB_58%)] dark:bg-[radial-gradient(circle_at_top,#0e1a12_0%,#0a0f1d_58%)] dark:bg-[#0a0f1d] px-6 transition-colors">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center shadow-xl transition-colors">
        <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-[#048A05] dark:border-t-emerald-400" />
        <h4 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">Preparing your view...</h4>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Loading your content, please wait</p>
      </div>
    </div>
  );
}
