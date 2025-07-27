"use client";

import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import React, { useEffect } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const defaultTestimonials = [
  {
    text: "Gradio's AI feedback helped me improve my math assignments instantly. The suggestions are spot on!",
    imageSrc: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "Amit Sharma",
    username: "@amitstudent",
    role: "Student",
  },
  {
    text: "I can create and share assignments in minutes. My students love the instant analysis and model answers.",
    imageSrc: "https://randomuser.me/api/portraits/women/44.jpg",
    name: "Priya Verma",
    username: "@priyateacher",
    role: "Math Teacher",
  },
  {
    text: "No more manual grading! Gradio saves me hours every week and gives students actionable feedback.",
    imageSrc: "https://randomuser.me/api/portraits/men/65.jpg",
    name: "John Lee",
    username: "@johnlee",
    role: "Science Educator",
  },
  {
    text: "The QR code sharing is genius. Students submit from their phones and get results right away.",
    imageSrc: "https://randomuser.me/api/portraits/women/68.jpg",
    name: "Fatima Khan",
    username: "@fatimak",
    role: "School Principal",
  },
  {
    text: "Gradio makes assignment review fun and interactive. The AI strengths and improvements are very helpful.",
    imageSrc: "https://randomuser.me/api/portraits/men/23.jpg",
    name: "Rohan Gupta",
    username: "@rohang",
    role: "Student",
  },
  {
    text: "I recommend Gradio to every teacher who wants to modernize their classroom. It's a game changer.",
    imageSrc: "https://randomuser.me/api/portraits/women/12.jpg",
    name: "Emily Chen",
    username: "@emilychen",
    role: "English Teacher",
  },
];

interface TestimonialProps {
  testimonials?: {
    text: string;
    imageSrc: string;
    name: string;
    username: string;
    role?: string;
  }[];
  title?: string;
  subtitle?: string;
  autoplaySpeed?: number;
  className?: string;
}

export default function Testimonials({
  testimonials = defaultTestimonials,
  title = "What Our Users Say",
  subtitle = "Gradio helps teachers save time and gives students instant feedback.",
  autoplaySpeed = 3000,
  className,
}: TestimonialProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    containScroll: "trimSnaps",
    dragFree: true,
  });

  useEffect(() => {
    if (!emblaApi) return;

    const autoplay = setInterval(() => {
      emblaApi.scrollNext();
    }, autoplaySpeed);

    return () => {
      clearInterval(autoplay);
    };
  }, [emblaApi, autoplaySpeed]);

  const allTestimonials = [...testimonials, ...testimonials];

  return (
    <section
      className={cn("relative overflow-hidden py-16 md:py-24", className)}
    >
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.2),transparent_60%)]" />
        <div className="bg-primary/5 absolute top-1/4 left-1/4 h-32 w-32 rounded-full blur-3xl" />
        <div className="bg-primary/10 absolute right-1/4 bottom-1/4 h-40 w-40 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="relative mb-12 text-center md:mb-16"
        >
          <h1 className="from-foreground to-foreground/40 mb-4 bg-gradient-to-b bg-clip-text text-3xl font-bold text-transparent md:text-5xl lg:text-6xl">
            {title}
          </h1>

          <motion.p
            className="text-muted-foreground mx-auto max-w-2xl text-base md:text-lg"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            {subtitle}
          </motion.p>
        </motion.div>

        {/* Testimonials carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {allTestimonials.map((testimonial, index) => (
              <div
                key={`${testimonial.name}-${index}`}
                className="flex justify-center px-4"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="border-border from-secondary/20 to-card relative flex h-80 w-80 flex-col rounded-2xl border bg-gradient-to-b p-6 shadow-md backdrop-blur-sm"
                >
                  {/* Enhanced decorative gradients */}
                  <div className="from-primary/15 to-card absolute -top-5 -left-5 -z-10 h-40 w-40 rounded-full bg-gradient-to-b blur-md" />
                  <div className="from-primary/10 absolute -right-10 -bottom-10 -z-10 h-32 w-32 rounded-full bg-gradient-to-t to-transparent opacity-70 blur-xl" />

                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                    viewport={{ once: true }}
                    className="text-primary mb-4"
                  >
                    <div className="relative">
                      <Quote className="h-10 w-10 -rotate-180" />
                    </div>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
                    viewport={{ once: true }}
                    className="text-foreground/90 relative mb-6 flex-1 text-base leading-relaxed"
                  >
                    <span className="relative">{testimonial.text}</span>
                  </motion.p>

                  {/* Enhanced user info with animation */}
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.05 }}
                    viewport={{ once: true }}
                    className="border-border/40 mt-auto flex items-center gap-3 border-t pt-2"
                  >
                    <Avatar className="border-border ring-primary/10 ring-offset-background h-10 w-10 border ring-2 ring-offset-1">
                      <AvatarImage
                        src={testimonial.imageSrc}
                        alt={testimonial.name}
                      />
                      <AvatarFallback>
                        {testimonial.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <h4 className="text-foreground font-medium whitespace-nowrap">
                        {testimonial.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <p className="text-primary/80 text-sm whitespace-nowrap">
                          {testimonial.username}
                        </p>
                        {testimonial.role && (
                          <>
                            <span className="text-muted-foreground flex-shrink-0">
                              •
                            </span>
                            <p className="text-muted-foreground text-sm whitespace-nowrap">
                              {testimonial.role}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
