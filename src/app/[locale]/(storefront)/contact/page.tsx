import { notFound } from "next/navigation";

import { ContactForm } from "@/features/contact/ui/ContactForm";
import { ContactInfo } from "@/features/contact/ui/ContactInfo";
import { ContactMap } from "@/features/contact/ui/ContactMap";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type ContactPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const dictionary = getDictionary(rawLocale);
  const copy = dictionary.contact;

  return (
    <div className="-my-10 bg-white">
      <section>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 pb-4 pt-10 sm:pb-6 sm:pt-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10 lg:pb-6 lg:pt-14">
          <ContactInfo copy={copy} />
          <ContactForm
            copy={{
              formTitle: copy.formTitle,
              name: copy.name,
              email: copy.email,
              phone: copy.phone,
              subject: copy.subject,
              message: copy.message,
              submit: copy.submit,
              privacyNote: copy.privacyNote,
              success: copy.success,
              error: copy.error,
            }}
          />
        </div>
      </section>

      <ContactMap title={copy.mapTitle} />
    </div>
  );
}
