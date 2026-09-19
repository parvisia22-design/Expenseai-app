// Minimal dict — expanded incrementally. Keys are stable across languages.
export type Locale = "id" | "en";

export const DICT = {
  id: {
    nav_copilot: "Copilot",
    nav_scanner: "Scanner",
    nav_reports: "Laporan",
    nav_insights: "Insights",
    nav_you: "Anda",

    save: "Simpan",
    cancel: "Batal",
    delete: "Hapus",
    edit: "Edit",
    add: "Tambah",
    search: "Cari",

    profile_title: "Profil",
    profile_you: "Anda",
    profile_company: "Perusahaan",
    profile_approvers: "Persetujuan",
    profile_theme: "Tampilan",
    profile_language: "Bahasa",

    reports_title: "Formulir Reimbursement",
    reports_thisMonth: "Bulan Ini",
    reports_new: "Buat Formulir Baru",
    reports_empty: "Belum ada formulir.",

    status_draft: "Draft",
    status_submitted: "Menunggu Supervisor",
    status_supervisor: "Menunggu Finance",
    status_finance: "Disetujui / Finance",
    status_done: "Lengkap / Done",
    status_rejected: "Ditolak",
  },
  en: {
    nav_copilot: "Copilot",
    nav_scanner: "Scanner",
    nav_reports: "Reports",
    nav_insights: "Insights",
    nav_you: "You",

    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    search: "Search",

    profile_title: "Profile",
    profile_you: "You",
    profile_company: "Company",
    profile_approvers: "Approvers",
    profile_theme: "Appearance",
    profile_language: "Language",

    reports_title: "Reimbursement Forms",
    reports_thisMonth: "This Month",
    reports_new: "New Form",
    reports_empty: "No forms yet.",

    status_draft: "Draft",
    status_submitted: "Awaiting Supervisor",
    status_supervisor: "Awaiting Finance",
    status_finance: "Approved / Finance",
    status_done: "Complete",
    status_rejected: "Rejected",
  },
} as const;

export type DictKey = keyof typeof DICT.id;

export function t(key: DictKey, locale: Locale = "id") {
  return DICT[locale][key] ?? DICT.id[key] ?? key;
}
