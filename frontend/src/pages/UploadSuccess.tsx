import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Check, Copy, ExternalLink, FileText, Clock, Share2, Mail, MessageCircle, Twitter, BarChart3, Link2, Eye, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

const UploadSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedAnalytics, setCopiedAnalytics] = useState(false);

  const {
    documentId,
    fileName,
    fileSize,
    pageCount,
    shareUrl,
    viewerUrl,
    analyticsUrl,
    expiresAt
  } = location.state || {
    documentId: "demo123",
    fileName: "document.pdf",
    fileSize: 1024 * 1024,
    pageCount: 12,
    shareUrl: `${window.location.origin}/v/demo123`,
    viewerUrl: "/v/demo123",
    analyticsUrl: "/analytics/demo123",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };

  // Full analytics URL
  const fullAnalyticsUrl = `${window.location.origin}${analyticsUrl}`;

  // Calculate days until expiry
  const daysRemaining = Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const handleCopyShare = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleCopyAnalytics = async () => {
    await navigator.clipboard.writeText(fullAnalyticsUrl);
    setCopiedAnalytics(true);
    setTimeout(() => setCopiedAnalytics(false), 2000);
  };

  const handleShare = async (platform: string) => {
    const text = `Check out this PDF: ${fileName}`;
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(text);

    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      email: `mailto:?subject=${encodeURIComponent(`Shared PDF: ${fileName}`)}&body=${encodedText}%0A%0A${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    };

    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({ title: fileName, text, url: shareUrl });
      } catch (err) {
        // User cancelled
      }
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full py-6 px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">YeetPDF</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 pb-20">
        <div className="w-full max-w-xl mx-auto">
          {/* Success Card */}
          <div className="premium-card p-8 sm:p-10 animate-fade-in">
            {/* Success Icon */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-primary" />
              </div>

              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Upload Complete
              </h1>

              {/* File Info */}
              <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                <span className="truncate max-w-[200px]">{fileName}</span>
                <span className="text-border">•</span>
                <span>{formatFileSize(fileSize)}</span>
                <span className="text-border">•</span>
                <span>{pageCount} pages</span>
              </div>
            </div>

            {/* Two Links Section */}
            <div className="space-y-6">
              {/* Share Link - For recipients */}
              <div className="p-5 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Link2 className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground">Share Link</h3>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-auto">
                    Send this to others
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Recipients will see a clean PDF viewer - no analytics, no distractions.
                </p>
                <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2.5 text-sm bg-transparent text-foreground outline-none font-mono"
                  />
                  <button
                    onClick={handleCopyShare}
                    className="px-3 py-2.5 hover:bg-muted transition-colors border-l border-border"
                    title="Copy to clipboard"
                  >
                    {copiedShare ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>

                {/* Quick Share Buttons */}
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-muted-foreground">Quick share:</span>
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleShare('twitter')}>
                    <Twitter className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleShare('whatsapp')}>
                    <MessageCircle className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleShare('email')}>
                    <Mail className="w-3.5 h-3.5" />
                  </Button>
                  {navigator.share && (
                    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleShare('native')}>
                      <Share2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Analytics Link - For logged-in users only */}
              {user ? (
                <div className="p-5 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground">Analytics Dashboard</h3>
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full ml-auto">
                      Keep this private
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Track views, see which pages get read, and monitor engagement.
                  </p>
                  <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background">
                    <input
                      type="text"
                      value={fullAnalyticsUrl}
                      readOnly
                      className="flex-1 px-3 py-2.5 text-sm bg-transparent text-foreground outline-none font-mono"
                    />
                    <button
                      onClick={handleCopyAnalytics}
                      className="px-3 py-2.5 hover:bg-muted transition-colors border-l border-border"
                      title="Copy to clipboard"
                    >
                      {copiedAnalytics ? (
                        <Check className="w-4 h-4 text-primary" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground">Want to see analytics?</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sign in with Google to track views, see which pages get read, and monitor engagement for all your uploads.
                  </p>
                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={(credentialResponse: CredentialResponse) => {
                        if (credentialResponse.credential) {
                          login(credentialResponse.credential);
                        }
                      }}
                      onError={() => console.error('Login failed')}
                      theme="outline"
                      size="large"
                      text="signin_with"
                      shape="rectangular"
                      width="280"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => window.open(viewerUrl, '_blank')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview PDF
              </Button>
              {user && (
                <Button
                  variant="premium"
                  size="lg"
                  className="flex-1"
                  onClick={() => navigate(analyticsUrl)}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              )}
            </div>

            {/* Expiry Notice */}
            <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Link auto-deletes in {daysRemaining} days</span>
            </div>
          </div>

          {/* Upload Another */}
          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={() => navigate("/")}>
              Upload another PDF
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UploadSuccess;
