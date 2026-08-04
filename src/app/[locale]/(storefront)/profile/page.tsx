import { notFound } from "next/navigation";

import { AppLink } from "@/components/ui/AppLink";
import { logoutAction } from "@/features/auth/logout-action";
import { listCustomerAddresses } from "@/features/profile/application/address-queries";
import { getProfileDashboard } from "@/features/profile/application/dashboard-queries";
import { ChangePasswordForm } from "@/features/profile/ui/ChangePasswordForm";
import { DeleteAccountForm } from "@/features/profile/ui/DeleteAccountForm";
import { PersonalInformationForm } from "@/features/profile/ui/PersonalInformationForm";
import { ProfileAddressesView } from "@/features/profile/ui/ProfileAddressesView";
import { ProfileDashboardView } from "@/features/profile/ui/ProfileDashboardView";
import { ProfileMobileMenu } from "@/features/profile/ui/ProfileMobileMenu";
import { listCustomerCouponHistory } from "@/features/promotions/application/list-customer-coupon-history";
import { CustomerPromoCodesView } from "@/features/promotions/ui/CustomerPromoCodesView";
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
  const [{ stats, recentOrders }, addressRows, promoHistory] =
    await Promise.all([
      getProfileDashboard(user.id),
      listCustomerAddresses(user.id),
      listCustomerCouponHistory(user.id, 1),
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

  return (
    <>
      <ProfileMobileMenu
        locale={locale}
        user={user}
        dictionary={dictionary.profile}
        closeLabel={dictionary.profile.cancel}
        logoutAction={logoutWithLocale}
        sheets={{
          dashboard: (
            <ProfileDashboardView {...dashboardProps} hideTitle />
          ),
          orders: (
            <div className="space-y-4">
              <ProfileDashboardView {...dashboardProps} hideTitle />
              <AppLink
                href={`/${locale}/profile/orders`}
                prefetchPolicy="intent"
                className="inline-flex h-11 w-full items-center justify-center rounded-[15px] bg-brand-red text-sm font-semibold text-white transition hover:bg-brand-red-hot"
              >
                {dictionary.profile.viewAllOrders}
              </AppLink>
            </div>
          ),
          promoCodes: (
            <CustomerPromoCodesView
              locale={locale}
              rows={promoHistory.rows}
              labels={{
                title: promoCopy.title,
                description: promoCopy.description,
                code: promoCopy.code,
                offer: promoCopy.offer,
                saved: promoCopy.saved,
                order: promoCopy.order,
                status: promoCopy.status,
                date: promoCopy.date,
                empty: promoCopy.empty,
                emptyHint: promoCopy.emptyHint,
                pageCount: promoCopy.pageCount,
              }}
            />
          ),
          personal: (
            <PersonalInformationForm
              locale={locale}
              firstName={user.firstName}
              lastName={user.lastName}
              email={user.email}
              labels={{
                title: dictionary.profile.personal,
                firstName: dictionary.auth.firstName,
                lastName: dictionary.auth.lastName,
                email: dictionary.auth.email,
                cancel: dictionary.profile.cancel,
                save: dictionary.profile.save,
                saving: dictionary.profile.saving,
                firstNamePlaceholder: dictionary.auth.firstName,
                lastNamePlaceholder: dictionary.auth.lastName,
                emailPlaceholder: dictionary.auth.email,
              }}
            />
          ),
          addresses: (
            <ProfileAddressesView
              locale={locale}
              addresses={addressRows}
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
                phone: addressCopy.phone,
                phonePlaceholder: addressCopy.phonePlaceholder,
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
