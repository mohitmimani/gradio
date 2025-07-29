"use client";

import NumberFlow from "@number-flow/react";
import { motion } from "framer-motion";
import { BadgeCheck } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PAYMENT_FREQUENCIES: ("monthly" | "yearly")[] = ["monthly", "yearly"];
const TIERS = [
  {
    id: "free",
    name: "Free",
    price: {
      monthly: "Free",
      yearly: "Free",
    },
    description: "For teachers and students getting started",
    features: [
      "Unlimited assignments",
      "AI-powered feedback",
      "Up to 50 student submissions/month",
      "Basic analytics",
      "Community support",
    ],
    cta: "Start For Free",
  },
  {
    id: "starter",
    name: "Starter",
    price: {
      monthly: 19,
      yearly: 15,
    },
    description: "For individuals and small classrooms",
    features: [
      "Unlimited assignments",
      "AI-powered feedback",
      "Up to 500 student submissions/month",
      "Basic analytics",
      "Email support",
    ],
    cta: "Start Free Trial",
  },
  {
    id: "pro",
    name: "Professional",
    price: {
      monthly: 49,
      yearly: 39,
    },
    description: "Ideal for growing schools and organizations",
    features: [
      "Unlimited assignments",
      "Unlimited student submissions",
      "Advanced analytics",
      "Priority support",
      "Team collaboration",
      "Custom integrations",
    ],
    cta: "Get Started",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: {
      monthly: "Custom",
      yearly: "Custom",
    },
    description: "For large institutions and custom needs",
    features: [
      "Everything in Professional",
      "Dedicated account manager",
      "Custom integrations",
      "SLA & compliance",
      "Onboarding & training",
    ],
    cta: "Contact Us",
    highlighted: true,
  },
];

const HighlightedBackground = () => (
  <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] bg-[size:45px_45px] opacity-100 dark:opacity-30" />
);

const PopularBackground = () => (
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(240,119,119,0.1),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(220,119,118,0.3),rgba(255,255,255,0))]" />
);

const Tab = ({
  text,
  selected,
  setSelected,
  discount = false,
}: {
  text: string;
  selected: boolean;
  setSelected: (text: string) => void;
  discount?: boolean;
}) => {
  return (
    <button
      onClick={() => setSelected(text)}
      className={cn(
        "text-foreground relative w-fit px-4 py-2 text-sm font-semibold capitalize transition-colors",
        discount && "flex items-center justify-center gap-2.5",
      )}
    >
      <span className="relative z-10">{text}</span>
      {selected && (
        <motion.span
          layoutId="tab"
          transition={{ type: "spring", duration: 0.4 }}
          className="bg-background absolute inset-0 z-0 rounded-full shadow-sm"
        ></motion.span>
      )}
      {discount && (
        <Badge
          className={cn(
            "relative z-10 bg-gray-100 text-xs whitespace-nowrap text-black shadow-none hover:bg-gray-100",
            selected
              ? "bg-[#F3F4F6] hover:bg-[#F3F4F6]"
              : "bg-gray-300 hover:bg-gray-300",
          )}
        >
          Save 35%
        </Badge>
      )}
    </button>
  );
};

const PricingCard = ({
  tier,
  paymentFrequency,
  className = "",
}: {
  tier: (typeof TIERS)[0];
  paymentFrequency: keyof typeof tier.price;
  className?: string;
}) => {
  const price = tier.price[paymentFrequency];
  const isHighlighted = tier.highlighted;
  const isPopular = tier.popular;

  return (
    <div
      className={cn(
        "relative flex flex-col gap-8 overflow-hidden rounded-2xl border p-6 shadow",
        isHighlighted
          ? "bg-foreground text-background"
          : "bg-background text-foreground",
        isPopular && "outline outline-[#eb638a]",
        className,
      )}
    >
      {isHighlighted && <HighlightedBackground />}
      {isPopular && <PopularBackground />}

      <h2 className="flex items-center gap-3 text-xl font-medium capitalize">
        {tier.name}
        {isPopular && (
          <Badge className="mt-1 bg-orange-900 px-1 py-0 text-white hover:bg-orange-900">
            🔥 Most Popular
          </Badge>
        )}
      </h2>

      <div className="relative h-12">
        {typeof price === "number" ? (
          <>
            <NumberFlow
              format={{
                style: "currency",
                currency: "USD",
                trailingZeroDisplay: "stripIfInteger",
              }}
              value={price}
              className="text-4xl font-medium"
            />
            <p className="-mt-2 text-xs font-medium">Per month/user</p>
          </>
        ) : (
          <h1 className="text-4xl font-medium">{price}</h1>
        )}
      </div>

      <div className="flex-1 space-y-2">
        <h3 className="text-sm font-medium">{tier.description}</h3>
        <ul className="space-y-2">
          {tier.features.map((feature, index) => (
            <li
              key={index}
              className={cn(
                "flex items-center gap-2 text-sm font-medium",
                isHighlighted ? "text-background" : "text-foreground/60",
              )}
            >
              <BadgeCheck strokeWidth={1} size={16} />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <Button
        className={cn(
          "h-fit w-full rounded-lg",
          isHighlighted && "bg-accent text-foreground hover:bg-accent/95",
        )}
      >
        {tier.cta}
      </Button>
    </div>
  );
};

export default function Pricing() {
  const [selectedPaymentFreq, setSelectedPaymentFreq] = useState<
    "monthly" | "yearly"
  >(PAYMENT_FREQUENCIES[0]);

  return (
    <section
      className="flex flex-col items-center gap-10 px-5 py-10"
      id="pricing"
    >
      <div className="space-y-7 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-medium md:text-5xl">
            Simple, transparent pricing for all.
          </h1>
          <p>
            Choose the plan that works for you.
            <br />
            All plans include access to our platform, AI feedback, and support.
          </p>
        </div>
        <div className="mx-auto flex w-fit rounded-full bg-[#F3F4F6] p-1 dark:bg-[#222]">
          {PAYMENT_FREQUENCIES.map((freq) => (
            <Tab
              key={freq}
              text={freq}
              selected={selectedPaymentFreq === freq}
              setSelected={(text) =>
                setSelectedPaymentFreq(text as "monthly" | "yearly")
              }
              discount={freq === "yearly"}
            />
          ))}
        </div>
      </div>

      <div className="grid w-full max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TIERS.map((tier, i) =>
          tier.id === "enterprise" ? (
            <PricingCard
              key={i}
              tier={tier}
              paymentFrequency={selectedPaymentFreq}
              className="col-span-1 lg:col-span-3"
            />
          ) : (
            <PricingCard
              key={i}
              tier={tier}
              paymentFrequency={selectedPaymentFreq}
            />
          ),
        )}
      </div>
    </section>
  );
}
