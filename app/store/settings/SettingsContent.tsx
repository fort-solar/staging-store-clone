"use client";

import React, { useState } from "react";
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
import { MasterCardIcon } from "@/components/features/icons/MasterCardIcon";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronUp } from "lucide-react";


const tabs = [
    { key: "profile", label: "Profile", link: "/store/settings/profile", mobileLink: "/store/settings/profile#section" },
    { key: "orders", label: "Orders", link: "/store/settings/orders", mobileLink: "/store/settings/orders#section" },
    { key: "quotes", label: "Quotes", link: "/store/settings/quotes", mobileLink: "/store/settings/quotes#section" },
    {
        key: "installations",
        label: "Installations",
        link: "/store/settings/installations",
        mobileLink: "/store/settings/installations#section",
    },
    // { key: "package_requests", label: "Package Requests", link: "/settings/package-requests" },

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
    <div className="flex flex-wrap items-center gap-3 text-xs lg:text-sm text-[#5B5B5B]">
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
        <span className="text-xl font-semibold text-[#202020] underline decoration-[#9C9C9C] underline-offset-4">{value}</span>
    </div>
);

const orderSummaryCards = [
    { id: 1, label: "All Orders", value: "2", icon: <BoltIconSettings /> },
    { id: 2, label: "Processing Orders", value: "2", icon: <ApprovalIcon /> },
    { id: 3, label: "Delivered Orders", value: "2", icon: <SmallTickIcon /> },
] as const;

const orderRows = [
    {
        id: 1,
        type: "ORDER",
        orderId: "ORD ID -349900",
        date: "Order Time 25 Dec, 2025.",
        status: "Shipped",
        qty: "X3",
        unitPrice: "₦234,902.",
        totalAmount: "₦1,120,000",
    },
    {
        id: 2,
        type: "QUOTE",
        orderId: "PRD ID -349900",
        date: "Order Time 25 Dec, 2025.",
        status: "Shipped",
        qty: "X3",
        unitPrice: "₦234,902.",
        totalAmount: "₦1,120,000",
    },

] as const;

const packageRequestRows = [
    { id: 1, requestId: "# BND44890", packageName: "Campus Package", date: "24 May, 2020", financing: "Yes", status: "Pending" },
    { id: 2, requestId: "# BND44890", packageName: "Campus Package", date: "24 May, 2020", financing: "Yes", status: "Contacted" },
    { id: 3, requestId: "# BND44890", packageName: "Campus Package", date: "24 May, 2020", financing: "No", status: "Approved" },
    { id: 4, requestId: "# BND44890", packageName: "Campus Package", date: "24 May, 2020", financing: "No", status: "Packed" },
    { id: 5, requestId: "# BND44890", packageName: "Campus Package", date: "24 May, 2020", financing: "Yes", status: "In-Transit" },
    { id: 6, requestId: "# BND44890", packageName: "Campus Package", date: "24 May, 2020", financing: "Yes", status: "In-Transit" },
    { id: 7, requestId: "# BND44890", packageName: "Campus Package", date: "24 May, 2020", financing: "No", status: "Delivered" },
] as const;

const requestStatusClasses: Record<string, string> = {
    Pending: "bg-[#FFC400] text-white",
    Contacted: "bg-[#2D64F0] text-white",
    Approved: "bg-[#25B852] text-white",
    Packed: "bg-[#7D3CF1] text-white",
    "In-Transit": "bg-[#1BA1E2] text-white",
    Delivered: "bg-[#0A8F08] text-white",
};

const SettingsContent = ({ page }: { page: TabKey }) => {
    const [activeTab, setActiveTab] = useState<TabKey>(page ? page : "profile");
    const [query, setQuery] = useState("");
    const [expandedOrderIds, setExpandedOrderIds] = useState<number[]>([1, 4]);

    const toggleOrderCard = (id: number) => {
        setExpandedOrderIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

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

                        <div className="mt-8 flex flex-col gap-4" >
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

                        <div className="mt-10 flex flex-col gap-2" >
                            <SummaryRow label="Package Requests" value="5" />
                            <SummaryRow label="Completed Installations" value="1" />
                        </div>
                    </aside>

                    <section
                        className="rounded-t-3xl border-t border-x border-[#ECECEC] bg-white p-6 sm:p-8 overflow-x-auto scroll-mt-50 lg:scroll-mt-0"
                        id="section"
                    >
                        <div className="flex flex-col gap-6 w-full ">
                            <div className="w-full overflow-x-auto" >
                                <SmartTabs
                                    tabs={tabs}
                                    activeTab={activeTab}
                                    onChange={setActiveTab}

                                />

                            </div>


                            {activeTab === "profile" && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl lg:text-2xl font-semibold text-[#202020]">
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
                                        <Button className="rounded-xl bg-[#1D9A1D] px-8 py-6 text-base font-semibold text-white hover:bg-[#168416] lg:w-fit w-full">
                                            Edit Details
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {activeTab === "quotes" && (
                                <div className="space-y-6 ">
                                    <div>
                                        <h2 className="text-xl lg:text-2xl font-semibold text-[#202020]">
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
                                        <h2 className="text-xl lg:text-2xl font-semibold text-[#202020]">
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
                                                    <p className="text-xl lg:text-2xl font-semibold text-[#202020]">
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
                                                    <p className="text-base lg:text-lg flex items-center gap-3 font-semibold text-[#202020]">
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
                                                    <p className="text-xl lg:text-2xl font-semibold text-[#202020]">
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

                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="mt-4 flex flex-wrap justify-end gap-3">
                                                        <Button
                                                            variant="outline"
                                                            className="rounded-md border-[#BEBEBE] px-5 text-xs font-semibold lg:w-fit w-full"
                                                        >
                                                            Report Issue
                                                        </Button>
                                                        <Button className="rounded-md bg-[#1D9A1D] px-5 text-xs font-semibold text-white hover:bg-[#168416] lg:w-fit w-full">
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

                            {activeTab === "orders" && (
                                <div className="space-y-5">
                                    <div>
                                        <h2 className="text-xl lg:text-2xl font-semibold text-[#202020]">
                                            My Orders
                                        </h2>
                                        <p className="text-sm text-[#7C7C7C]">
                                            Track my orders, view proof of work and approve delivered products.
                                        </p>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-3">
                                        {orderSummaryCards.map((card) => (
                                            <div
                                                key={card.id}
                                                className="rounded-xl border border-[#E7E7E7] bg-[#FAFAFA] p-4"
                                            >
                                                <p className="text-xs text-[#1C1C1C]">{card.label}</p>
                                                <div className="mt-3 flex items-center justify-between">
                                                    <p className="text-xl lg:text-2xl font-semibold text-[#202020]">
                                                        {card.value}
                                                    </p>
                                                    <span>{card.icon}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-4">
                                        {orderRows.map((order) => {
                                            const isExpanded = expandedOrderIds.includes(order.id);
                                            const isOrder = order.type === "ORDER";
                                            return (
                                                <>
                                                    {isOrder ? (
                                                        <div
                                                            key={order.id}
                                                            className="overflow-hidden rounded-xl border border-[#D9D9D9] bg-white"
                                                        >
                                                            <div className="flex items-center justify-between border-b border-[#EFEFEF] bg-[#FFF8E5] px-5 py-3">
                                                                <div className="flex items-center gap-1 lg:gap-3 text-xs text-[#FFB83C] font-semibold">
                                                                    <LargeTickIcon />
                                                                    Order {order.status}
                                                                </div>
                                                                <button
                                                                    onClick={() => toggleOrderCard(order.id)}
                                                                    className="text-xs font-semibold text-[#168416]"
                                                                >
                                                                    {isExpanded ? (<span className="flex items-center gap-1">Order Details <ChevronUp className="w-5 h-5" /></span>) : "View Order Details >"}
                                                                </button>
                                                            </div>

                                                            {isExpanded && (
                                                                <div className={`py-10 px-5 bg-[#FAFAFA]`}>
                                                                    <div className={`bg-[#D1D5DB52] p-5 w-full rounded-lg grid grid-cols-1 lg:grid-cols-2 gap-10`}>
                                                                        <div>
                                                                            <div className="flex w-full justify-between">
                                                                                <div>
                                                                                    <p className="text-xs font-semibold">
                                                                                        Shipping To
                                                                                    </p>
                                                                                    <p className="text-xs font-medium text-[#50555CB2] leading-6">Test User Name</p>
                                                                                </div>
                                                                                <p className="text-xs text-[#168416] hover:underline cursor-pointer font-medium">Change Address &gt;</p>
                                                                            </div>
                                                                            <div className="mt-3">
                                                                                <p className="text-xs text-[#168416]">No 21 Chindah Street, by Ajip Adageorge</p>
                                                                                <p className="text-xs text-[#50555C] leading-6">Port Harcourt, Nigeria.</p>
                                                                            </div>
                                                                        </div>

                                                                        <div className="">
                                                                            <div>
                                                                                <p className="text-xs font-semibold">
                                                                                    Delivery
                                                                                </p>
                                                                                <p className="text-xs font-medium text-[#50555CB2] leading-6">Estimated Delivery: March 6, - 12th</p>
                                                                            </div>
                                                                            <div className="mt-3">
                                                                                <p className="text-xs text-[#168416]">Delivery Guarantee</p>
                                                                                <p className="text-xs text-[#50555C] leading-6 italic">Return if item is damaged</p>
                                                                                <p className="text-xs text-[#50555C] italic">60 Day no delivery refund</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                </div>
                                                            )}



                                                            <div className="grid gap-6 px-5 py-10 lg:grid-cols-[1fr_320px] bg-[#FAFAFA]">
                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <p className="text-base font-semibold tracking-[-0.02em] text-[#202020]  ">
                                                                            {order.orderId}
                                                                        </p>
                                                                        <p className="mt-1 text-xs  text-[#9B9B9B]">{order.date}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm  font-semibold tracking-[-0.02em] text-[#202020]">Order Progress</p>
                                                                        <p className="text-xs  text-[#9B9B9B]">Track your order here</p>
                                                                    </div>

                                                                    <div className="">
                                                                        {
                                                                            isExpanded && (
                                                                                <>
                                                                                    <div className="border-l border-[#058A05] pl-4 pb-4">
                                                                                        <div className="relative">
                                                                                            <RadioGroup defaultValue="option-one">
                                                                                                <RadioGroupItem value="option-one" id="option-one" className="absolute -left-6 top-0 h-4 w-4 border-2 border-[#058A05] bg-white outline-[#058A05]" />
                                                                                            </RadioGroup>
                                                                                            <p className="text-sm font-medium tracking-[-0.01em] text-[#202020]">Processing</p>
                                                                                            <p className="text-xs leading-5 text-[#8C8C8C]">Apr 9, 2023 - 10:23am</p>
                                                                                            <p className="text-xs leading-6 text-[#5B5B5B]">Your order is being processed.</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="border-l border-[#058A05] pl-4 pb-4">
                                                                                        <div className="relative">
                                                                                            <RadioGroup defaultValue="option-one">
                                                                                                <RadioGroupItem value="option-one" id="option-one" className="absolute -left-6 top-0 h-4 w-4 border-2 border-[#058A05] bg-white outline-[#058A05]" />
                                                                                            </RadioGroup>
                                                                                            <p className="text-sm font-medium tracking-[-0.01em] text-[#202020]">Order Packed</p>
                                                                                            <p className="text-xs leading-5 text-[#8C8C8C]">Apr 10, 2023 - 6:00am</p>
                                                                                            <p className="text-xs leading-6 text-[#5B5B5B]">Your order has been packed</p>
                                                                                        </div>
                                                                                    </div>

                                                                                </>
                                                                            )
                                                                        }
                                                                        <div className="border-l border-[#D1D1D1] pl-4 pb-4">
                                                                            <div className="relative">
                                                                                <RadioGroup defaultValue="option-one">
                                                                                    <RadioGroupItem value="option-one" id="option-one" className="absolute -left-6 top-0 h-4 w-4 border-2 border-[#058A05] bg-white outline-[#058A05]" />
                                                                                </RadioGroup>
                                                                                <p className="text-sm font-medium tracking-[-0.01em] text-[#202020]">Shipped</p>
                                                                                <p className="text-xs leading-5 text-[#8C8C8C]">Apr 10, 2023 - 12:00pm</p>
                                                                                <p className="text-xs leading-6 text-[#5B5B5B]">Your order has been shipped and is on its way</p>
                                                                            </div>
                                                                        </div>


                                                                        {isExpanded && (
                                                                            <>


                                                                                <div className="border-l border-[#D1D1D1] pl-4 pb-2">
                                                                                    <div className="relative">
                                                                                        <span className="absolute -left-6 top-0 h-4 w-4 rounded-full border-2 border-[#3B3B3BB2] bg-white" />
                                                                                        <p className="text-sm font-medium tracking-[-0.01em] text-[#202020]">In Transit</p>
                                                                                        <p className="text-xs leading-5 text-[#8C8C8C]">Apr 10, 2023 - 12:00pm</p>
                                                                                        <p className="text-xs leading-6 text-[#5B5B5B]">Your order is in transit and close to delivery point</p>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="border-l border-[#D1D1D1] pl-4 ">
                                                                                    <div className="relative">
                                                                                        <span className="absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-[#D1D1D1] bg-white" />
                                                                                        <p className="text-sm  font-medium tracking-[-0.01em] text-[#D1D1D1]">Delivered</p>
                                                                                    </div>
                                                                                </div>

                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    <div className="rounded-2xl  lg:p-3.5">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="h-10 w-10 rounded-lg bg-[#E2E2E2]" />
                                                                            <div className="space-y-1">
                                                                                <p className="text-xs lg:text-sm leading-6 font-medium text-[#202020]">
                                                                                    Jinko 550W Monocrystalline
                                                                                </p>
                                                                                <p className="text-xs lg:text-sm font-medium text-[#202020]">
                                                                                    Solar Panel | Jinko Solar
                                                                                </p>
                                                                                <p className="text-xs lg:text-[13px] leading-9 flex justify-between items-center font-semibold tracking-[-0.02em] text-[#202020]">
                                                                                    {order.unitPrice} <span className="text-xs font-normal text-[#8F8F8F]">QTY: {order.qty}</span>
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    {!isExpanded && (<div>
                                                                        <p className="text-[10px] leading-5 text-[#A0A0A0]">Total Amount</p>
                                                                        <p className="text-base font-semibold tracking-[-0.02em] text-[#202020]">{order.totalAmount}</p>
                                                                    </div>)}


                                                                    {isExpanded && (
                                                                        <>
                                                                            <div>
                                                                                <p className="text-sm font-semibold text-[#1C1C1C]">Payment Details</p>
                                                                                <div className="rounded-2xl border border-[#ECECEC]">
                                                                                    {[
                                                                                        ["Sub Total", "₦2,468,224"],
                                                                                        ["Shipping", "₦123,490"],
                                                                                        ["Tax", "₦123,490"],
                                                                                        ["You saved", "-₦73,490"],
                                                                                        ["Total", "₦3,123,490"],
                                                                                    ].map(([label, value]) => (
                                                                                        <div
                                                                                            key={label}
                                                                                            className="flex items-center justify-between border-b border-[#ECECEC] px-4 py-2.5 last:border-b-0"
                                                                                        >
                                                                                            <span className={`text-sm ${label === "Total" ? "font-bold" : "font-medium"} leading-6 text-[#404040]`}>{label}</span>
                                                                                            <span className={`text-sm ${label === "Total" ? "font-bold" : "font-medium"} leading-6 text-[#404040]`}>{value}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>


                                                                            <div className="mt-1">
                                                                                <p className="text-sm font-semibold text-[#1C1C1C]">Payment Method</p>
                                                                                <div className="border p-4 flex justify-between items-center rounded-xl mt-1">
                                                                                    <div className="flex gap-2 items-center">
                                                                                        <MasterCardIcon />
                                                                                        <div>
                                                                                            <p className="text-xs font-medium">Master Card</p>
                                                                                            <p className="text-[10px] text-[#9A9EA6]">Paid on Feb 24, 2026</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <p className="text-xs font-medium">₦3,123,490</p>
                                                                                </div>
                                                                            </div>
                                                                        </>

                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div
                                                            key={order.id}
                                                            className="overflow-hidden rounded-xl border border-[#D9D9D9] bg-white"
                                                        >
                                                            <div className="flex lg:hidden gap-5 items-center justify-between w-full p-4">
                                                                <div className="w-fit border border-[#3730A3] text-[#3730A3] p-2 rounded-full text-[10px] lg:text-xs font-semibold">
                                                                    Quote Requested
                                                                </div>
                                                                <button
                                                                    onClick={() => toggleOrderCard(order.id)}
                                                                    className="text-xs font-semibold text-[#168416]"
                                                                >
                                                                    {isExpanded ? (<span className="flex items-center gap-1">Ouote Details <ChevronUp className="w-5 h-5" /></span>) : "View Quote Details >"}
                                                                </button>
                                                            </div>
                                                            <div className="grid gap-6 px-5 py-10 lg:grid-cols-[1fr_320px] bg-[#FAFAFA]">
                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <p className="text-base font-semibold tracking-[-0.02em] text-[#202020]  ">
                                                                            {order.orderId}
                                                                        </p>
                                                                        <p className="mt-1 text-xs  text-[#9B9B9B]">{order.date}</p>

                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm  font-semibold tracking-[-0.02em] text-[#202020]">Order Progress</p>
                                                                        <p className="text-xs  text-[#9B9B9B]">Track your order here</p>
                                                                    </div>
                                                                    <div className="">
                                                                        {isExpanded && (
                                                                            <div className="border-l border-[#058A05] pl-4 pb-4">
                                                                                <div className="relative">
                                                                                    <RadioGroup defaultValue="option-one">
                                                                                        <RadioGroupItem value="option-one" id="option-one" className="absolute -left-6 top-0 h-4 w-4 border-2 border-[#058A05] bg-white outline-[#058A05]" />
                                                                                    </RadioGroup>
                                                                                    <p className="text-sm font-medium tracking-[-0.01em] text-[#202020]">Quote Requested</p>
                                                                                    <p className="text-xs leading-5 text-[#8C8C8C]">Apr 9, 2023 - 10:23am</p>
                                                                                    <p className="text-xs leading-6 text-[#5B5B5B]">Your quote is being processed</p>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        <div className="border-l border-[#D1D1D1] pl-4 pb-4">
                                                                            <div className="relative">
                                                                                <RadioGroup defaultValue="option-one">
                                                                                    <RadioGroupItem value="option-one" id="option-one" className="absolute -left-6 top-0 h-4 w-4 border-2 border-[#058A05] bg-white outline-[#058A05]" />
                                                                                </RadioGroup>
                                                                                <p className="text-sm font-medium tracking-[-0.01em] text-[#202020]">Quote Sent</p>
                                                                                <p className="text-xs leading-5 text-[#8C8C8C]">Apr 10, 2023 - 6:00am</p>
                                                                                <p className="text-xs leading-6 text-[#5B5B5B] flex w-full justify-between items-center">Your Quote has been sent. <span className="text-[9px] text-[#036D03] font-medium hover:underline cursor-pointer"> Review Requested</span></p>
                                                                            </div>
                                                                        </div>

                                                                        {isExpanded && (
                                                                            <>

                                                                                <div className="border-l border-[#D1D1D1] pl-4 pb-2">
                                                                                    <div className="relative">
                                                                                        <span className="absolute -left-6 top-0 h-4 w-4 rounded-full border-2 border-[#3B3B3BB2] bg-white" />
                                                                                        <p className="text-sm font-medium tracking-[-0.01em] text-[#202020]">Payment</p>
                                                                                        <p className="text-[10px] leading-6 text-[#5B5B5B] flex w-full justify-between items-center">You&apos;ve been prompted to make payments. <span className="text-[9px] text-[#036D03] opacity-50 font-medium  cursor-not-allowed"> Pay Now</span></p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="border-l border-[#D1D1D1] pl-4 pb-2">
                                                                                    <div className="relative">
                                                                                        <span className="absolute -left-6 top-0 h-4 w-4 rounded-full border-2 border-[#D1D1D1] bg-white" />
                                                                                        <p className="text-sm font-medium tracking-[-0.01em] text-[#1C1C1C80]">Procurement</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="border-l border-[#D1D1D1] pl-4 pb-2">
                                                                                    <div className="relative">
                                                                                        <span className="absolute -left-6 top-0 h-4 w-4 rounded-full border-2 border-[#D1D1D1] bg-white" />
                                                                                        <p className="text-sm font-medium tracking-[-0.01em] text-[#D1D1D1]">Delivery to Site</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="border-l border-[#D1D1D1] pl-4 pb-2">
                                                                                    <div className="relative">
                                                                                        <span className="absolute -left-6 top-0 h-4 w-4 rounded-full border-2 border-[#D1D1D1] bg-white" />
                                                                                        <p className="text-sm font-medium tracking-[-0.01em] text-[#D1D1D1]">Installation</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="border-l border-[#D1D1D1] pl-4 ">
                                                                                    <div className="relative">
                                                                                        <span className="absolute -left-6 top-1 h-4 w-4 rounded-full border-2 border-[#D1D1D1] bg-white" />
                                                                                        <p className="text-sm  font-medium tracking-[-0.01em] text-[#D1D1D1]">Completed</p>
                                                                                    </div>
                                                                                </div>

                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    <div className="hidden lg:flex gap-5 items-center justify-end">
                                                                        <div className="w-fit border border-[#3730A3] text-[#3730A3] p-2 rounded-full text-[10px] lg:text-xs font-semibold">
                                                                            Quote Requested
                                                                        </div>
                                                                        <button
                                                                            onClick={() => toggleOrderCard(order.id)}
                                                                            className="text-xs font-semibold text-[#168416]"
                                                                        >
                                                                            {isExpanded ? (<span className="flex items-center gap-1">Ouote Details <ChevronUp className="w-5 h-5" /></span>) : "View Quote Details >"}
                                                                        </button>
                                                                    </div>
                                                                    <div className="rounded-2xl  lg:p-3.5">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-10 h-10 lg:h-20 lg:w-20 rounded-lg bg-[#E2E2E2]" />
                                                                            <div className="space-y-1">
                                                                                <p className="text-xs lg:text-sm leading-6 font-medium text-[#202020]">
                                                                                    Jinko 550W Monocrystalline
                                                                                </p>
                                                                                <p className="text-xs lg:text-sm font-medium text-[#202020]">
                                                                                    Solar Panel | Jinko Solar
                                                                                </p>
                                                                                <p className="text-xs lg:text-[13px] leading-9 flex justify-between items-center font-semibold tracking-[-0.02em] text-[#202020]">
                                                                                    {order.unitPrice} <span className="text-xs font-normal text-[#8F8F8F]">QTY: {order.qty}</span>
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    {!isExpanded && (<div>
                                                                        <p className="text-[10px] leading-5 text-[#A0A0A0]">Total Amount</p>
                                                                        <p className="text-base font-semibold tracking-[-0.02em] text-[#202020]">{order.totalAmount}</p>
                                                                    </div>)}


                                                                    {isExpanded && (
                                                                        <>
                                                                            <div>
                                                                                <p className="text-sm font-semibold text-[#1C1C1C]">Payment Details</p>
                                                                                <div className="rounded-2xl border border-[#ECECEC]">
                                                                                    {[
                                                                                        ["Sub Total", "₦2,468,224"],
                                                                                        ["Shipping", "₦123,490"],
                                                                                        ["Tax", "₦123,490"],
                                                                                        ["You saved", "-₦73,490"],
                                                                                        ["Total", "₦3,123,490"],
                                                                                    ].map(([label, value]) => (
                                                                                        <div
                                                                                            key={label}
                                                                                            className="flex items-center justify-between border-b border-[#ECECEC] px-4 py-2.5 last:border-b-0"
                                                                                        >
                                                                                            <span className={`text-sm ${label === "Total" ? "font-bold" : "font-medium"} leading-6 text-[#404040]`}>{label}</span>
                                                                                            <span className={`text-sm ${label === "Total" ? "font-bold" : "font-medium"} leading-6 text-[#404040]`}>{value}</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </>

                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>)}

                                                </>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {activeTab === "package_requests" && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-[36px] leading-10.5 font-semibold tracking-[-0.02em] text-[#202020]">
                                            My Package Requests
                                        </h2>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-190 border-separate border-spacing-y-2.5">
                                            <thead>
                                                <tr className="text-left text-base font-medium leading-6 text-[#202020]">
                                                    <th className="px-3 py-2.5">Request ID</th>
                                                    <th className="px-3 py-2.5">Package Name</th>
                                                    <th className="px-3 py-2.5">Date</th>
                                                    <th className="px-3 py-2.5">Financing</th>
                                                    <th className="px-3 py-2.5">Status</th>
                                                    <th className="px-3 py-2" />
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {packageRequestRows.map((item) => (
                                                    <tr
                                                        key={item.id}
                                                        className="rounded-lg border border-[#DDDDDD] bg-white text-base leading-6 text-[#202020]"
                                                    >
                                                        <td className="rounded-l-md border-y border-l border-[#DDDDDD] px-3 py-3.5">{item.requestId}</td>
                                                        <td className="border-y border-[#DDDDDD] px-3 py-3.5">{item.packageName}</td>
                                                        <td className="border-y border-[#DDDDDD] px-3 py-3.5">{item.date}</td>
                                                        <td className="border-y border-[#DDDDDD] px-3 py-3.5">{item.financing}</td>
                                                        <td className="border-y border-[#DDDDDD] px-3 py-3.5">
                                                            <span className={`inline-flex min-w-34 items-center justify-center rounded-full px-4 py-1.5 text-base font-medium leading-5 ${requestStatusClasses[item.status]}`}>
                                                                {item.status}
                                                            </span>
                                                        </td>
                                                        <td className="rounded-r-md border-y border-r border-[#DDDDDD] px-3 py-3.5 text-center text-xl leading-none text-[#6F6F6F]">
                                                            ...
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>

    );
};

export default SettingsContent;
