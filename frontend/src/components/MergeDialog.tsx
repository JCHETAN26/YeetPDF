import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, FileText, X, GripVertical, Layers } from "lucide-react";
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
import { mergePDFs } from "@/lib/api";
import type { UploadProgress } from "@/types";

interface MergeDialogProps {
    files: File[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onFilesChange: (files: File[]) => void;
}

export function MergeDialog({ files, open, onOpenChange, onFilesChange }: MergeDialogProps) {
    const navigate = useNavigate();
    const [customName, setCustomName] = useState("");
    const [customSlug, setCustomSlug] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
    const [error, setError] = useState<string | null>(null);



    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 50);
    };

    const previewSlug = customSlug ? generateSlug(customSlug) : 'merged-document';

    const handleRemoveFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        onFilesChange(newFiles);
        if (newFiles.length < 2) {
            onOpenChange(false);
        }
    };

    const moveFile = (fromIndex: number, toIndex: number) => {
        if (toIndex < 0 || toIndex >= files.length) return;
        const newFiles = [...files];
        const [removed] = newFiles.splice(fromIndex, 1);
        newFiles.splice(toIndex, 0, removed);
        onFilesChange(newFiles);
    };

    const handleMerge = async () => {
        if (files.length < 2) return;

        setIsUploading(true);
        setError(null);

        try {
            const slug = customSlug ? generateSlug(customSlug) : undefined;
            const combinedName = customName || `merged-${files.length}-documents.pdf`;

            const document = await mergePDFs(files, slug, combinedName, (progress) => {
                setUploadProgress(progress);
            });

            navigate("/success", {
                state: {
                    documentId: document.id,
                    fileName: document.fileName,
                    fileSize: document.fileSize,
                    pageCount: document.pageCount,
                    shareUrl: document.shareUrl,
                    viewerUrl: document.viewerUrl,
                    analyticsUrl: document.analyticsUrl,
                    expiresAt: document.expiresAt.toISOString(),
                }
            });

        } catch (err: any) {
            setError(err.message || "Merge failed");
            setIsUploading(false);
        }
    };



    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    const formatSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Layers className="h-5 w-5 text-primary" />
                            Merge PDFs
                        </DialogTitle>
                        <DialogDescription>
                            {files.length} files selected • {formatSize(totalSize)} total
                        </DialogDescription>
                    </DialogHeader>

                    {!isUploading ? (
                        <div className="space-y-4 py-4">
                            {/* File list */}
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {files.map((file, index) => (
                                    <div
                                        key={`${file.name}-${index}`}
                                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 group"
                                    >
                                        <button
                                            type="button"
                                            className="cursor-grab text-muted-foreground hover:text-foreground"
                                            onMouseDown={(e) => e.preventDefault()}
                                        >
                                            <GripVertical className="h-4 w-4" />
                                        </button>
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <FileText className="h-4 w-4 text-primary shrink-0" />
                                            <span className="text-sm truncate">{file.name}</span>
                                            <span className="text-xs text-muted-foreground shrink-0">
                                                {formatSize(file.size)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                className="p-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                                                onClick={() => moveFile(index, index - 1)}
                                                disabled={index === 0}
                                            >
                                                ↑
                                            </button>
                                            <button
                                                type="button"
                                                className="p-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                                                onClick={() => moveFile(index, index + 1)}
                                                disabled={index === files.length - 1}
                                            >
                                                ↓
                                            </button>
                                            <button
                                                type="button"
                                                className="p-1 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleRemoveFile(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Custom name */}
                            <div className="space-y-2">
                                <Label htmlFor="combined-name">Combined File Name (Optional)</Label>
                                <Input
                                    id="combined-name"
                                    placeholder="My Application Package"
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    maxLength={100}
                                />
                            </div>

                            {/* Custom slug */}
                            <div className="space-y-2">
                                <Label htmlFor="custom-slug">Custom Link (Optional)</Label>
                                <Input
                                    id="custom-slug"
                                    placeholder="my-application"
                                    value={customSlug}
                                    onChange={(e) => setCustomSlug(e.target.value)}
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
                                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                    {error}
                                </div>
                            )}

                            <Button
                                className="w-full"
                                variant="premium"
                                onClick={handleMerge}
                                disabled={files.length < 2}
                            >
                                <Layers className="h-4 w-4 mr-2" />
                                Merge & Get Link
                            </Button>
                        </div>
                    ) : (
                        <div className="py-8 space-y-4">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">
                                    {uploadProgress?.message || "Merging..."}
                                </p>
                            </div>
                            <Progress value={uploadProgress?.progress || 0} />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </>
    );
}
