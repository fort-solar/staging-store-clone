import { cn } from "@/lib/utils";

type EmptyStatePanelProps = {
  title: string;
  description: string;
  className?: string;
};

export default function EmptyStatePanel({
  title,
  description,
  className,
}: EmptyStatePanelProps) {
  return (
    <div
      className={cn(
        "col-span-full flex w-full flex-col items-center justify-center rounded-[28px] border border-dashed border-[#D0D5DD] bg-[linear-gradient(180deg,#FCFDFD_0%,#F4F7F5_100%)] px-6 py-16 text-center",
        className,
      )}
    >
      <h2 className="text-xl font-semibold text-[#111827]">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[#667085]">{description}</p>
    </div>
  );
}
