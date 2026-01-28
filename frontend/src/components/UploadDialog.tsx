import { useState } from "react";
import { Upload, Link2, Sparkles, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { uploadPDF } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import type { UploadProgress } from "@/types";
import { InterstitialAd } from "./InterstitialAd";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
}

export function UploadDialog({ open, onOpenChange, file }: UploadDialogProps) {
  const navigate = useNavigate();
  const [customName, setCustomName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Ad state
  const [showAd, setShowAd] = useState(false);
  const [pendingDocument, setPendingDocument] = useState<any>(null);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const slug = customName ? generateSlug(customName) : undefined;
      const document = await uploadPDF(file, slug, (progress) => {
        setUploadProgress(progress);
      });

      // Store document and show ad instead of navigating immediately
      setPendingDocument({
        documentId: document.id,
        fileName: document.fileName,
        fileSize: document.fileSize,
        pageCount: document.pageCount,
        shareUrl: document.shareUrl,
        viewerUrl: document.viewerUrl,
        analyticsUrl: document.analyticsUrl,
        expiresAt: document.expiresAt.toISOString(),
        customName: customName || undefined,
      });

      setIsUploading(false);
      onOpenChange(false); // Close dialog
      setShowAd(true);     // Show ad overlay

    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleAdComplete = () => {
    setShowAd(false);
    if (pendingDocument) {
      navigate("/success", { state: pendingDocument });
    }
  };

  const previewSlug = customName ? generateSlug(customName) : "random-id";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-red-500" />
              Upload PDF
            </DialogTitle>
            <DialogDescription>
              {file ? `Ready to upload: ${file.name}` : "No file selected"}
            </DialogDescription>
          </DialogHeader>

          {!isUploading ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="custom-name" className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Custom Link Name (Optional)
                </Label>
                <Input
                  id="custom-name"
                  placeholder="my-awesome-document"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  Your link will be:{" "}
                  <code className="px-1.5 py-0.5 rounded bg-muted font-mono">
                    /v/{previewSlug}
                  </code>
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!file}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Upload & Share
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-8">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm font-medium">
                  {uploadProgress?.phase === "preparing" && "Preparing..."}
                  {uploadProgress?.phase === "uploading" && "Uploading..."}
                  {uploadProgress?.phase === "processing" && "Processing..."}
                  {uploadProgress?.phase === "complete" && "Complete!"}
                </div>
                <Progress value={uploadProgress?.progress || 0} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {uploadProgress?.message || "Please wait..."}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Interstitial Ad Overlay */}
      <InterstitialAd
        open={showAd}
        onComplete={handleAdComplete}
      />
    </>
  );
}
