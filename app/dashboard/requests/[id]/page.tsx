"use client";

import { use } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { cityLabels } from "@/lib/constants";
import {
  ArrowRight,
  MapPin,
  Banknote,
  MessageSquareQuote,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Trash2,
  ImageIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, type FormEvent } from "react";
import type { Id } from "@/convex/_generated/dataModel";

const statusLabels: Record<string, string> = {
  open: "مفتوح",
  assigned: "تم التعيين",
  closed: "مغلق",
};

const statusVariants: Record<string, "success" | "primary" | "default"> = {
  open: "success",
  assigned: "primary",
  closed: "default",
};

const quoteStatusLabels: Record<string, string> = {
  pending: "في الانتظار",
  accepted: "مقبول",
  rejected: "مرفوض",
  withdrawn: "تم السحب",
};

const quoteStatusVariants: Record<string, "warning" | "success" | "default" | "primary"> = {
  pending: "warning",
  accepted: "success",
  rejected: "default",
  withdrawn: "default",
};

export default function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const isValidId = /^[a-z0-9]{32}$/.test(id) || id.startsWith("k");
  const request = useQuery(
    api.requests.getDetailForCustomer,
    isValidId ? { id: id as Id<"requests"> } : "skip"
  );
  const submitQuote = useMutation(api.quotes.submit);
  const acceptQuote = useMutation(api.quotes.accept);
  const rejectQuote = useMutation(api.quotes.reject);
  const withdrawQuote = useMutation(api.quotes.withdraw);

  const [quoteFormOpen, setQuoteFormOpen] = useState(false);
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteDuration, setQuoteDuration] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [acceptingId, setAcceptingId] = useState<Id<"quotes"> | null>(null);
  const [confirmAccept, setConfirmAccept] = useState<Id<"quotes"> | null>(null);
  const [confirmReject, setConfirmReject] = useState<Id<"quotes"> | null>(null);

  const handleSubmitQuote = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!quotePrice || !quoteDuration || !quoteMessage) return;

      setSubmitting(true);
      try {
        await submitQuote({
          requestId: id as Id<"requests">,
          price: Number(quotePrice),
          estimatedDuration: quoteDuration,
          message: quoteMessage,
        });
        setQuoteFormOpen(false);
        setQuotePrice("");
        setQuoteDuration("");
        setQuoteMessage("");
      } catch (error) {
        console.error("Failed to submit quote:", error);
      } finally {
        setSubmitting(false);
      }
    },
    [id, quotePrice, quoteDuration, quoteMessage, submitQuote]
  );

  const handleAccept = useCallback(
    async (quoteId: Id<"quotes">) => {
      setAcceptingId(quoteId);
      try {
        await acceptQuote({ quoteId });
        setConfirmAccept(null);
      } catch (error) {
        console.error("Failed to accept quote:", error);
      } finally {
        setAcceptingId(null);
      }
    },
    [acceptQuote]
  );

  const handleReject = useCallback(
    async (quoteId: Id<"quotes">) => {
      try {
        await rejectQuote({ quoteId });
        setConfirmReject(null);
      } catch (error) {
        console.error("Failed to reject quote:", error);
      }
    },
    [rejectQuote]
  );

  const handleWithdraw = useCallback(
    async (quoteId: Id<"quotes">) => {
      try {
        await withdrawQuote({ quoteId });
      } catch (error) {
        console.error("Failed to withdraw quote:", error);
      }
    },
    [withdrawQuote]
  );

  if (request === undefined && isValidId) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                الطلب غير موجود
              </h2>
              <Link href="/dashboard/requests">
                <Button variant="primary" size="sm">
                  العودة للطلبات
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingQuotes = request.quotes.filter((q) => q.status === "pending");
  const otherQuotes = request.quotes.filter((q) => q.status !== "pending");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={request.isOwner ? "/dashboard/requests" : "/dashboard/browse-requests"}
          className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">
              {request.title}
            </h1>
            <Badge variant={statusVariants[request.status] ?? "default"}>
              {statusLabels[request.status] ?? request.status}
            </Badge>
          </div>
          <p className="text-neutral-500 mt-1">
            بواسطة {request.customerName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardContent>
              <h2 className="text-lg font-semibold text-foreground mb-3">
                تفاصيل الطلب
              </h2>
              <p className="text-neutral-600 whitespace-pre-wrap leading-relaxed">
                {request.description}
              </p>
            </CardContent>
          </Card>

          {/* Photos */}
          {request.photoUrls && request.photoUrls.length > 0 && (
            <Card>
              <CardContent>
                <h2 className="text-lg font-semibold text-foreground mb-3">
                  الصور المرفقة
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {request.photoUrls.map((url, i) => (
                    <div
                      key={i}
                      className="relative rounded-xl overflow-hidden aspect-square"
                    >
                      <Image
                        src={url}
                        alt={`صورة ${i + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quotes section (customer view) */}
          {request.isOwner && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                عروض الأسعار ({request.quotes.length})
              </h2>

              {request.quotes.length === 0 ? (
                <Card>
                  <CardContent>
                    <div className="text-center py-8">
                      <MessageSquareQuote className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
                      <p className="text-neutral-500">
                        لم يتم استلام عروض أسعار بعد
                      </p>
                      <p className="text-sm text-neutral-400 mt-1">
                        سيتواصل معك الحرفيون قريباً
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Pending quotes first */}
                  {pendingQuotes.map((quote) => (
                    <Card key={quote._id}>
                      <CardContent>
                        <div className="flex items-start gap-4">
                          <Avatar
                            src={quote.providerAvatar}
                            alt={quote.providerName}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-foreground">
                                {quote.providerName}
                              </p>
                              <Badge variant={quoteStatusVariants[quote.status]}>
                                {quoteStatusLabels[quote.status]}
                              </Badge>
                            </div>

                            <p className="text-sm text-neutral-600 mb-3">
                              {quote.message}
                            </p>

                            <div className="flex flex-wrap items-center gap-4 text-sm mb-3">
                              <span className="flex items-center gap-1.5 font-semibold text-primary-600">
                                <Banknote className="h-4 w-4" />
                                {quote.price} د.أ
                              </span>
                              <span className="flex items-center gap-1.5 text-neutral-500">
                                <Clock className="h-4 w-4" />
                                {quote.estimatedDuration}
                              </span>
                            </div>

                            {quote.status === "pending" && request.status === "open" && (
                              <div className="flex gap-2">
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => setConfirmAccept(quote._id)}
                                  disabled={acceptingId !== null}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  قبول العرض
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setConfirmReject(quote._id)}
                                  className="text-error hover:bg-error-light"
                                >
                                  <XCircle className="h-4 w-4" />
                                  رفض
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Other quotes (accepted, rejected, withdrawn) */}
                  {otherQuotes.map((quote) => (
                    <Card key={quote._id} className="opacity-75">
                      <CardContent>
                        <div className="flex items-start gap-4">
                          <Avatar
                            src={quote.providerAvatar}
                            alt={quote.providerName}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-foreground">
                                {quote.providerName}
                              </p>
                              <Badge variant={quoteStatusVariants[quote.status]}>
                                {quoteStatusLabels[quote.status]}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="font-semibold text-neutral-600">
                                {quote.price} د.أ
                              </span>
                              <span className="text-neutral-500">
                                {quote.estimatedDuration}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Provider's quote section */}
          {request.isProvider && !request.isOwner && (
            <div className="space-y-4">
              {request.myQuote ? (
                <Card>
                  <CardContent>
                    <h2 className="text-lg font-semibold text-foreground mb-3">
                      عرضك
                    </h2>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={quoteStatusVariants[request.myQuote.status]}>
                        {quoteStatusLabels[request.myQuote.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-600 mb-3">
                      {request.myQuote.message}
                    </p>
                    <div className="flex items-center gap-4 text-sm mb-3">
                      <span className="flex items-center gap-1.5 font-semibold text-primary-600">
                        <Banknote className="h-4 w-4" />
                        {request.myQuote.price} د.أ
                      </span>
                      <span className="flex items-center gap-1.5 text-neutral-500">
                        <Clock className="h-4 w-4" />
                        {request.myQuote.estimatedDuration}
                      </span>
                    </div>
                    {request.myQuote.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleWithdraw(request.myQuote!._id)}
                        className="text-error hover:bg-error-light"
                      >
                        <Trash2 className="h-4 w-4" />
                        سحب العرض
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                request.status === "open" && (
                  <Card className="border-primary-200 bg-primary-50/50">
                    <CardContent>
                      <div className="text-center py-4">
                        <Send className="h-10 w-10 text-primary-500 mx-auto mb-2" />
                        <h3 className="font-semibold text-foreground mb-1">
                          هل تريد تقديم عرض سعر؟
                        </h3>
                        <p className="text-sm text-neutral-500 mb-4">
                          قدّم عرضك مع تفاصيل السعر والمدة المتوقعة
                        </p>
                        <Button
                          variant="primary"
                          onClick={() => setQuoteFormOpen(true)}
                        >
                          <Send className="h-4 w-4" />
                          تقديم عرض سعر
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent>
              <h3 className="font-semibold text-foreground mb-3">
                معلومات الطلب
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">التصنيف</span>
                  <Badge variant="default">{request.categoryNameAr}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">المدينة</span>
                  <span className="flex items-center gap-1 text-foreground">
                    <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                    {cityLabels[request.city] ?? request.city}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">الميزانية</span>
                  <span className="font-semibold text-foreground">
                    {request.budgetMin} - {request.budgetMax} د.أ
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">عدد العروض</span>
                  <span className="font-semibold text-foreground">
                    {request.quotes.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quote submission modal */}
      <Modal
        isOpen={quoteFormOpen}
        onClose={() => setQuoteFormOpen(false)}
        title="تقديم عرض سعر"
      >
        <form onSubmit={handleSubmitQuote} className="space-y-4">
          <Input
            id="quote-price"
            label="السعر (د.أ)"
            type="number"
            min="0"
            step="0.5"
            value={quotePrice}
            onChange={(e) => setQuotePrice(e.target.value)}
            placeholder="0"
            required
            dir="ltr"
          />

          <Input
            id="quote-duration"
            label="المدة المتوقعة"
            value={quoteDuration}
            onChange={(e) => setQuoteDuration(e.target.value)}
            placeholder="مثال: 2-3 أيام"
            required
          />

          <Textarea
            id="quote-message"
            label="رسالتك للعميل"
            value={quoteMessage}
            onChange={(e) => setQuoteMessage(e.target.value)}
            placeholder="اشرح لماذا أنت الأنسب لهذا العمل..."
            rows={4}
            required
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={submitting}
              disabled={submitting}
              className="flex-1"
            >
              <Send className="h-4 w-4" />
              إرسال العرض
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setQuoteFormOpen(false)}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>

      {/* Accept confirmation modal */}
      <Modal
        isOpen={confirmAccept !== null}
        onClose={() => setConfirmAccept(null)}
        title="قبول العرض"
      >
        <p className="text-neutral-600 mb-6">
          هل أنت متأكد من قبول هذا العرض؟ سيتم رفض جميع العروض الأخرى تلقائياً
          وإنشاء مهمة عمل جديدة.
        </p>
        <div className="flex gap-3">
          <Button
            variant="primary"
            onClick={() => confirmAccept && handleAccept(confirmAccept)}
            isLoading={acceptingId !== null}
            disabled={acceptingId !== null}
            className="flex-1"
          >
            <CheckCircle2 className="h-4 w-4" />
            تأكيد القبول
          </Button>
          <Button variant="ghost" onClick={() => setConfirmAccept(null)}>
            إلغاء
          </Button>
        </div>
      </Modal>

      {/* Reject confirmation modal */}
      <Modal
        isOpen={confirmReject !== null}
        onClose={() => setConfirmReject(null)}
        title="رفض العرض"
      >
        <p className="text-neutral-600 mb-6">
          هل أنت متأكد من رفض هذا العرض؟
        </p>
        <div className="flex gap-3">
          <Button
            variant="danger"
            onClick={() => confirmReject && handleReject(confirmReject)}
            className="flex-1"
          >
            <XCircle className="h-4 w-4" />
            تأكيد الرفض
          </Button>
          <Button variant="ghost" onClick={() => setConfirmReject(null)}>
            إلغاء
          </Button>
        </div>
      </Modal>
    </div>
  );
}
