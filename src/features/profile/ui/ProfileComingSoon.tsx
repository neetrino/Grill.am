import { ProfilePageTitle } from "@/features/profile/ui/ProfilePageTitle";

type ProfileComingSoonProps = {
  title: string;
  message: string;
};

export function ProfileComingSoon({ title, message }: ProfileComingSoonProps) {
  return (
    <section className="rounded-[15px] border border-gray-200/80 bg-white p-6 sm:p-8">
      <ProfilePageTitle className="mb-3">{title}</ProfilePageTitle>
      <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
        {message}
      </p>
    </section>
  );
}
