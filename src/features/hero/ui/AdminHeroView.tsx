"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  ADMIN_PAGE_SUBTITLE,
  ADMIN_SECTION_TITLE,
} from "@/features/admin/ui/admin-form-classes";
import { AdminPageTitle } from "@/features/admin/ui/AdminPageTitle";
import {
  formatAdminMessage,
  useAdminDictionary,
} from "@/features/admin/ui/AdminDictionaryProvider";
import {
  ADMIN_CONTENT_CARD_CLASS,
  ADMIN_CONTENT_CARD_GRID,
  ADMIN_CONTENT_CARD_STATUS_CLASS,
} from "@/features/admin/ui/admin-ui";
import { ADMIN_BADGE } from "@/features/admin/ui/status-badge";
import type { AdminHeroSlideListItem } from "@/features/hero/application/queries";
import { HeroSlideControls } from "@/features/hero/ui/HeroSlideControls";
import { HeroSlideModal } from "@/features/hero/ui/HeroSlideModal";

type AdminHeroViewProps = {
  locale: string;
  slides: AdminHeroSlideListItem[];
  initialEditId?: string;
};

export function AdminHeroView({
  locale,
  slides,
  initialEditId,
}: AdminHeroViewProps) {
  const copy = useAdminDictionary().hero;
  const initialSlide =
    initialEditId != null
      ? (slides.find((slide) => slide.id === initialEditId) ?? null)
      : null;
  const [modalOpen, setModalOpen] = useState(initialSlide != null);
  const [editingSlide, setEditingSlide] =
    useState<AdminHeroSlideListItem | null>(initialSlide);

  function openCreate(): void {
    setEditingSlide(null);
    setModalOpen(true);
  }

  function openEdit(slide: AdminHeroSlideListItem): void {
    setEditingSlide(slide);
    setModalOpen(true);
  }

  function closeModal(): void {
    setModalOpen(false);
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <AdminPageTitle>{copy.title}</AdminPageTitle>
          <p className={`mt-1 ${ADMIN_PAGE_SUBTITLE}`}>
            {formatAdminMessage(copy.count, {
              count: String(slides.length),
            })}
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          {copy.create}
        </Button>
      </div>

      <div className="mb-4">
        <h2 className={ADMIN_SECTION_TITLE}>
          {formatAdminMessage(copy.slidesHeading, {
            count: String(slides.length),
          })}
        </h2>
      </div>

      {slides.length === 0 ? (
        <Card className="rounded-[15px] p-6">
          <p className="text-center text-sm text-gray-600">{copy.empty}</p>
        </Card>
      ) : (
        <div className={ADMIN_CONTENT_CARD_GRID}>
          {slides.map((slide) => (
            <Card key={slide.id} className={ADMIN_CONTENT_CARD_CLASS}>
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100">
                {slide.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                  <img
                    src={slide.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center border-b border-dashed border-gray-200 text-xs text-gray-400">
                    {copy.noImage}
                  </div>
                )}
                <span
                  className={`${ADMIN_BADGE} ${ADMIN_CONTENT_CARD_STATUS_CLASS} ${
                    slide.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {slide.isActive ? copy.published : copy.draft}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(slide)}
                    className="min-w-0 flex-1 line-clamp-2 text-left font-medium text-gray-900 hover:underline"
                  >
                    {slide.title}
                  </button>
                  <HeroSlideControls
                    locale={locale}
                    slideId={slide.id}
                    slideTitle={slide.title}
                    isActive={slide.isActive}
                    onEdit={() => openEdit(slide)}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {formatAdminMessage(copy.sort, {
                    order: String(slide.sortOrder),
                  })}
                </span>
                {slide.subtitle ? (
                  <p className="line-clamp-2 text-sm text-gray-600">
                    {slide.subtitle}
                  </p>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      <HeroSlideModal
        locale={locale}
        open={modalOpen}
        onClose={closeModal}
        slide={editingSlide}
      />
    </section>
  );
}
