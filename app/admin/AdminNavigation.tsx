"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const halaman = [
  {
    href: "/admin",
    label: "Ringkasan",
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </>
    ),
  },
  {
    href: "/admin/masukan",
    label: "Saran & masalah",
    icon: (
      <>
        <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
      </>
    ),
  },
  {
    href: "/admin/pengguna",
    label: "Manajemen pengguna",
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
];

export default function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi admin"
      className="flex gap-2 overflow-x-auto p-1 md:flex-col md:gap-1 md:overflow-visible md:p-2"
    >
      {halaman.map(({ href, label, icon }) => {
        const aktif =
          href === "/admin" ? pathname === href : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={aktif ? "page" : undefined}
            className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              aktif
                ? "bg-violet-100 text-violet-900 md:bg-violet-700 md:text-white"
                : "text-stone-600 hover:bg-violet-50 hover:text-violet-800"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="h-5 w-5 shrink-0"
            >
              {icon}
            </svg>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
