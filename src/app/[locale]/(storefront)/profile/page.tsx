import { notFound } from "next/navigation";

import { logoutAction } from "@/features/auth/logout-action";
import {
  CHECKOUT_DELIVERY_CITY_I18N_KEYS,
  CHECKOUT_DELIVERY_CITY_VALUES,
} from "@/features/checkout/domain/checkout-delivery-cities";
import { listCustomerOrders } from "@/features/orders/application/queries";
import { CustomerOrdersView } from "@/features/orders/ui/CustomerOrdersView";
import { listCustomerAddresses } from "@/features/profile/application/address-queries";
import { getProfileDashboard } from "@/features/profile/application/dashboard-queries";
import { ChangePasswordForm } from "@/features/profile/ui/ChangePasswordForm";
import { DeleteAccountForm } from "@/features/profile/ui/DeleteAccountForm";
import { PersonalInformationForm } from "@/features/profile/ui/PersonalInformationForm";
import { ProfileAddressesView } from "@/features/profile/ui/ProfileAddressesView";
import { ProfileDashboardView } from "@/features/profile/ui/ProfileDashboardView";
import { ProfileMobileMenu } from "@/features/profile/ui/ProfileMobileMenu";
import { PROFILE_SECTION_TITLE_CLASS } from "@/features/profile/ui/profile-ui";
import { listCustomerAssignedCoupons } from "@/features/promotions/application/list-customer-assigned-coupons";
import { listCustomerCouponHistory } from "@/features/promotions/application/list-customer-coupon-history";
import { CustomerPromoCodesPageContent } from "@/features/promotions/ui/CustomerPromoCodesPageContent";
import { requireUser } from "@/lib/auth/policies";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type ProfilePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const user = await requireUser(locale);
  const dictionary = getDictionary(locale);
  const [
    { stats, recentOrders },
    addressRows,
    promoHistory,
    assignedCoupons,
    customerOrders,
  ] =
    await Promise.all([
      getProfileDashboard(user.id),
      listCustomerAddresses(user.id),
      listCustomerCouponHistory(user.id, 1),
      listCustomerAssignedCoupons(user.id),
      listCustomerOrders(user.id, {
        page: 1,
        archived: "active",
        status: undefined,
        paymentStatus: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        q: undefined,
      }),
    ]);

  const logoutWithLocale = logoutAction.bind(null, locale);
  const dashboardProps = {
    locale,
    stats,
    recentOrders,
    dictionary: dictionary.profile,
    adminDictionary: dictionary.admin,
  } as const;

  const addressCopy = dictionary.profile.addressBook;
  const passwordCopy = dictionary.profile.passwordForm;
  const deleteCopy = dictionary.profile.deleteAccountForm;
  const promoCopy = dictionary.profile.promoCodes;
  const profileCopy = dictionary.profile;
  const cityOptions = CHECKOUT_DELIVERY_CITY_VALUES.map((city) => ({
    value: city,
    label: dictionary.checkout.deliveryCities[CHECKOUT_DELIVERY_CITY_I18N_KEYS[city]],
  }));
  const ordersProfileCopy = {
    reorder: profileCopy.reorder,
    reordering: profileCopy.reordering,
    reorderUnavailable: profileCopy.reorderUnavailable,
    orderNumber: profileCopy.orderNumber,
    item: profileCopy.item,
    items: profileCopy.items,
    placedOn: profileCopy.placedOn,
    viewDetails: profileCopy.viewDetails,
    noOrders: profileCopy.noOrders,
    startShopping: profileCopy.startShopping,
  } as const;

  return (
    <>
      <ProfileMobileMenu
        locale={locale}
        user={user}
        dictionary={dictionary.profile}
        closeLabel={dictionary.profile.cancel}
        logoutAction={logoutWithLocale}
        sheets={{
          dashboard: <ProfileDashboardView {...dashboardProps} />,
          orders: (
            <div className="space-y-6">
              <h1 className={`${PROFILE_SECTION_TITLE_CLASS} text-2xl`}>
                {profileCopy.orders}
              </h1>
              <CustomerOrdersView
                locale={locale}
                orders={customerOrders.rows}
                dictionary={dictionary.admin}
                profileCopy={ordersProfileCopy}
                layout="cards"
              />
            </div>
          ),
          promoCodes: (
            <CustomerPromoCodesPageContent
              locale={locale}
              assigned={assignedCoupons}
              rows={promoHistory.rows}
              copy={promoCopy}
            />
          ),
          personal: (
            <PersonalInformationForm
              locale={locale}
              firstName={user.firstName}
              lastName={user.lastName}
              email={user.email}
              phone={user.phone ?? ""}
              labels={{
                title: dictionary.profile.personal,
                firstName: dictionary.auth.firstName,
                lastName: dictionary.auth.lastName,
                email: dictionary.auth.email,
                phone: dictionary.auth.phone,
                cancel: dictionary.profile.cancel,
                save: dictionary.profile.save,
                saving: dictionary.profile.saving,
                firstNamePlaceholder: dictionary.auth.firstName,
                lastNamePlaceholder: dictionary.auth.lastName,
                emailPlaceholder: dictionary.auth.email,
                phonePlaceholder: addressCopy.phonePlaceholder,
              }}
            />
          ),
          addresses: (
            <ProfileAddressesView
              locale={locale}
              addresses={addressRows}
              cityOptions={cityOptions}
              labels={{
                title: dictionary.profile.addresses,
                addNew: addressCopy.addNew,
                defaultBadge: addressCopy.defaultBadge,
                setDefault: addressCopy.setDefault,
                setDefaultConfirm: addressCopy.setDefaultConfirm,
                edit: addressCopy.edit,
                delete: addressCopy.delete,
                deleteConfirm: addressCopy.deleteConfirm,
                noAddresses: addressCopy.noAddresses,
                formAddTitle: addressCopy.formAddTitle,
                formEditTitle: addressCopy.formEditTitle,
                line1: addressCopy.line1,
                city: addressCopy.city,
                selectCity: dictionary.checkout.form.selectLocation,
                isDefault: addressCopy.isDefault,
                cancel: dictionary.profile.cancel,
                add: addressCopy.add,
                update: addressCopy.update,
                saving: dictionary.profile.saving,
              }}
            />
          ),
          password: (
            <ChangePasswordForm
              locale={locale}
              labels={{
                title: dictionary.profile.password,
                currentPassword: passwordCopy.currentPassword,
                newPassword: passwordCopy.newPassword,
                confirmPassword: passwordCopy.confirmPassword,
                currentPasswordPlaceholder:
                  passwordCopy.currentPasswordPlaceholder,
                newPasswordPlaceholder: passwordCopy.newPasswordPlaceholder,
                confirmPasswordPlaceholder:
                  passwordCopy.confirmPasswordPlaceholder,
                change: passwordCopy.change,
                changing: passwordCopy.changing,
              }}
            />
          ),
          deleteAccount: (
            <DeleteAccountForm
              locale={locale}
              labels={{
                title: dictionary.profile.deleteAccount,
                description: deleteCopy.description,
                pointOrders: deleteCopy.pointOrders,
                pointLogin: deleteCopy.pointLogin,
                pointData: deleteCopy.pointData,
                currentPassword: deleteCopy.currentPassword,
                currentPasswordPlaceholder:
                  deleteCopy.currentPasswordPlaceholder,
                acknowledge: deleteCopy.acknowledge,
                submit: deleteCopy.submit,
                deleting: deleteCopy.deleting,
                cancel: dictionary.profile.cancel,
                confirmTitle: dictionary.dialogs.confirmDeleteTitle,
              }}
            />
          ),
        }}
      />
      <div className="hidden lg:block">
        <ProfileDashboardView {...dashboardProps} />
      </div>
    </>
  );
}
