"use client";

import { useState, useTransition } from "react";
import {
  Plus, Trash2, Pencil, Check, X, ChevronUp, ChevronDown,
  CornerDownRight, Navigation, PanelTop, PanelBottom, Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  createMenuAction, deleteMenuAction, addMenuItemAction,
  updateMenuItemAction, deleteMenuItemAction, moveMenuItemAction,
} from "@/server/actions/menus";

export interface MenuItemNode {
  id: string;
  label: string;
  href: string;
  order: number;
  children: { id: string; label: string; href: string; order: number }[];
}

export interface MenuData {
  id: string;
  name: string;
  location: string;
  items: MenuItemNode[];
}

interface Props {
  tenantId: string;
  menus: MenuData[];
}

const LOCATION_META: Record<string, { label: string; icon: typeof PanelTop; hint: string }> = {
  header: { label: "Header", icon: PanelTop, hint: "Menu chính trên đầu trang — đồng bộ với theme" },
  footer: { label: "Footer", icon: PanelBottom, hint: "Liên kết ở chân trang" },
  mobile: { label: "Mobile", icon: Smartphone, hint: "Menu riêng cho di động (mặc định dùng Header)" },
};

function ItemRow({
  tenantId, item, isChild, canMoveUp, canMoveDown, onAddChild,
}: {
  tenantId: string;
  item: { id: string; label: string; href: string };
  isChild?: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onAddChild?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(item.label);
  const [href, setHref] = useState(item.href);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      await updateMenuItemAction(tenantId, item.id, { label, href });
      setEditing(false);
    });

  const remove = () =>
    startTransition(async () => {
      if (confirm(`Xóa mục "${item.label}"${isChild ? "" : " và toàn bộ mục con"}?`)) {
        await deleteMenuItemAction(tenantId, item.id);
      }
    });

  const move = (dir: "up" | "down") =>
    startTransition(async () => {
      await moveMenuItemAction(tenantId, item.id, dir);
    });

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 ${
        isChild ? "ml-8" : ""
      } ${pending ? "opacity-50" : ""}`}
    >
      {isChild && <CornerDownRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />}

      {editing ? (
        <>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} className="h-8 text-sm flex-1" placeholder="Nhãn" />
          <Input value={href} onChange={(e) => setHref(e.target.value)} className="h-8 text-sm flex-1" placeholder="/duong-dan" />
          <Button size="icon" variant="ghost" onClick={save} disabled={pending} aria-label="Lưu">
            <Check className="h-4 w-4 text-emerald-600" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setEditing(false)} aria-label="Hủy">
            <X className="h-4 w-4 text-slate-400" />
          </Button>
        </>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{item.label}</p>
            <p className="text-xs text-slate-400 truncate">{item.href}</p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button size="icon" variant="ghost" onClick={() => move("up")} disabled={!canMoveUp || pending} aria-label="Lên">
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => move("down")} disabled={!canMoveDown || pending} aria-label="Xuống">
              <ChevronDown className="h-4 w-4" />
            </Button>
            {!isChild && onAddChild && (
              <Button size="icon" variant="ghost" onClick={onAddChild} title="Thêm mục con" aria-label="Thêm mục con">
                <CornerDownRight className="h-4 w-4 text-blue-600" />
              </Button>
            )}
            <Button size="icon" variant="ghost" onClick={() => setEditing(true)} aria-label="Sửa">
              <Pencil className="h-4 w-4 text-slate-500" />
            </Button>
            <Button size="icon" variant="ghost" onClick={remove} aria-label="Xóa">
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function AddItemForm({
  tenantId, menuId, parentId, onDone, placeholder,
}: {
  tenantId: string;
  menuId: string;
  parentId?: string | null;
  onDone?: () => void;
  placeholder?: string;
}) {
  const [label, setLabel] = useState("");
  const [href, setHref] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const res = await addMenuItemAction(tenantId, menuId, { label, href, parentId });
      if (res.error) {
        setError(res.error);
      } else {
        setLabel("");
        setHref("");
        onDone?.();
      }
    });

  return (
    <div className={parentId ? "ml-8" : ""}>
      <div className="flex items-center gap-2">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={placeholder ?? "Nhãn (vd: Bảng giá)"}
          className="h-9 text-sm flex-1"
        />
        <Input
          value={href}
          onChange={(e) => setHref(e.target.value)}
          placeholder="/bang-gia"
          className="h-9 text-sm flex-1"
          onKeyDown={(e) => e.key === "Enter" && label && href && submit()}
        />
        <Button size="sm" onClick={submit} disabled={pending || !label || !href}>
          <Plus className="h-4 w-4" />
          Thêm
        </Button>
        {onDone && (
          <Button size="icon" variant="ghost" onClick={onDone} aria-label="Đóng">
            <X className="h-4 w-4 text-slate-400" />
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function MenuCard({ tenantId, menu }: { tenantId: string; menu: MenuData }) {
  const [addingChildOf, setAddingChildOf] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const meta = LOCATION_META[menu.location] ?? LOCATION_META.header;
  const Icon = meta.icon;

  const removeMenu = () =>
    startTransition(async () => {
      if (confirm(`Xóa menu "${menu.name}" và toàn bộ các mục?`)) {
        await deleteMenuAction(tenantId, menu.id);
      }
    });

  return (
    <Card className={`p-5 ${pending ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <Icon className="h-4.5 w-4.5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-800">{menu.name}</h3>
              <Badge variant="info" className="text-[10px] uppercase">{meta.label}</Badge>
            </div>
            <p className="text-xs text-slate-400">{meta.hint}</p>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={removeMenu}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>

      <div className="space-y-2">
        {menu.items.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-3">Chưa có mục nào — thêm bên dưới.</p>
        )}
        {menu.items.map((item, i) => (
          <div key={item.id} className="space-y-2">
            <ItemRow
              tenantId={tenantId}
              item={item}
              canMoveUp={i > 0}
              canMoveDown={i < menu.items.length - 1}
              onAddChild={() => setAddingChildOf(addingChildOf === item.id ? null : item.id)}
            />
            {item.children.map((child, j) => (
              <ItemRow
                key={child.id}
                tenantId={tenantId}
                item={child}
                isChild
                canMoveUp={j > 0}
                canMoveDown={j < item.children.length - 1}
              />
            ))}
            {addingChildOf === item.id && (
              <AddItemForm
                tenantId={tenantId}
                menuId={menu.id}
                parentId={item.id}
                placeholder={`Mục con của "${item.label}"`}
                onDone={() => setAddingChildOf(null)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <AddItemForm tenantId={tenantId} menuId={menu.id} />
      </div>
    </Card>
  );
}

export function MenusClient({ tenantId, menus }: Props) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState<string>("header");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const usedLocations = new Set(menus.map((m) => m.location));
  const availableLocations = Object.keys(LOCATION_META).filter((l) => !usedLocations.has(l));

  const create = () =>
    startTransition(async () => {
      setError(null);
      const res = await createMenuAction(tenantId, { name, location });
      if (res.error) setError(res.error);
      else setName("");
    });

  return (
    <div className="space-y-5">
      {availableLocations.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Navigation className="h-4 w-4 text-blue-600" />
            Tạo menu mới
          </h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên menu (vd: Menu chính)"
              className="h-9 text-sm flex-1"
            />
            <select
              value={availableLocations.includes(location) ? location : availableLocations[0]}
              onChange={(e) => setLocation(e.target.value)}
              className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
            >
              {availableLocations.map((l) => (
                <option key={l} value={l}>
                  Vị trí: {LOCATION_META[l].label}
                </option>
              ))}
            </select>
            <Button onClick={create} disabled={pending || !name}>
              <Plus className="h-4 w-4" />
              Tạo menu
            </Button>
          </div>
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        </Card>
      )}

      {menus.length === 0 ? (
        <Card className="p-12 text-center">
          <Navigation className="h-12 w-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-sm font-semibold text-slate-600 mb-1">Chưa có menu nào</h3>
          <p className="text-xs text-slate-400">
            Tạo menu Header để thay thế navigation mặc định của theme.
          </p>
        </Card>
      ) : (
        menus.map((menu) => <MenuCard key={menu.id} tenantId={tenantId} menu={menu} />)
      )}
    </div>
  );
}
