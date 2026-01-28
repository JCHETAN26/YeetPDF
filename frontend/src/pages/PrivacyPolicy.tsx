import { useNavigate } from "react-router-dom";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
    const navigate = useNavigate();

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
                <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
                <p className="text-muted-foreground mb-8">Last updated: January 28, 2025</p>

                <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            YeetPDF ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our PDF sharing and analytics service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
                        <div className="space-y-4 text-muted-foreground">
                            <div>
                                <h3 className="text-lg font-medium text-foreground">2.1 Information You Provide</h3>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>PDF files you upload to our service</li>
                                    <li>Account information when you sign in with Google (email, name, profile picture)</li>
                                    <li>Custom link names you create for your documents</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-foreground">2.2 Automatically Collected Information</h3>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>Analytics data: page views, time spent on pages, scroll depth</li>
                                    <li>Device information: browser type, operating system</li>
                                    <li>IP addresses and approximate geographic location</li>
                                    <li>Referral sources and timestamps</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li>To provide and maintain our PDF sharing service</li>
                            <li>To generate analytics and insights about document engagement</li>
                            <li>To improve our service and user experience</li>
                            <li>To communicate with you about service updates</li>
                            <li>To detect and prevent fraud or abuse</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">4. Data Storage and Security</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Your PDF files are stored securely using Amazon Web Services (AWS) S3 with encryption at rest. We implement industry-standard security measures to protect your data. Documents are automatically deleted after 7 days unless you have an active account.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Sharing</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We do not sell your personal information. We may share data with:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                            <li>Service providers (AWS, Supabase) who help operate our service</li>
                            <li>Analytics partners to improve our service</li>
                            <li>Law enforcement when required by law</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">6. Your Rights</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            You have the right to:
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                            <li>Access your personal data</li>
                            <li>Request deletion of your data</li>
                            <li>Opt out of analytics tracking</li>
                            <li>Export your data</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">7. Cookies</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We use essential cookies to maintain your session and preferences. Analytics cookies help us understand how visitors use our service. You can control cookie preferences in your browser settings.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">8. Children's Privacy</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">9. Changes to This Policy</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">10. Contact Us</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            If you have questions about this Privacy Policy, please contact us at{" "}
                            <a href="mailto:privacy@yeetpdf.com" className="text-primary hover:underline">
                                privacy@yeetpdf.com
                            </a>
                        </p>
                    </section>
                </div>
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

export default PrivacyPolicy;
