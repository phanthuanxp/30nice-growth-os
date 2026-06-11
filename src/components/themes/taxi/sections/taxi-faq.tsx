"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaxiThemeConfig } from "../types";

interface Props {
  config: TaxiThemeConfig;
}

export function TaxiFaq({ config }: Props) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Câu hỏi thường gặp</h2>
          <p className="text-gray-500">Những điều khách hàng hay hỏi về dịch vụ taxi Bắc Ninh</p>
        </div>

        <div className="space-y-3">
          {config.faqs.map((faq, i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-2xl overflow-hidden transition-shadow hover:shadow-sm"
            >
              <button
                type="button"
                className="w-full flex items-center justify-between px-5 py-4 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-semibold text-gray-900 text-sm sm:text-base pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-gray-400 shrink-0 transition-transform duration-200",
                    open === i && "rotate-180 text-blue-600"
                  )}
                />
              </button>

              {open === i && (
                <div className="px-5 pb-4 border-t border-gray-100">
                  <p className="text-gray-600 text-sm leading-relaxed pt-3">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
