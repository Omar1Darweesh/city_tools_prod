"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { Mail, MapPin, Phone, Clock } from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function ContactView() {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [contact, setContact] = useState({
    email: "info@citytools.sa",
    phone: "+966 50 000 0000",
    addressEn: "Cairo, Egypt",
    addressAr: "القاهرة، مصر",
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/store/footer-settings`)
      .then((r) => r.json())
      .then((res) => {
        if (res?.email) setContact((c) => ({ ...c, email: res.email }));
        if (res?.phone) setContact((c) => ({ ...c, phone: res.phone }));
        if (res?.addressEn)
          setContact((c) => ({ ...c, addressEn: res.addressEn }));
        if (res?.addressAr)
          setContact((c) => ({ ...c, addressAr: res.addressAr }));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#0f1923] text-white">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="mb-2 text-3xl font-bold">
          {isRtl ? "اتصل بنا" : "Contact Us"}
        </h1>
        <p className="mb-10 text-white/70">
          {isRtl
            ? "نحن هنا للمساعدة في طلباتك واستفساراتك"
            : "We're here to help with your orders and inquiries"}
        </p>

        <div className="space-y-4">
          <a
            href={`tel:${contact.phone.replace(/\s/g, "")}`}
            className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
          >
            <Phone className="size-6 text-[#C0161B]" />
            <div>
              <p className="text-sm text-white/60">
                {isRtl ? "الهاتف" : "Phone"}
              </p>
              <p className="font-medium" dir="ltr">
                {contact.phone}
              </p>
            </div>
          </a>
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
          >
            <Mail className="size-6 text-[#C0161B]" />
            <div>
              <p className="text-sm text-white/60">
                {isRtl ? "البريد الإلكتروني" : "Email"}
              </p>
              <p className="font-medium">{contact.email}</p>
            </div>
          </a>
          <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-5">
            <MapPin className="size-6 text-[#C0161B]" />
            <div>
              <p className="text-sm text-white/60">
                {isRtl ? "العنوان" : "Address"}
              </p>
              <p className="font-medium">
                {isRtl ? contact.addressAr : contact.addressEn}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-5">
            <Clock className="size-6 text-[#C0161B]" />
            <div>
              <p className="text-sm text-white/60">
                {isRtl ? "ساعات العمل" : "Working hours"}
              </p>
              <p className="font-medium">
                {isRtl ? "السبت – الخميس 9:00 ص – 9:00 م" : "Sat–Thu 9:00 AM – 9:00 PM"}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-10 text-sm text-white/50">
          {isRtl ? "للأسئلة الشائعة والسياسات، راجع " : "For FAQs and policies, see "}
          <Link href="/support" className="text-[#C0161B] hover:underline">
            {isRtl ? "صفحة الدعم" : "Support page"}
          </Link>
        </p>
      </div>
    </div>
  );
}
