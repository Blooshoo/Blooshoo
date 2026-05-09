import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with blooshoo",
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="content-block">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight font-heading">
            Contact
          </h1>
          <p className="text-muted-foreground mt-2">
            Drop me a line. I&apos;ll get back to you when I can.
          </p>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
