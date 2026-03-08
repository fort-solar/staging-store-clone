"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, EllipsisVertical, Info, MapPin, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SmartTabsInstaller, type TabKeyInstaller } from "@/lib/smartTabs";
import { BankIcon } from "@/components/features/icons/BankIcon";
import { HistoryIcon } from "@/components/features/icons/HistoryIcon";
import { PrintIcon } from "@/components/features/icons/PrintIcon";
import { SoonIcon } from "@/components/features/icons/SoonIcon";
import { ImageIcon } from "@/components/features/icons/ImageIcon";
import { PDFIcon } from "@/components/features/icons/PDFIcon";
import { getMockSession } from "@/lib/localAuth";

type InstallerProfileState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  location: string;
  experienceLevel: string;
  additionalInfo: string;
  skills: string[];
  completedInstallations: number;
  rating: number;
  tier: string;
};

type PaymentMethod = {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
};

type PayoutStatus = "Pending" | "Approved" | "Declined";
type PayoutFilter = "All" | PayoutStatus;

type PayoutHistoryRow = {
  id: string;
  referenceId: string;
  amount: string;
  date: string;
  status: PayoutStatus;
};

type ProjectStatus = "Scheduled" | "In Progress" | "Completed";

type InstallerProject = {
  id: string;
  title: string;
  location: string;
  summary: string;
  budget: string;
  startMeta: string;
  status: ProjectStatus;
  tags: string[];
};

const tabs = [
  { key: "profile", label: "Settings", link: "/installer/settings/profile" },
  { key: "projects", label: "Projects", link: "/installer/settings/projects" },
  {
    key: "bills_and_payments",
    label: "Billing & Payments",
    link: "/installer/settings/bills-and-payments",
  },
] as const;

const DEFAULT_SKILLS = ["Battery Configuration", "Residential", "Domestic", "Commercial"];

const EXPERIENCE_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert", "Master"];

const PROJECTS: InstallerProject[] = [
  {
    id: "project-1",
    title: "3kVA Solar/ Inverter AA1 Installation",
    location: "Ajip, Port Harcourt.",
    summary:
      "Lorem ipsum dolor sit amet consectetur. Mattis et ut condimentum ac. Nunc in tristique tempor mi auctor etiam maecenas iaculis. Faucibus in ornare arcu turpis.",
    budget: "₦71.24M",
    startMeta: "To Start Nov 20th, 2025",
    status: "Scheduled",
    tags: ["New Installation", "Standard", "6-8 Hrs"],
  },
  {
    id: "project-2",
    title: "3kVA Solar/ Inverter AA1 Installation",
    location: "Ajip, Port Harcourt.",
    summary:
      "Lorem ipsum dolor sit amet consectetur. Mattis et ut condimentum ac. Nunc in tristique tempor mi auctor etiam maecenas iaculis. Faucibus in ornare arcu turpis.",
    budget: "₦71.24M",
    startMeta: "Job Started",
    status: "In Progress",
    tags: ["New Installation", "Standard", "6-8 Hrs"],
  },
  {
    id: "project-3",
    title: "3kVA Solar/ Inverter AA1 Installation",
    location: "Ajip, Port Harcourt.",
    summary:
      "Lorem ipsum dolor sit amet consectetur. Mattis et ut condimentum ac. Nunc in tristique tempor mi auctor etiam maecenas iaculis. Faucibus in ornare arcu turpis.",
    budget: "₦71.24M",
    startMeta: "Job Verified",
    status: "Completed",
    tags: ["New Installation", "Standard", "6-8 Hrs"],
  },
];

const PAYOUT_HISTORY: PayoutHistoryRow[] = [
  {
    id: "pay-1",
    referenceId: "FS-TRX-004512",
    amount: "₦120,000",
    date: "15 Oct 2025",
    status: "Pending",
  },
  {
    id: "pay-2",
    referenceId: "FS-TRX-004513",
    amount: "₦120,000",
    date: "15 Oct 2025",
    status: "Approved",
  },
  {
    id: "pay-3",
    referenceId: "FS-TRX-004514",
    amount: "₦120,000",
    date: "15 Oct 2025",
    status: "Declined",
  },
];

const statusTone: Record<ProjectStatus, string> = {
  Scheduled: "bg-[#E9F6E9] text-[#149414]",
  "In Progress": "bg-[#FFF5E5] text-[#F59E0B]",
  Completed: "bg-[#E8F9EB] text-[#17A11E]",
};

const payoutTone: Record<PayoutStatus, string> = {
  Pending: "bg-[#FFF0C8] text-[#E3A100]",
  Approved: "bg-[#DFF3DF] text-[#159216]",
  Declined: "bg-[#FCE5E5] text-[#E24646]",
};

const InfoItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex flex-wrap items-center gap-3 text-sm text-[#5B5B5B]">
    <span className="flex items-center justify-center text-[#7C7C7C]">{icon}</span>
    <div className="min-w-22.5 text-[#8B8B8B] text-xs">{label}</div>
    <div className="font-medium text-[#202020]">{value}</div>
  </div>
);

const SettingsContent = ({ page }: { page: TabKeyInstaller }) => {
  const session = useMemo(() => getMockSession(), []);
  const [activeTab, setActiveTab] = useState<TabKeyInstaller>(page ? page : "profile");
  const [skillInput, setSkillInput] = useState("");
  const [isSkillEditorOpen, setIsSkillEditorOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPayoutFilterOpen, setIsPayoutFilterOpen] = useState(false);
  const [payoutFilter, setPayoutFilter] = useState<PayoutFilter>("All");

  const [paymentForm, setPaymentForm] = useState({
    accountName: "",
    accountNumber: "",
    bankName: "",
  });

  const sessionFirstName = session?.fullName?.split(" ")[0] ?? "Pedro";
  const sessionLastName = session?.fullName?.split(" ").slice(1).join(" ") || "Ajo";
  const sessionEmail = session?.email ?? "sarahjohnson@gmail.com";

  const defaultProfile: InstallerProfileState = {
    firstName: sessionFirstName,
    lastName: sessionLastName,
    email: sessionEmail,
    phone: "+1 000 567 3456",
    address: "No 21 Chindah Street Ajip Adageorge, Port Harcourt Nigeria",
    location: "Port Harcourt",
    experienceLevel: "Expert",
    additionalInfo: "Experienced in hybrid inverter setup, diagnostics, and post-install support.",
    skills: DEFAULT_SKILLS,
    completedInstallations: 15,
    rating: 5.5,
    tier: "Tier II",
  };

  const defaultPaymentMethods: PaymentMethod[] = [
    {
      id: "method-1",
      accountName: "Giadom C Werey",
      accountNumber: "5089594569",
      bankName: "FCMB",
    },
  ];

  const [profile, setProfile] = useState<InstallerProfileState>(() => {
    const key = `fortsolar_installer_settings_${session?.userId ?? "guest"}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultProfile;
    try {
      const parsed = JSON.parse(raw) as { profile?: InstallerProfileState };
      return parsed.profile ?? defaultProfile;
    } catch {
      return defaultProfile;
    }
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => {
    const key = `fortsolar_installer_settings_${session?.userId ?? "guest"}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultPaymentMethods;
    try {
      const parsed = JSON.parse(raw) as { paymentMethods?: PaymentMethod[] };
      return parsed.paymentMethods ?? defaultPaymentMethods;
    } catch {
      return defaultPaymentMethods;
    }
  });

  useEffect(() => {
    const key = `fortsolar_installer_settings_${session?.userId ?? "guest"}`;
    window.localStorage.setItem(
      key,
      JSON.stringify({
        profile,
        paymentMethods,
      })
    );
  }, [paymentMethods, profile, session?.userId]);

  const addSkill = () => {
    const value = skillInput.trim();
    if (!value) return;
    if (profile.skills.some((skill) => skill.toLowerCase() === value.toLowerCase())) {
      setSkillInput("");
      return;
    }
    setProfile((prev) => ({ ...prev, skills: [...prev.skills, value] }));
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((item) => item !== skill),
    }));
  };

  const addPaymentMethod = () => {
    const accountName = paymentForm.accountName.trim();
    const accountNumber = paymentForm.accountNumber.trim();
    const bankName = paymentForm.bankName.trim();

    if (!accountName || !accountNumber || !bankName) return;

    setPaymentMethods((prev) => [
      ...prev,
      {
        id: `method_${Date.now()}`,
        accountName,
        accountNumber,
        bankName,
      },
    ]);
    setPaymentForm({ accountName: "", accountNumber: "", bankName: "" });
    setIsPaymentModalOpen(false);
  };

  const removePaymentMethod = (id: string) => {
    setPaymentMethods((prev) => prev.filter((item) => item.id !== id));
  };

  const filteredPayoutHistory = useMemo(() => {
    if (payoutFilter === "All") return PAYOUT_HISTORY;
    return PAYOUT_HISTORY.filter((row) => row.status === payoutFilter);
  }, [payoutFilter]);

  return (
    <div className="min-h-screen bg-white py-10">
      <div className="mx-auto w-full max-w-7xl px-6 py-6 mt-20 lg:mt-0">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/installer/dashboard"
            className="inline-flex items-center gap-2 rounded-md border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#374151]"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[350px_1fr]">
          <aside className="w-full rounded-t-3xl border-t border-x border-[#ECECEC] bg-white p-6 lg:py-10">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-[32px] border border-[#E3E3E3] bg-[#F3F4F6] text-5xl font-semibold text-[#5B5B5B] shadow-sm">
                {profile.firstName?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#202020] flex items-center gap-3">
                  {profile.firstName} {profile.lastName}
                  <span className="flex flex-col text-[#FFA726] text-xs font-bold items-center border w-fit p-1 rounded-md border-[#FFA726]">
                    <Star className="w-3 h-3" />
                    <span>{profile.rating}</span>
                  </span>
                </p>
                <span className="mt-2 inline-flex items-center rounded-l-full bg-[#168ABD1A] px-4 py-1 text-sm font-medium text-[#168ABD]">
                  Installer
                </span>
                <span className="bg-[#EBFAEB] mt-2 inline-flex items-center rounded-r-full px-4 py-1 text-sm font-medium text-[#036D03]">
                  {profile.tier}
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4">
              <InfoItem
                icon={<span>⌕</span>}
                label="Phone Number"
                value={profile.phone}
              />
              <InfoItem icon={<span>✉</span>} label="Email" value={profile.email} />
              <InfoItem icon={<MapPin className="h-4 w-4" />} label="Location" value={profile.location} />
            </div>

            <div className="mt-8">
              <p className="text-2xl font-semibold text-[#202020]">Skills</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-[#5E6673] bg-white px-4 py-1 text-sm font-medium text-[#50555C]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-10 flex items-center justify-between py-1 text-sm">
              <span className="font-semibold text-[#202020] underline decoration-[#9C9C9C] underline-offset-4">
                Completed Intallations
              </span>
              <span className="text-xl font-semibold text-[#202020] underline decoration-[#9C9C9C] underline-offset-4">
                {profile.completedInstallations}
              </span>
            </div>
          </aside>

          <section className="rounded-t-3xl border-t border-x border-[#ECECEC] bg-white p-6 sm:p-8 overflow-x-auto">
            <div className="flex flex-col gap-6 w-full">
              <div className="w-full overflow-x-auto">
                <SmartTabsInstaller tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
              </div>

              {activeTab === "profile" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-[#202020]">Personal Details</h2>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <label className="space-y-2 text-sm font-medium text-[#202020]">
                      <span className="text-[#5B5B5B]">First Name</span>
                      <Input
                        value={profile.firstName}
                        onChange={(e) => setProfile((prev) => ({ ...prev, firstName: e.target.value }))}
                        className="h-12 rounded-xl border-[#E3E3E3] bg-white text-base"
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-[#202020]">
                      <span className="text-[#5B5B5B]">Last Name</span>
                      <Input
                        value={profile.lastName}
                        onChange={(e) => setProfile((prev) => ({ ...prev, lastName: e.target.value }))}
                        className="h-12 rounded-xl border-[#E3E3E3] bg-white text-base"
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-[#202020]">
                      <span className="text-[#5B5B5B]">Email Address</span>
                      <Input
                        value={profile.email}
                        onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                        className="h-12 rounded-xl border-[#E3E3E3] bg-white text-base"
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-[#202020]">
                      <span className="text-[#5B5B5B]">Phone Number</span>
                      <Input
                        value={profile.phone}
                        onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                        className="h-12 rounded-xl border-[#E3E3E3] bg-white text-base"
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-[#202020] lg:col-span-2">
                      <span className="text-[#5B5B5B]">Address</span>
                      <Input
                        value={profile.address}
                        onChange={(e) => setProfile((prev) => ({ ...prev, address: e.target.value }))}
                        className="h-12 rounded-xl border-[#E3E3E3] bg-white text-base"
                      />
                    </label>

                    <label className="space-y-2 text-sm font-medium text-[#202020]">
                      <span className="text-[#5B5B5B]">Experience Level</span>
                      <select
                        value={profile.experienceLevel}
                        onChange={(e) => setProfile((prev) => ({ ...prev, experienceLevel: e.target.value }))}
                        className="h-12 w-full rounded-xl border border-[#E3E3E3] bg-white px-3 text-base outline-none"
                      >
                        {EXPERIENCE_LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2 text-sm font-medium text-[#202020] lg:col-span-2">
                      <span className="text-[#5B5B5B]">Additional Info</span>
                      <textarea
                        value={profile.additionalInfo}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            additionalInfo: e.target.value,
                          }))
                        }
                        className="min-h-28 w-full rounded-xl border border-[#E3E3E3] bg-white px-3 py-3 text-base outline-none"
                      />
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-semibold text-[#202020]">Skills</h3>
                      <Button
                        type="button"
                        onClick={() => setIsSkillEditorOpen((prev) => !prev)}
                        className="rounded-full bg-[#E9EEF2] px-5 text-[#1F2937] hover:bg-[#DCE4EA]"
                      >
                        {isSkillEditorOpen ? "Done" : "Edit Skills"}
                      </Button>
                    </div>

                    <div className="rounded-2xl border border-[#E3E3E3] bg-[#FAFAFA] p-4">
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-2 rounded-full border border-[#5E6673] bg-white px-4 py-1 text-sm font-medium text-[#50555C]"
                          >
                            {skill}
                            {isSkillEditorOpen && (
                              <button type="button" onClick={() => removeSkill(skill)}>
                                <Trash2 className="h-3 w-3 text-[#D64545]" />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>

                      {isSkillEditorOpen && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <Input
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            placeholder="Add new skill"
                            className="h-11 max-w-60 rounded-xl border-[#E3E3E3]"
                          />
                          <Button
                            type="button"
                            onClick={addSkill}
                            className="h-11 rounded-xl bg-[#1D9A1D] px-5 text-white hover:bg-[#168416]"
                          >
                            Add Skill
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "projects" && (
                <div className="space-y-6">
                  {PROJECTS.map((project) => (
                    <div key={project.id} className="rounded-[22px] border border-[#DCE1E7] bg-white p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base leading-none font-bold text-[#1F2937]">{project.title}</h3>
                          <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#07940F]">
                            <MapPin className="h-4 w-4" /> {project.location}
                          </p>
                        </div>
                        <EllipsisVertical className="h-5 w-5 text-[#7B8390]" />
                      </div>

                      <p className="mt-3 text-sm text-[#5B6472] leading-snug">{project.summary}</p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
                          <span
                            key={`${project.id}-${tag}`}
                            className={`rounded-md px-3 py-1 text-xs text-white ${
                              tag.includes("New") ? "bg-[#2563EB]" : tag.includes("Standard") ? "bg-[#059669]" : "bg-[#475569]"
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 border-t border-[#D7DDE3] pt-4 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-base font-bold text-[#1D2430]">{project.budget}</p>
                        <div className="flex items-center gap-3">
                          {project.status === "Completed" && (
                            <>
                              <ImageIcon />
                              <PDFIcon />
                            </>
                          )}
                          <span className="rounded-xl bg-[#F3F4F6] px-4 py-2 text-[#9098A5] text-xs font-medium">
                            {project.startMeta}
                          </span>
                          <span className={`rounded-xl px-4 py-2 text-xs font-medium ${statusTone[project.status]}`}>
                            {project.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "bills_and_payments" && (
                <div className="space-y-6">
                  <div className="rounded-[22px] border border-[#DCE1E7] bg-white p-6">
                    <h2 className="text-lg font-bold text-[#1B2330]">Payment Details</h2>
                    <p className="mt-2 inline-flex items-center gap-2 text-[#5B6472] text-xs">
                      <Info className="h-4 w-4 hidden lg:block" />
                      Having issues updating your payment details send us a message now here projects@fortsolar.ng
                    </p>

                    <p className="mt-4 mb-2 text-[#1B2330] text-sm">
                      {paymentMethods.length === 0
                        ? "You have not set any payment details yet."
                        : "Your payment methods:"}
                    </p>

                    <Button
                      type="button"
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="w-full lg:w-fit mt-4 rounded-xl bg-[#18A11B] px-6 py-5 text-white hover:bg-[#138A16]"
                    >
                      Add Payment Details
                    </Button>

                    <div className="mt-5 flex flex-wrap gap-3">
                      {paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          className="w-full lg:w-fit lg:min-w-80  rounded-xl border border-[#D9DEE5] bg-white p-2 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-[#EFF2F7] p-2">
                              <BankIcon className="h-8 lg:h-10 w-8 lg:w-10" />
                            </div>
                            <div>
                              <p className="text-[#253143] text-sm font-semibold">{method.accountName}</p>
                              <p className="text-[#1C2430] text-sm font-bold">{method.accountNumber}</p>
                              <p className="text-[#4C5563] text-sm">{method.bankName}</p>
                            </div>
                          </div>

                          <button type="button" onClick={() => removePaymentMethod(method.id)}>
                            <Trash2 className="h-5 w-5 text-[#D64545]" />
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="w-16 h-16 rounded-xl border border-[#D9DEE5] bg-[#F7F8FA] grid place-items-center"
                      >
                        <Plus className="h-10 w-10 text-[#4B5563]" />
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-[#E4E8ED] bg-[#FAFAFA] p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="inline-flex items-center gap-3 text-lg font-bold text-[#1B2330]">
                        <HistoryIcon /> Payout History
                      </h3>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsPayoutFilterOpen((prev) => !prev)}
                          className="inline-flex items-center gap-2 rounded-lg border border-[#E5E9EF] bg-white px-4 py-2 text-[#6D7683]"
                        >
                          <SoonIcon /> {payoutFilter} <ChevronDown className="h-4 w-4" />
                        </button>
                        {isPayoutFilterOpen && (
                          <div className="absolute right-0 top-12 z-20 w-40 rounded-xl border border-[#E5E9EF] bg-white p-1 shadow-sm">
                            {(["All", "Pending", "Approved", "Declined"] as PayoutFilter[]).map((value) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => {
                                  setPayoutFilter(value);
                                  setIsPayoutFilterOpen(false);
                                }}
                                className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                                  payoutFilter === value ? "bg-[#EBFAEB] text-[#168416]" : "text-[#4B5563]"
                                }`}
                              >
                                {value}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full min-w-190 text-left">
                        <thead>
                          <tr className="text-[#6D7683] text-base font-medium border-b border-[#E6E9EF]">
                            <th className="py-3">Reference ID</th>
                            <th className="py-3">Amount</th>
                            <th className="py-3">Date</th>
                            <th className="py-3">Status</th>
                            <th className="py-3">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPayoutHistory.map((row) => (
                            <tr key={row.id} className="text-base text-[#556070]">
                              <td className="py-3">{row.referenceId}</td>
                              <td className="py-3">{row.amount}</td>
                              <td className="py-3">{row.date}</td>
                              <td className="py-3">
                                <span className={`rounded-full px-4 py-1 text-XS font-medium ${payoutTone[row.status]}`}>
                                  {row.status}
                                </span>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-3">
                                    {
                                        row.status === "Pending" && ( <SoonIcon className="h-4 w-4" />)
                                    }
                                    {
                                        row.status === "Approved" && ( <PrintIcon className="h-5 w-5" />)
                                    }
                                    {
                                        row.status === "Declined" && ( <div className="h-5 w-5"/>)
                                    }
                                  
                                 
                                  <Trash2 className="h-5 w-5 text-[#D64545]" />
                                </div>
                              </td>
                            </tr>
                          ))}
                          {filteredPayoutHistory.length === 0 && (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-sm text-[#7B8593]">
                                No payout records for this filter.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-[#1B2330]">Add Payment Method</h3>
            <div className="mt-4 space-y-4">
              <label className="space-y-1 block">
                <span className="text-sm text-[#475467]">Account Name</span>
                <Input
                  value={paymentForm.accountName}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, accountName: e.target.value }))
                  }
                  className="h-11 rounded-xl"
                />
              </label>

              <label className="space-y-1 block">
                <span className="text-sm text-[#475467]">Account Number</span>
                <Input
                  value={paymentForm.accountNumber}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, accountNumber: e.target.value }))
                  }
                  className="h-11 rounded-xl"
                />
              </label>

              <label className="space-y-1 block">
                <span className="text-sm text-[#475467]">Bank Name</span>
                <Input
                  value={paymentForm.bankName}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, bankName: e.target.value }))
                  }
                  className="h-11 rounded-xl"
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPaymentModalOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button type="button" onClick={addPaymentMethod} className="rounded-xl bg-[#18A11B] hover:bg-[#138A16]">
                Save Method
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default SettingsContent;
