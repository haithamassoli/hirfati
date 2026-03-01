"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import * as m from "motion/react-client";
import {
  Shield,
  Users,
  Target,
  Heart,
  CheckCircle2,
  Zap,
} from "lucide-react";

const values = [
  {
    icon: Shield,
    title: "الثقة والأمان",
    description:
      "نضمن حماية بيانات المستخدمين ونتحقق من هوية كل حرفي لتوفير بيئة آمنة وموثوقة.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Target,
    title: "الجودة",
    description:
      "نسعى لتقديم أعلى معايير الجودة من خلال نظام التقييمات والمراجعات الشفاف.",
    color: "bg-primary-50 text-primary-600",
  },
  {
    icon: Users,
    title: "المجتمع",
    description:
      "نبني مجتمعاً من الحرفيين والعملاء يقوم على التعاون والاحترام المتبادل.",
    color: "bg-accent-50 text-accent-600",
  },
  {
    icon: Heart,
    title: "خدمة العملاء",
    description:
      "نضع رضا العملاء في المقام الأول ونعمل على تحسين تجربتهم باستمرار.",
    color: "bg-pink-50 text-pink-600",
  },
];

const features = [
  "حرفيون موثوقون ومتحققون",
  "عروض أسعار مجانية وتنافسية",
  "نظام تقييمات شفاف",
  "دردشة مباشرة مع الحرفي",
  "تغطية لعمّان وإربد والزرقاء",
  "دعم فني متواصل",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-bl from-primary-50 via-background to-accent-50 py-20">
        <m.div
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <m.h1
            variants={fadeInUp}
            className="text-4xl md:text-5xl font-bold text-foreground mb-6"
          >
            عن <span className="text-primary-500">حرفتي</span>
          </m.h1>
          <m.p
            variants={fadeInUp}
            className="text-lg md:text-xl text-neutral-600 leading-relaxed max-w-3xl mx-auto"
          >
            حرفتي هي المنصة الأولى في الأردن التي تربط الحرفيين المهرة بالعملاء
            الباحثين عن خدمات حرفية عالية الجودة. نهدف لتسهيل الوصول لأفضل
            الحرفيين في سباكة، كهرباء، نجارة، حدادة، دهان، تكييف، بلاط وصيانة
            عامة.
          </m.p>
        </m.div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <m.div
            className="grid md:grid-cols-2 gap-12"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <m.div variants={fadeInUp} className="bg-primary-50 rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                رسالتنا
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                تمكين الحرفيين الأردنيين من الوصول إلى عملاء جدد وبناء سمعة
                مهنية قوية، مع توفير تجربة سهلة وآمنة للعملاء للحصول على خدمات
                حرفية موثوقة بأسعار عادلة.
              </p>
            </m.div>
            <m.div variants={fadeInUp} className="bg-accent-50 rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-accent-500 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                رؤيتنا
              </h2>
              <p className="text-neutral-600 leading-relaxed">
                أن نكون المنصة الرائدة والمرجع الأول للخدمات الحرفية في الأردن
                والمنطقة، نساهم في رفع مستوى المهن الحرفية وتقدير الحرفيين
                المهرة.
              </p>
            </m.div>
          </m.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <m.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-foreground mb-3">قيمنا</h2>
            <p className="text-neutral-500">المبادئ التي توجّه عملنا</p>
          </m.div>

          <m.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {values.map((value) => (
              <m.div
                key={value.title}
                variants={fadeInUp}
                className="bg-surface rounded-2xl p-6 border border-border text-center"
              >
                <div
                  className={`w-14 h-14 rounded-2xl ${value.color} flex items-center justify-center mx-auto mb-4`}
                >
                  <value.icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  {value.description}
                </p>
              </m.div>
            ))}
          </m.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <m.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-foreground mb-3">
              لماذا حرفتي؟
            </h2>
            <p className="text-neutral-500">
              مميزات تجعل تجربتك سهلة وآمنة
            </p>
          </m.div>

          <m.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature) => (
              <m.div
                key={feature}
                variants={fadeInUp}
                className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-border"
              >
                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                <span className="text-foreground">{feature}</span>
              </m.div>
            ))}
          </m.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
