import { notFound } from "next/navigation";

import {
  CHECKOUT_DELIVERY_CITY_I18N_KEYS,
  CHECKOUT_DELIVERY_CITY_VALUES,
} from "@/features/checkout/domain/checkout-delivery-cities";
import { listCustomerAddresses } from "@/features/profile/application/address-queries";
import { ProfileAddressesView } from "@/features/profile/ui/ProfileAddressesView";
import { requireUser } from "@/lib/auth/policies";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type AddressesPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AddressesPage({ params }: AddressesPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const user = await requireUser(locale);
  const dictionary = getDictionary(locale);
  const addressRows = await listCustomerAddresses(user.id);
  const copy = dictionary.profile.addressBook;
  const cityOptions = CHECKOUT_DELIVERY_CITY_VALUES.map((city) => ({
    value: city,
    label: dictionary.checkout.deliveryCities[CHECKOUT_DELIVERY_CITY_I18N_KEYS[city]],
  }));

  return (
    <ProfileAddressesView
      locale={locale}
      addresses={addressRows}
      cityOptions={cityOptions}
      labels={{
        title: dictionary.profile.addresses,
        addNew: copy.addNew,
        defaultBadge: copy.defaultBadge,
        setDefault: copy.setDefault,
        setDefaultConfirm: copy.setDefaultConfirm,
        edit: copy.edit,
        delete: copy.delete,
        deleteConfirm: copy.deleteConfirm,
        noAddresses: copy.noAddresses,
        formAddTitle: copy.formAddTitle,
        formEditTitle: copy.formEditTitle,
        line1: copy.line1,
        city: copy.city,
        selectCity: dictionary.checkout.form.selectLocation,
        isDefault: copy.isDefault,
        cancel: dictionary.profile.cancel,
        add: copy.add,
        update: copy.update,
        saving: dictionary.profile.saving,
      }}
    />
  );
}
