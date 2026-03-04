"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Id } from "@/convex/_generated/dataModel";
import * as m from "motion/react-client";
import { AnimatePresence } from "motion/react";
import {
  Send,
  ImagePlus,
  X,
  Maximize2,
} from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import { compressImage } from "@/lib/image-compress";
import { getErrorMessage } from "@/lib/utils";

interface JobChatProps {
  jobId: Id<"jobs">;
  isChatEligible: boolean;
}

export function JobChat({ jobId, isChatEligible }: JobChatProps) {
  const messages = useQuery(api.messages.listByJob, { jobId });
  const sendMessage = useMutation(api.messages.send);
  const sendImage = useMutation(api.messages.sendImage);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    try {
      await sendMessage({ jobId, content: trimmed });
      setText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (err: unknown) {
      alert(getErrorMessage(err, "حدث خطأ في إرسال الرسالة"));
    } finally {
      setIsSending(false);
    }
  }, [text, isSending, sendMessage, jobId]);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("يرجى اختيار ملف صورة");
        return;
      }

      // Validate size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert("حجم الصورة يجب أن لا يتجاوز 5 ميجابايت");
        return;
      }

      setIsUploading(true);
      try {
        const compressed = await compressImage(file, {
          maxWidth: 1000,
          maxHeight: 1000,
          quality: 0.8,
        });
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": "image/webp" },
          body: compressed,
        });
        const { storageId } = await result.json();
        await sendImage({
          jobId,
          imageStorageId: storageId as Id<"_storage">,
        });
      } catch (err: unknown) {
        alert(getErrorMessage(err, "حدث خطأ في رفع الصورة"));
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [generateUploadUrl, sendImage, jobId]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  if (!isChatEligible) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
          <Send className="h-7 w-7 text-neutral-300" />
        </div>
        <p className="text-neutral-500 text-sm">
          ستتمكن من المراسلة بعد تقديم عرض أو إرسال طلب مباشر
        </p>
      </div>
    );
  }

  if (messages === undefined) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px]">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mb-3">
              <Send className="h-6 w-6 text-primary-300" />
            </div>
            <p className="text-neutral-400 text-sm">
              ابدأ المحادثة مع الطرف الآخر
            </p>
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => {
                const showAvatar =
                  i === 0 || messages[i - 1].senderId !== msg.senderId;
                const showTime =
                  i === messages.length - 1 ||
                  messages[i + 1].senderId !== msg.senderId ||
                  messages[i + 1]._creationTime - msg._creationTime > 5 * 60 * 1000;

                return (
                  <m.div
                    key={msg._id}
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={`flex ${msg.isMe ? "flex-row-reverse" : "flex-row"} items-end gap-2 ${showAvatar ? "mt-4" : "mt-0.5"}`}
                  >
                    {/* Avatar */}
                    <div className="w-8 shrink-0">
                      {showAvatar && (
                        <Avatar
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          size="sm"
                        />
                      )}
                    </div>

                    {/* Bubble */}
                    <div className={`max-w-[75%] ${msg.isMe ? "items-end" : "items-start"} flex flex-col`}>
                      {showAvatar && (
                        <span className={`text-[11px] text-neutral-400 mb-1 ${msg.isMe ? "text-left" : "text-right"}`}>
                          {msg.senderName}
                        </span>
                      )}

                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words ${
                          msg.isMe
                            ? "bg-primary-500 text-white rounded-bl-md"
                            : "bg-neutral-100 text-foreground rounded-br-md"
                        }`}
                      >
                        {/* Image */}
                        {msg.imageUrl && (
                          <button
                            onClick={() => setPreviewImage(msg.imageUrl)}
                            className="block mb-2 relative rounded-xl overflow-hidden group cursor-pointer"
                          >
                            <Image
                              src={msg.imageUrl}
                              alt="صورة"
                              width={280}
                              height={200}
                              className="object-cover rounded-xl max-h-[200px] w-auto"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <Maximize2 className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        )}

                        {/* Text */}
                        {msg.content && (
                          <p className="whitespace-pre-line">{msg.content}</p>
                        )}
                      </div>

                      {showTime && (
                        <span className={`text-[10px] text-neutral-400 mt-1 ${msg.isMe ? "text-left" : "text-right"}`}>
                          {new Date(msg._creationTime).toLocaleTimeString("ar-JO", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                  </m.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-end gap-2">
          {/* Image Upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="shrink-0 p-2.5 rounded-xl text-neutral-400 hover:text-primary-500 hover:bg-primary-50 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="إرفاق صورة"
          >
            {isUploading ? (
              <Spinner size="sm" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
          </button>

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالة..."
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 transition-colors"
            dir="rtl"
          />

          {/* Send Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSend}
            disabled={!text.trim() || isSending}
            className="shrink-0 !rounded-xl !p-2.5"
          >
            <Send className="h-4.5 w-4.5" />
          </Button>
        </div>
      </div>

      {/* Image Preview Lightbox */}
      <AnimatePresence>
        {previewImage && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 left-4 text-white p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="h-6 w-6" />
            </button>
            <m.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Image
                src={previewImage}
                alt="صورة مكبرة"
                width={900}
                height={600}
                className="max-w-full max-h-[85vh] object-contain rounded-xl"
              />
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
