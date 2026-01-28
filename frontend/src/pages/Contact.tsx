import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, ArrowLeft, Mail, MessageSquare, HelpCircle, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Contact = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1000));

        setIsSubmitting(false);
        setIsSubmitted(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
    };

    const contactMethods = [
        {
            icon: Mail,
            title: "Email",
            description: "For general inquiries",
            value: "support@yeetpdf.com",
            href: "mailto:support@yeetpdf.com"
        },
        {
            icon: HelpCircle,
            title: "Help Center",
            description: "FAQs and guides",
            value: "Coming Soon",
            href: "#"
        },
        {
            icon: MessageSquare,
            title: "Feedback",
            description: "Share your ideas",
            value: "feedback@yeetpdf.com",
            href: "mailto:feedback@yeetpdf.com"
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="w-full py-4 px-6 border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
                        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-xl">YeetPDF</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-foreground mb-4">Contact Us</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Have a question or feedback? We'd love to hear from you.
                    </p>
                </div>

                {/* Contact Methods */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    {contactMethods.map((method, index) => (
                        <a
                            key={index}
                            href={method.href}
                            className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all hover:border-primary/50"
                        >
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                <method.icon className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-1">
                                {method.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                                {method.description}
                            </p>
                            <p className="text-sm text-primary font-medium">
                                {method.value}
                            </p>
                        </a>
                    ))}
                </div>

                {/* Contact Form */}
                <div className="premium-card p-8">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 text-center">
                        Send us a message
                    </h2>

                    {isSubmitted ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                Message Sent!
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                Thank you for reaching out. We'll get back to you as soon as possible.
                            </p>
                            <Button variant="outline" onClick={() => setIsSubmitted(false)}>
                                Send Another Message
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="Your name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                    id="subject"
                                    placeholder="What's this about?"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Message</Label>
                                <textarea
                                    id="message"
                                    placeholder="Tell us more..."
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    required
                                    rows={5}
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                />
                            </div>

                            <Button
                                type="submit"
                                variant="premium"
                                size="lg"
                                className="w-full"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    "Sending..."
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Message
                                    </>
                                )}
                            </Button>
                        </form>
                    )}
                </div>

                {/* FAQ Preview */}
                <section className="mt-16">
                    <h2 className="text-2xl font-semibold text-foreground text-center mb-8">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: "How long are my PDFs stored?",
                                a: "Guest uploads are stored for 7 days. Signed-in users have extended storage periods."
                            },
                            {
                                q: "Is there a file size limit?",
                                a: "Yes, files up to 50MB are supported per upload."
                            },
                            {
                                q: "Can I see who viewed my PDF?",
                                a: "With an account, you can see view counts, locations, and engagement analytics. Individual viewer identification is available with email-gated links."
                            },
                            {
                                q: "Is my data secure?",
                                a: "Yes, all files are encrypted at rest and in transit. We use industry-standard security practices."
                            }
                        ].map((faq, index) => (
                            <div key={index} className="p-4 rounded-lg border border-border">
                                <h3 className="font-medium text-foreground mb-2">{faq.q}</h3>
                                <p className="text-sm text-muted-foreground">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-border mt-16 py-8 px-6">
                <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
                    © 2025 YeetPDF. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default Contact;
