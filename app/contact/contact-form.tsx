"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);

  useEffect(() => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      message: formData.get("message") as string,
      honeypot: formData.get("website") as string, // hidden honeypot field
      num1,
      num2,
      answer: parseInt(formData.get("mathAnswer") as string, 10)
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Failed to send message");
      } else {
        toast.success("Message sent successfully!");
        setSuccess(true);
        (e.target as HTMLFormElement).reset();
        // Reset math challenge
        setNum1(Math.floor(Math.random() * 10) + 1);
        setNum2(Math.floor(Math.random() * 10) + 1);
      }
    } catch (err) {
      toast.error("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="p-6 bg-primary/10 text-primary border border-primary/20 rounded-lg text-center mt-6">
        <h3 className="font-semibold text-lg mb-2">Thanks for reaching out!</h3>
        <p>Your message has been sent successfully. I will get back to you soon.</p>
        <button 
          onClick={() => setSuccess(false)}
          className="mt-4 text-sm font-medium underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mt-6">
      {/* Honeypot Field - hidden from users */}
      <div style={{ display: "none" }} aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <label
          htmlFor="name"
          className="text-sm font-medium text-foreground"
        >
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          placeholder="Your name"
          className="w-full px-3 py-2 rounded-md border border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="text-sm font-medium text-foreground"
        >
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          placeholder="you@example.com"
          className="w-full px-3 py-2 rounded-md border border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Message */}
      <div className="space-y-1.5">
        <label
          htmlFor="message"
          className="text-sm font-medium text-foreground"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="What&apos;s on your mind?"
          className="w-full px-3 py-2 rounded-md border border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors resize-y"
        />
      </div>

      {/* Anti-Bot Math Challenge */}
      <div className="space-y-1.5">
        <label
          htmlFor="mathAnswer"
          className="text-sm font-medium text-foreground"
        >
          Anti-Bot Check: What is {num1} + {num2}?
        </label>
        <input
          type="number"
          id="mathAnswer"
          name="mathAnswer"
          required
          placeholder="Enter the sum"
          className="w-full px-3 py-2 rounded-md border border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || num1 === 0} // num1 is 0 only during initial SSR
        className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
