"use client";

import type { DesignElement } from "@/lib/types";
import type { LayerOp } from "../core/elementOps";
import type { Mode } from "../core/utils";
import type { ImageAsset, UploadedImage } from "./ImageUpload";
import PropertiesPanel from "./PropertiesPanel";
import ImageLibraryPanel from "./ImageLibraryPanel";
import LayersPanel from "../panels/LayersPanel";
import Icon from "../ui/Icon";

export type SidebarTab = "properties" | "catalog" | "layers";

type Props = {
  tab: SidebarTab;
  onTab: (tab: SidebarTab) => void;
  selected: DesignElement | null;
  mode: Mode;
  textBoxOptions: { id: string; label: string }[];
  onChange: (id: string, patch: Partial<DesignElement>) => void;
  onLinkText: (id: string, nextId: string | undefined) => void;
  onLayer: (op: LayerOp) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onFillImage: (img: UploadedImage) => void;
  onError: (message: string) => void;
  elements: DesignElement[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  refreshKey: number;
  onSelectImage: (image: UploadedImage) => void;
  onDeleteImage: (image: ImageAsset) => void;
};

const tabs: { id: SidebarTab; label: string; icon: "fill" | "image" | "layers" }[] = [
  { id: "properties", label: "Properti", icon: "fill" },
  { id: "catalog", label: "Katalog", icon: "image" },
  { id: "layers", label: "Objek", icon: "layers" },
];

export default function EditorSidebar({
  tab,
  onTab,
  selected,
  mode,
  textBoxOptions,
  onChange,
  onLinkText,
  onLayer,
  onDuplicate,
  onDelete,
  onFillImage,
  onError,
  elements,
  selectedId,
  onSelect,
  refreshKey,
  onSelectImage,
  onDeleteImage,
}: Props) {
  return (
    <aside className="flex w-56 min-w-0 shrink-0 flex-col border-l border-stone-300 bg-stone-100 sm:w-64">
      <div role="tablist" aria-label="Panel editor" className="flex shrink-0 border-b border-stone-300">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => onTab(item.id)}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1 px-1 py-2 text-[11px] font-semibold ${
              tab === item.id
                ? "border-b-2 border-indigo-600 text-indigo-700"
                : "text-stone-600 hover:bg-stone-200"
            }`}
          >
            <Icon name={item.icon} size={13} />
            {item.label}
          </button>
        ))}
      </div>

      {tab === "properties" ? (
        <PropertiesPanel
          selected={selected}
          mode={mode}
          textBoxOptions={textBoxOptions}
          onChange={onChange}
          onLinkText={onLinkText}
          onLayer={onLayer}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onFillImage={onFillImage}
          onError={onError}
        />
      ) : tab === "catalog" ? (
        <ImageLibraryPanel
          refreshKey={refreshKey}
          onSelect={onSelectImage}
          onDelete={onDeleteImage}
          onError={onError}
        />
      ) : (
        <LayersPanel
          elements={elements}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      )}
    </aside>
  );
}
