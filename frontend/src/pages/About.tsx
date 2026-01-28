import { useNavigate } from "react-router-dom";
import { FileText, ArrowLeft, Zap, Shield, BarChart3, Globe, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const About = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: Zap,
            title: "Lightning Fast",
            description: "Upload PDFs and get shareable links in seconds. No complex setup required."
        },
        {
            icon: BarChart3,
            title: "Powerful Analytics",
            description: "Track page views, reading time, scroll depth, and engagement with detailed heatmaps."
        },
        {
            icon: Shield,
            title: "Secure & Private",
            description: "Your documents are encrypted and stored securely. Auto-delete ensures privacy."
        },
        {
            icon: Globe,
            title: "Share Anywhere",
            description: "Generate clean, professional links that work anywhere - email, social, or web."
        },
        {
            icon: Clock,
            title: "Real-time Insights",
            description: "See who's viewing your documents as it happens with live analytics."
        },
        {
            icon: Users,
            title: "No Signup Required",
            description: "Start sharing immediately. Create an account only if you want analytics."
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

            {/* Hero Section */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                        About YeetPDF
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        The simplest way to share PDFs and understand how people engage with your documents.
                    </p>
                </div>

                {/* Mission */}
                <section className="mb-16">
                    <div className="premium-card p-8 text-center">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">Our Mission</h2>
                        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                            We believe sharing documents should be effortless, and understanding engagement shouldn't require expensive enterprise tools. YeetPDF makes it easy for anyone to share PDFs professionally and gain valuable insights into how their content is consumed.
                        </p>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="mb-16">
                    <h2 className="text-2xl font-semibold text-foreground text-center mb-8">
                        Why Choose YeetPDF?
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-shadow"
                            >
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                    <feature.icon className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Use Cases */}
                <section className="mb-16">
                    <h2 className="text-2xl font-semibold text-foreground text-center mb-8">
                        Perfect For
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-6 rounded-xl border border-border bg-card">
                            <h3 className="text-lg font-semibold text-foreground mb-3">📄 Sales Teams</h3>
                            <p className="text-muted-foreground">
                                Share proposals and track when prospects read them. Know exactly which pages get attention.
                            </p>
                        </div>
                        <div className="p-6 rounded-xl border border-border bg-card">
                            <h3 className="text-lg font-semibold text-foreground mb-3">💼 Job Seekers</h3>
                            <p className="text-muted-foreground">
                                Send your resume and get notified when recruiters view it. Stand out from the crowd.
                            </p>
                        </div>
                        <div className="p-6 rounded-xl border border-border bg-card">
                            <h3 className="text-lg font-semibold text-foreground mb-3">🎓 Educators</h3>
                            <p className="text-muted-foreground">
                                Distribute course materials and see which sections students spend the most time on.
                            </p>
                        </div>
                        <div className="p-6 rounded-xl border border-border bg-card">
                            <h3 className="text-lg font-semibold text-foreground mb-3">🏢 Consultants</h3>
                            <p className="text-muted-foreground">
                                Share reports with clients and demonstrate engagement with data-backed insights.
                            </p>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="text-center">
                    <div className="premium-card p-8">
                        <h2 className="text-2xl font-semibold text-foreground mb-4">
                            Ready to get started?
                        </h2>
                        <p className="text-muted-foreground mb-6">
                            Upload your first PDF and see how easy document sharing can be.
                        </p>
                        <Button variant="premium" size="lg" onClick={() => navigate("/")}>
                            Try YeetPDF Free
                        </Button>
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

export default About;
