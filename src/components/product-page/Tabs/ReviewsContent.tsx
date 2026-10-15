"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ReviewCard from "@/components/common/ReviewCard";
import { submitReview } from "@/lib/api/reviews";
import type { Review } from "@/types/review.types";
import { cn } from "@/lib/utils";
import { IoMdStar, IoMdStarOutline } from "react-icons/io";

const ReviewsContent = ({
  reviews,
  productId,
}: {
  reviews: Review[];
  productId: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <section>
      <div className="flex items-center justify-between flex-col sm:flex-row mb-5 sm:mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <h3 className="text-xl sm:text-2xl font-bold text-black mr-2">
            All Reviews
          </h3>
          <span className="text-sm sm:text-base text-black/60">({reviews.length})</span>
        </div>
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="sm:min-w-[166px] px-4 py-3 sm:px-5 sm:py-4 rounded-full bg-black font-medium text-xs sm:text-base h-12"
        >
          Write a Review
        </Button>
      </div>

      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5 sm:mb-9">
          {reviews.map((review) => (
            <ReviewCard key={review.id} data={review} isDate />
          ))}
        </div>
      ) : (
        <p className="text-black/50 mb-5">No reviews yet. Be the first to leave one.</p>
      )}

      <ReviewForm open={open} onOpenChange={setOpen} productId={productId} />
    </section>
  );
};

function ReviewForm({
  open,
  onOpenChange,
  productId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
}) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  // Honeypot: hidden from humans; bots that fill it are rejected.
  const [company, setCompany] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (company.trim() !== "") {
      setError("Something went wrong submitting your review.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitReview({
        product_id: productId,
        reviewer_name: name.trim(),
        rating,
        comment: comment.trim(),
      });
      setSubmitted(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Something went wrong submitting your review."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="text-center py-6">
            <p className="font-medium text-black">
              Thank you! Your review has been submitted and is pending approval.
            </p>
            <Button
              onClick={() => {
                setSubmitted(false);
                setName("");
                setComment("");
                setRating(5);
                onOpenChange(false);
              }}
              className="mt-4 rounded-full"
            >
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-black mb-1">Your name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2.5 text-sm border border-black/10 rounded-lg outline-none focus:border-black/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-black mb-1">Rating</label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    onClick={() => setRating(n)}
                  >
                    {n <= rating ? (
                      <IoMdStar className="text-2xl text-[#C9A24B]" />
                    ) : (
                      <IoMdStarOutline className="text-2xl text-black/30" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-black mb-1">Comment</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                className={cn(
                  "w-full px-3 py-2.5 text-sm border border-black/10 rounded-lg outline-none resize-none focus:border-black/30"
                )}
              />
            </div>

            {/* Honeypot field: hidden from humans. */}
            <div className="hidden" aria-hidden="true">
              <label>
                Company
                <input
                  type="text"
                  name="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 rounded-full bg-black text-white disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ReviewsContent;
