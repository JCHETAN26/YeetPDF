import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  AlertCircle,
  Zap,
  Eye,
  Shield,
  Clock,
  BarChart3,
  Users,
  Star,
  ArrowRight,
  Layers,
  X,
  GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/UserMenu";
import { UploadDialog } from "@/components/UploadDialog";
import { MergeDialog } from "@/components/MergeDialog";
import { useAuth } from "@/contexts/AuthContext";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Merge mode state
  const [isMergeMode, setIsMergeMode] = useState(false);
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [showMergeDialog, setShowMergeDialog] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validatePDFFile = (file: File): string | null => {
    if (file.type !== "application/pdf") {
      return "Please upload a PDF file";
    }
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return `File size exceeds 50MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB`;
    }
    return null;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const files = Array.from(e.dataTransfer.files);

    if (isMergeMode) {
      // Merge mode: accept multiple files
      const validFiles: File[] = [];
      for (const file of files) {
        const error = validatePDFFile(file);
        if (error) {
          setError(error);
          return;
        }
        validFiles.push(file);
      }
      const newMergeFiles = [...mergeFiles, ...validFiles].slice(0, 10);
      setMergeFiles(newMergeFiles);
      if (newMergeFiles.length >= 2) {
        setShowMergeDialog(true);
      }
    } else {
      // Single mode
      if (files.length > 0) {
        const file = files[0];
        const error = validatePDFFile(file);
        if (error) {
          setError(error);
          return;
        }
        setSelectedFile(file);
        setShowUploadDialog(true);
      }
    }
  }, [isMergeMode, mergeFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (isMergeMode) {
      // Merge mode: accept multiple files
      const validFiles: File[] = [];
      for (const file of Array.from(files)) {
        const error = validatePDFFile(file);
        if (error) {
          setError(error);
          return;
        }
        validFiles.push(file);
      }
      const newMergeFiles = [...mergeFiles, ...validFiles].slice(0, 10);
      setMergeFiles(newMergeFiles);
      if (newMergeFiles.length >= 2) {
        setShowMergeDialog(true);
      }
    } else {
      // Single mode
      const file = files[0];
      const error = validatePDFFile(file);
      if (error) {
        setError(error);
        return;
      }
      setSelectedFile(file);
      setShowUploadDialog(true);
    }

    // Reset input
    e.target.value = '';
  }, [isMergeMode, mergeFiles]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="w-full py-4 px-6 border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">YeetPDF</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
            {user && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                My Documents
              </Button>
            )}
          </nav>
          <UserMenu />
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-16 md:py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-in">
              <Zap className="w-4 h-4" />
              Free PDF sharing with analytics
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 tracking-tight text-balance animate-fade-in">
              Share PDFs instantly.
              <br />
              <span className="text-primary">Track every view.</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.1s" }}>
              The fastest way to share documents online. Drop a PDF, get a link,
              see who reads what. No signup required.
            </p>

            {/* Mode Toggle */}
            <div className="flex items-center justify-center gap-2 mb-8 animate-fade-in" style={{ animationDelay: "0.15s" }}>
              <button
                onClick={() => {
                  setIsMergeMode(false);
                  setMergeFiles([]);
                  setError(null);
                }}
                className={`px-4 py-2 rounded-l-lg text-sm font-medium transition-all ${!isMergeMode
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Single PDF
              </button>
              <button
                onClick={() => {
                  setIsMergeMode(true);
                  setError(null);
                }}
                className={`px-4 py-2 rounded-r-lg text-sm font-medium transition-all ${isMergeMode
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Layers className="w-4 h-4 inline mr-2" />
                Merge PDFs
              </button>
            </div>

            {/* Upload Zone */}
            <div
              className={`upload-zone p-10 sm:p-14 max-w-xl mx-auto animate-slide-up ${isDragging ? "active" : ""} ${error ? "border-destructive" : ""}`}
              style={{ animationDelay: "0.2s" }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf,application/pdf"
                multiple={isMergeMode}
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              <div className="flex flex-col items-center gap-5">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${error ? "bg-destructive/10" :
                  isDragging ? "scale-110 bg-primary/10" : "bg-accent"
                  }`}>
                  {error ? (
                    <AlertCircle className="w-7 h-7 text-destructive" />
                  ) : isMergeMode ? (
                    <Layers className={`w-7 h-7 transition-colors duration-300 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                  ) : (
                    <Upload className={`w-7 h-7 transition-colors duration-300 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                  )}
                </div>

                <div className="space-y-2 text-center">
                  {error ? (
                    <>
                      <p className="text-lg font-medium text-destructive">{error}</p>
                      <p className="text-sm text-muted-foreground">Try uploading a different file</p>
                    </>
                  ) : isMergeMode ? (
                    <>
                      <p className="text-lg font-medium text-foreground">
                        Drop multiple PDFs here
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Select 2-10 files to merge • Up to 50MB each
                      </p>
                      {mergeFiles.length > 0 && (
                        <p className="text-sm font-medium text-primary">
                          {mergeFiles.length} file{mergeFiles.length > 1 ? 's' : ''} selected
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-medium text-foreground">
                        Drop your PDF here
                      </p>
                      <p className="text-sm text-muted-foreground">
                        or click to browse • Up to 50MB
                      </p>
                    </>
                  )}
                </div>

                {!error && (
                  <Button variant="premium" size="lg" className="mt-2 pointer-events-none">
                    {isMergeMode ? (
                      <>
                        <Layers className="w-4 h-4 mr-2" />
                        Select Files to Merge
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Select PDF File
                      </>
                    )}
                  </Button>
                )}

                {error && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="mt-2"
                    onClick={() => setError(null)}
                  >
                    Try Again
                  </Button>
                )}
              </div>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span>No signup required</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <span>No watermarks</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>Auto-deletes in 7 days</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-y border-border bg-muted/30">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-foreground">2M+</div>
                <div className="text-sm text-muted-foreground mt-1">PDFs Shared</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">10M+</div>
                <div className="text-sm text-muted-foreground mt-1">Page Views Tracked</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">150+</div>
                <div className="text-sm text-muted-foreground mt-1">Countries</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-foreground">4.9★</div>
                <div className="text-sm text-muted-foreground mt-1">User Rating</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                More than just file sharing
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                YeetPDF gives you powerful analytics that show exactly how your documents perform
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="premium-card p-6 hover-lift">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Lightning Fast Uploads
                </h3>
                <p className="text-muted-foreground">
                  Upload files up to 50MB and get a shareable link in under 3 seconds. No account, no friction.
                </p>
              </div>

              <div className="premium-card p-6 hover-lift">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Page-Level Heatmaps
                </h3>
                <p className="text-muted-foreground">
                  See which pages get read the most. Understand engagement with detailed per-page analytics.
                </p>
              </div>

              <div className="premium-card p-6 hover-lift">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Clean Viewing Experience
                </h3>
                <p className="text-muted-foreground">
                  Recipients see your PDF without watermarks, branding, or distractions. Just your content.
                </p>
              </div>

              <div className="premium-card p-6 hover-lift">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Visitor Insights
                </h3>
                <p className="text-muted-foreground">
                  Track unique visitors, session duration, and completion rates. Know who's reading.
                </p>
              </div>

              <div className="premium-card p-6 hover-lift">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Privacy First
                </h3>
                <p className="text-muted-foreground">
                  Links auto-expire after 7 days. Your documents don't live on our servers forever.
                </p>
              </div>

              <div className="premium-card p-6 hover-lift">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Real-Time Analytics
                </h3>
                <p className="text-muted-foreground">
                  Watch views come in as they happen. Get notified when someone opens your document.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Share a PDF in 10 seconds
              </h2>
              <p className="text-lg text-muted-foreground">
                It's really that simple. No signup, no credit card.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Drop your PDF
                </h3>
                <p className="text-muted-foreground">
                  Drag and drop or click to upload. Supports files up to 50MB.
                </p>
              </div>

              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Get your link
                </h3>
                <p className="text-muted-foreground">
                  Instantly receive a unique shareable URL. Copy it or share directly.
                </p>
              </div>

              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Track engagement
                </h3>
                <p className="text-muted-foreground">
                  See who viewed your PDF, which pages they read, and for how long.
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <Button
                variant="premium"
                size="lg"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Start Sharing Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Perfect for professionals
              </h2>
              <p className="text-lg text-muted-foreground">
                Join thousands who use YeetPDF to share and track their documents
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="premium-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Sales Teams</h3>
                <p className="text-muted-foreground">
                  Track which pages of your proposals get the most attention. Follow up at the right time.
                </p>
              </div>
              <div className="premium-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Job Seekers</h3>
                <p className="text-muted-foreground">
                  Know when your resume gets viewed. See if they made it to your portfolio section.
                </p>
              </div>
              <div className="premium-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Educators</h3>
                <p className="text-muted-foreground">
                  Share course materials and see which sections students engage with most.
                </p>
              </div>
              <div className="premium-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Startups</h3>
                <p className="text-muted-foreground">
                  Share pitch decks with investors and track engagement before your next meeting.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-20 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <blockquote className="text-2xl md:text-3xl font-medium text-foreground mb-6 text-balance">
              "Finally, a PDF sharing tool that tells me if my proposal was actually read.
              The heatmap feature is a game-changer for our sales team."
            </blockquote>
            <div className="text-muted-foreground">
              <span className="font-medium text-foreground">Sarah Chen</span>
              <span className="mx-2">•</span>
              <span>VP of Sales, TechCorp</span>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-20 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ready to share smarter?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Upload your first PDF and see the analytics in action. It's free.
            </p>
            <Button
              variant="premium"
              size="lg"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Your PDF
            </Button>
          </div>
        </section>

        {/* Ad Space - Bottom Banner */}
        <section className="py-8 px-6 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <div className="premium-card p-4 text-center">
              <span className="text-xs text-muted-foreground mb-2 block">Advertisement</span>
              <div className="h-20 bg-muted/50 rounded-lg flex items-center justify-center border border-dashed border-border">
                <span className="text-sm text-muted-foreground">AdSense Leaderboard (728x90)</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold">YeetPDF</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The fastest way to share PDFs with built-in analytics.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 YeetPDF. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
              <a href="#" className="hover:text-foreground transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Upload Dialog */}
      <UploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        file={selectedFile}
      />

      {/* Merge Dialog */}
      <MergeDialog
        files={mergeFiles}
        open={showMergeDialog}
        onOpenChange={setShowMergeDialog}
        onFilesChange={setMergeFiles}
      />
    </div>
  );
};

export default LandingPage;
