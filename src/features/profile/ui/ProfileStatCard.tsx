type ProfileStatCardProps = {
  label: string;
  value: string;
};

export function ProfileStatCard({ label, value }: ProfileStatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6">
      <p className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase sm:text-xs">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:mt-3 sm:text-3xl">
        {value}
      </p>
    </div>
  );
}
