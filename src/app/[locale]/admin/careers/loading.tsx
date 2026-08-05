import { AdminPageSkeleton } from "@/components/loading/storefront-skeletons";

/**
 * Renders inside the careers layout, so the tabs stay visible while only the
 * page content (postings grid / applications table) loads.
 */
export default function AdminCareersLoading() {
  return <AdminPageSkeleton />;
}
