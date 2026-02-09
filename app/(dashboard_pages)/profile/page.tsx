"use client";

import React, { useMemo, useState } from "react";
// import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardHeader from "@/components/features/layout/DashboardHeader";
import { SmartTabs, type TabKey } from "@/lib/smartTabs";
import { DownloadIcon } from "@/components/features/icons/DownloadIcon";
import { PDFIcon } from "@/components/features/icons/PDFIcon";
import { ApprovalIcon } from "@/components/features/icons/ApprovalIcon";
import { BoltIconSettings } from "@/components/features/icons/BoltIconSettings";
import { CameraIcon } from "@/components/features/icons/CameraIcon";
import { LargeTickIcon } from "@/components/features/icons/LargeTickIcon";
import { SmallTickIcon } from "@/components/features/icons/SmallTickIcon";
import { LinkChainIcon } from "@/components/features/icons/LinkChainIcon";

const tabs = [
  { key: "profile", label: "Profile" },
  { key: "quotes", label: "Quotes" },
  { key: "installations", label: "Installations" },
  { key: "orders", label: "Orders" },
  { key: "coupons", label: "Coupons" },
  { key: "settings", label: "Settings" },
] as const;

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
    <span className="flex items-center justify-center text-[#7C7C7C]">
      {icon}
    </span>
    <div className="min-w-22.5 text-[#8B8B8B] text-xs">{label}</div>
    <div className="font-medium text-[#202020]">{value}</div>
  </div>
);

const SummaryRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="flex items-center justify-between  py-1 text-sm">
    <span className="font-semibold text-[#202020] underline decoration-[#9C9C9C] underline-offset-4">
      {label}
    </span>
    <span className="text-lg font-semibold text-[#202020] underline decoration-[#9C9C9C] underline-offset-4">{value}</span>
  </div>
);

const Page = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [query, setQuery] = useState("");
  const [couponTab, setCouponTab] = useState<"available" | "expired">(
    "available"
  );

  const activeLabel = useMemo(
    () => tabs.find((tab) => tab.key === activeTab)?.label ?? "Profile",
    [activeTab]
  );

  return (
    <div className="min-h-screen bg-white py-20">
      <DashboardHeader query={query} onQueryChange={setQuery} />
      <div className="mx-auto w-full max-w-6xl py-6 px-6 mt-20 lg:mt-0">
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[350px_1fr]">
          <aside className="w-full rounded-t-3xl border-t border-x border-[#ECECEC] bg-white p-6  lg:py-10">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-32 w-32 items-center justify-center rounded-[32px] border border-[#E3E3E3] bg-[#F3F4F6] text-5xl font-semibold text-[#5B5B5B] shadow-sm">
                A
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#202020]">Ofor Ajo</p>
                <span className="mt-2 inline-flex items-center rounded-full bg-[#EAF7E8] px-4 py-1 text-sm font-medium text-[#1E8E1E]">
                  Customer
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4">
              <InfoItem
                icon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3 5.18 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.72c.12.86.3 1.7.54 2.5a2 2 0 0 1-.45 1.9L9 10.91a16 16 0 0 0 4.09 4.09l1.79-1.09a2 2 0 0 1 1.9-.45c.8.24 1.64.42 2.5.54A2 2 0 0 1 22 16.92z" />
                  </svg>
                }
                label="Phone Number"
                value="+1 000 567 3456"
              />
              <InfoItem
                icon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                    <path d="m22 6-10 7L2 6" />
                  </svg>
                }
                label="Email"
                value="sarahjohnson@gmail.com"
              />
              <InfoItem
                icon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M12 22s7-4.5 7-11a7 7 0 0 0-14 0c0 6.5 7 11 7 11z" />
                    <circle cx="12" cy="11" r="3" />
                  </svg>
                }
                label="Location"
                value="Port Harcourt"
              />
            </div>

            <div className="mt-10 flex flex-col gap-2">
              <SummaryRow label="Package Requests" value="5" />
              <SummaryRow label="Completed Installations" value="1" />
            </div>
          </aside>

          <section className="rounded-t-3xl border-t border-x  border-[#ECECEC] bg-white p-6 sm:p-8 overflow-x-auto">
            <div className="flex flex-col gap-6 w-full ">
              <div className="w-full overflow-x-auto">
                <SmartTabs
                  tabs={tabs}
                  activeTab={activeTab}
                  onChange={setActiveTab}
                />

              </div>


              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#202020]">
                      Personal Details
                    </h2>
                  </div>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <label className="space-y-2 text-sm font-medium text-[#202020]">
                      <span className="flex items-center gap-2 text-[#5B5B5B]">
                        <span className="text-[#9A9A9A]">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </span>
                        First Name
                      </span>
                      <Input
                        defaultValue="Sarah"
                        className="h-12 rounded-xl border-[#E3E3E3] bg-white text-base"
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-[#202020]">
                      <span className="flex items-center gap-2 text-[#5B5B5B]">
                        <span className="text-[#9A9A9A]">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </span>
                        Last Name
                      </span>
                      <Input
                        defaultValue="Johnson"
                        className="h-12 rounded-xl border-[#E3E3E3] bg-white text-base"
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-[#202020]">
                      <span className="flex items-center gap-2 text-[#5B5B5B]">
                        <span className="text-[#9A9A9A]">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                            <path d="m22 6-10 7L2 6" />
                          </svg>
                        </span>
                        Email Address
                      </span>
                      <Input
                        defaultValue="sarahjohnson@gmail.com"
                        className="h-12 rounded-xl border-[#E3E3E3] bg-white text-base"
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-[#202020]">
                      <span className="flex items-center gap-2 text-[#5B5B5B]">
                        <span className="text-[#9A9A9A]">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3 5.18 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.72c.12.86.3 1.7.54 2.5a2 2 0 0 1-.45 1.9L9 10.91a16 16 0 0 0 4.09 4.09l1.79-1.09a2 2 0 0 1 1.9-.45c.8.24 1.64.42 2.5.54A2 2 0 0 1 22 16.92z" />
                          </svg>
                        </span>
                        Phone Number
                      </span>
                      <Input
                        defaultValue="+1 000 567 3456"
                        className="h-12 rounded-xl border-[#E3E3E3] bg-white text-base"
                      />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-[#202020] lg:col-span-2">
                      <span className="flex items-center gap-2 text-[#5B5B5B]">
                        <span className="text-[#9A9A9A]">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <path d="M12 22s7-4.5 7-11a7 7 0 0 0-14 0c0 6.5 7 11 7 11z" />
                            <circle cx="12" cy="11" r="3" />
                          </svg>
                        </span>
                        Address
                      </span>
                      <Input
                        defaultValue="No 21 Chindah Street Ajip Adageorge, Port Harcourt Nigeria"
                        className="h-12 rounded-xl border-[#E3E3E3] bg-white text-base"
                      />
                    </label>
                  </div>
                  <div className="flex justify-end">
                    <Button className="rounded-xl bg-[#1D9A1D] px-8 py-6 text-base font-semibold text-white hover:bg-[#168416]">
                      Edit Details
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "quotes" && (
                <div className="space-y-6 ">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#202020]">
                      My Quotes &amp; Energy summaries
                    </h2>
                    <p className="text-sm text-[#7C7C7C]">
                      View all your potential energy estimates, compare scenarios
                      to help you find the best setup.
                    </p>
                  </div>
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-[#E7E7E7] bg-[#FAFAFA] p-5"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-3">
                        <div className="space-y-2">
                          <p className="text-lg font-semibold text-[#202020]">
                            ID: cal-5686
                          </p>
                          <p className="text-xs text-[#8C8C8C]">22 Dec, 2025.</p>
                          {item === 2 ? (
                            <span className="mt-6 inline-flex rounded-full bg-[#E8F4FF] px-2 py-1 text-xs font-medium text-[#2A7DD1]">
                              Quote Requested
                            </span>
                          ) : (
                            <div className="flex gap-2 items-center mt-6">
                              <span className="inline-flex rounded-full bg-[#E7F7E6] px-2 py-1 text-xs font-medium text-[#1D9A1D] hover:bg-[#D9F0D8]">
                                Preview Quote
                              </span>
                              <div className="flex items-center gap-3 text-[#8C8C8C]">
                                <PDFIcon />
                                <DownloadIcon />
                              </div>
                            </ div >

                          )}


                        </div>
                        <div className="flex items-center lg:px-3 lg:border-r w-full">
                          <ul className="space-y-1 text-[10px] font-medium text-[#5B5B5B] my-4 lg:my-0 px-4 lg:px-0 w-full">
                            <li className="flex justify-between">• Total Load <span>(2.3kW)</span> </li>
                            <li className="flex justify-between">• Total Watt Hours/day <span>(200wh)</span></li>
                            <li className="flex justify-between">• Daily Usage <span>(4.77 kWh/day)</span></li>
                            <li className="flex justify-between">• Monthly Usage <span>(143.1 kWh)</span></li>
                          </ul>
                        </div>

                        <div className="space-y-2 px-3 w-full">
                          <p className="text-sm font-semibold text-[#202020]">
                            Appliances
                          </p>
                          <div className="flex flex-wrap gap-2 w-full">
                            {[
                              "Laptop",
                              "Phones",
                              "Freezer",
                              "Freezer",
                              "Freezer",
                            ].map((tag) => (
                              <span
                                key={`${item}-${tag}`}
                                className="rounded-sm bg-[#F1F2F4] font-medium px-1 py-1 text-[10px] text-[#5B5B5B]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

              {activeTab === "installations" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#202020]">
                      My Installations
                    </h2>
                    <p className="text-sm text-[#7C7C7C]">
                      Track installations, view proof of work and approve completed
                      jobs.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      { id: 1, label: "Active Installations", value: "2", tone: "#E9F6EE" },
                      { id: 2, label: "Pending Approval", value: "3", tone: "#FFF3DD" },
                      { id: 3, label: "Completed Installations", value: "4", tone: "#E9F6EE" },
                    ].map((card) => (
                      <div
                        key={card.id}
                        className="rounded-2xl border border-[#E7E7E7] bg-[#FAFAFA] p-4"
                      >
                        <p className="text-xs text-[#1C1C1C]">{card.label}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-2xl font-semibold text-[#202020]">
                            {card.value}
                          </p>
                          <span
                          >
                            {card.id === 1 ? (<BoltIconSettings />) : card.id === 2 ? (<ApprovalIcon />) : (<SmallTickIcon />)}
                          </span>
                        </div>

                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-[#E7E7E7] bg-[#FAFAFA] ">
                      <div className="py-3 px-4 flex flex-col gap-4 border-b border-[#F0F0F0] bg-[#FFC7021A] lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3 text-xs text-[#FFB83C] font-semibold">
                          <LargeTickIcon />
                          INSTALLATION COMPLETE - ACTION REQUIRED
                        </div>
                        <p className="text-xs text-[#1C1C1C]">
                          Job ID: #NY02300
                        </p>
                      </div>
                      <div className="p-4  flex flex-col gap-4 lg:flex-row lg:items-center bg-[#FAFAFA] lg:justify-between">
                        <div className="space-y-2">
                          <p className="text-lg flex items-center gap-3 font-semibold text-[#202020]">
                            5kW Hybrid Inverter Package <span className="text-[10px] text-[#21C45D] border border-[#21C45D] p-1 rounded-sm">Completed</span>
                          </p>
                          <p className="text-xs text-[#7C7C7C]">
                            BUN_118822 - Installed 25 Dec, 2025.
                          </p>
                          <p className="text-xs text-[#7C7C7C]">
                            Installer: Jude Werey &nbsp; Installation: Completed
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[#7C7C7C]">Total Cost</p>
                          <p className="text-2xl font-semibold text-[#202020]">
                            ₦2,500,000
                          </p>
                          <p className="text-xs font-medium text-[#1D9A1D]">
                            Paid In Full
                          </p>
                        </div>
                      </div>
                      <div className="px-4">
                        <div className="mt-4 rounded-md bg-white p-4">
                          <p className="flex items-center gap-2 text-sm font-semibold text-[#202020]">
                            <CameraIcon /> Proof of Work
                          </p>
                          <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {[1, 2, 3, 4].map((img) => (
                              <div
                                key={img}
                                className="relative h-20 w-full overflow-hidden  bg-[#E7E7E7]"
                              >
                                {/* <Image
                                src="/double_solar_panels.png"
                                alt="Proof of work"
                                fill
                                className="object-cover"
                              /> */}
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 flex flex-wrap justify-end gap-3">
                            <Button
                              variant="outline"
                              className="rounded-md border-[#BEBEBE] px-5 text-xs font-semibold"
                            >
                              Report Issue
                            </Button>
                            <Button className="rounded-md bg-[#1D9A1D] px-5 text-xs font-semibold text-white hover:bg-[#168416]">
                              Approve Installation
                            </Button>
                          </div>
                        </div>
                      </div>

                    </div>

                    {[1, 2].map((row) => (
                      <div
                        key={row}
                        className="rounded-2xl border border-[#E7E7E7] bg-white p-5"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="space-y-2">
                            <p className="flex items-center gap-2 text-lg font-semibold text-[#202020]">
                              5kW Hybrid Inverter Package {row === 1 ? (<span className="text-[10px] text-[#168ABD] border border-[#168ABD] p-1 rounded-sm">In Progress</span>) : (<span className="text-[10px] text-[#979797] border border-[#979797] p-1 rounded-sm">Sheduled</span>)}
                            </p>
                            <p className="text-xs text-[#7C7C7C]">
                              BUN_118822 - Started 25 Dec, 2025.
                            </p>
                            <p className="text-xs text-[#7C7C7C]">
                              Installer: Jude Werey &nbsp; Installation: <span>{row === 1 ? "Ongoing" : "Sheduled"}</span>
                            </p>
                          </div>
                          <div className="min-w-40">
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] text-[#7C7C7C]">Progress</p>
                              <p className="mt-2 text-right text-[10px] text-[#50555C] font-bold">
                                {row === 1 ? "65%" : "2%"}
                              </p>
                            </div>

                            <div className="mt-2 h-1.5 w-full rounded-full bg-[#E9EEF1]">
                              <div
                                className="h-1.5 rounded-full bg-[#168ABD]"
                                style={{ width: row === 1 ? "65%" : "2%" }}
                              />
                            </div>

                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "coupons" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-semibold text-[#202020]">
                      Offers &amp; Coupons
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { id: 1, key: "available", label: "Available Coupons ", number: "(1)" },
                      { id: 2, key: "expired", label: "Expired Coupons ", number: "(3)" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() =>
                          setCouponTab(tab.key as "available" | "expired")
                        }
                        className={`rounded-full px-6 py-2 text-sm font-medium transition ${couponTab === tab.key
                          ? "border border-[#1D9A1D] bg-white text-[#7C7C7C]"
                          : "bg-[#F4F4F4] text-[#7C7C7C]"
                          }`}
                      >
                        {tab.label} <span style={{ color: tab.id === 1 ? "#058A05" : "red" }}>{tab.number}</span>
                      </button>
                    ))}
                  </div>
                  <div>
                    <h3 className="flex items-center gap-2 text-xl my-2 font-semibold text-[#202020]">
                      {couponTab === "available"
                        ? "Available Coupons"
                        : "Expired Coupons"}
                      <span className={`${ couponTab === "available" ? "text-[#058A05]": "text-red-600"}`}>
                        {couponTab === "available"
                          ? "(1)"
                          : "(3)"}
                      </span>

                    </h3>
                    <p className="text-sm text-[#7C7C7C]">
                      Available for most garages, only one per service order
                    </p>
                  </div>
                  <div className="max-w-xs rounded-2xl border border-[#E7E7E7] bg-white p-6">
                    <div className="flex items-center justify-between w-full">
                      <div className="w-full">
                        <div className="flex flex-wrap mb-4 items-center justify-between w-full">
                          <p className="text-2xl font-semibold text-[#202020]">
                            ₦ 234,902.00
                          </p>
                          <p className="text-[10px] text-[#7C7C7C]">Valid till May 28</p>
                        </div>

                        <p className="text-[10px] font-medium text-[#202020]">
                          For Home Packages
                        </p>
                        <p className="text-[10px] text-[#7C7C7C]">
                          Any other information for the coupon goes here
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-lg font-semibold text-[#1D9A1D]">
                        #DHIU5D6P658
                      </p>
                      <LinkChainIcon />
                    </div>
                  </div>
                </div>
              )}

              {["orders", "wishlist", "cart", "package_requests", "settings", "more"].includes(
                activeTab
              ) && (
                  <div className="space-y-3 rounded-2xl border border-dashed border-[#E0E0E0] bg-[#FAFAFA] p-6 text-center">
                    <p className="text-lg font-semibold text-[#202020]">
                      {activeLabel}
                    </p>
                    <p className="text-sm text-[#7C7C7C]">
                      No data yet
                    </p>
                  </div>
                )}
            </div>
          </section>
        </div>
      </div>
    </div>

  );
};

export default Page;
