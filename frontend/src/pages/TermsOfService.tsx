import { useNavigate } from "react-router-dom";
import { FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
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
                <h1 className="text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
                <p className="text-muted-foreground mb-8">Last updated: January 28, 2025</p>

                <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            By accessing or using YeetPDF ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            YeetPDF is a PDF sharing and analytics platform that allows users to upload PDF documents, generate shareable links, and track engagement analytics including page views, time spent, and reader behavior.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Accounts</h2>
                        <div className="space-y-4 text-muted-foreground">
                            <p>
                                You may use YeetPDF without an account for basic PDF sharing. Creating an account (via Google Sign-In) provides additional features including:
                            </p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Persistent document storage</li>
                                <li>Access to analytics dashboard</li>
                                <li>Document management features</li>
                            </ul>
                            <p>
                                You are responsible for maintaining the security of your account and for all activities that occur under your account.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">4. Acceptable Use</h2>
                        <p className="text-muted-foreground mb-4">You agree NOT to use YeetPDF to:</p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li>Upload or share illegal, harmful, or offensive content</li>
                            <li>Distribute malware, viruses, or malicious code</li>
                            <li>Infringe on intellectual property rights of others</li>
                            <li>Share confidential information without authorization</li>
                            <li>Engage in spam or unsolicited distribution</li>
                            <li>Attempt to circumvent security measures</li>
                            <li>Use automated systems to abuse the service</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">5. Content Ownership</h2>
                        <div className="space-y-4 text-muted-foreground">
                            <p>
                                <strong className="text-foreground">Your Content:</strong> You retain all ownership rights to the PDF documents you upload. By uploading content, you grant YeetPDF a limited license to store and serve your documents to viewers you share links with.
                            </p>
                            <p>
                                <strong className="text-foreground">Our Content:</strong> The YeetPDF service, including its design, features, and branding, is owned by YeetPDF and protected by intellectual property laws.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">6. Document Retention</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Documents uploaded by guests are automatically deleted after 7 days. Registered users may have extended retention periods. We reserve the right to remove content that violates these terms or applicable laws.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">7. Privacy</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Your privacy is important to us. Please review our{" "}
                            <a href="/privacy" className="text-primary hover:underline">
                                Privacy Policy
                            </a>{" "}
                            to understand how we collect, use, and protect your information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">8. Disclaimer of Warranties</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">9. Limitation of Liability</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            TO THE MAXIMUM EXTENT PERMITTED BY LAW, YEETPDF SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">10. Termination</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We reserve the right to suspend or terminate your access to the Service at any time for violations of these terms or for any other reason at our discretion.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">11. Changes to Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We may modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">12. Contact</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            For questions about these Terms, please contact us at{" "}
                            <a href="mailto:legal@yeetpdf.com" className="text-primary hover:underline">
                                legal@yeetpdf.com
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

export default TermsOfService;
