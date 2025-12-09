
"use client";

import { useState, useTransition, useRef, ElementRef } from "react";
import { toast } from "sonner";
import { UploadDropzone } from "@/lib/uploadthing";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateStream } from "@/actions/stream";
import { useRouter } from "next/navigation";
import { Trash, Pencil } from "lucide-react";
import Image from "next/image";

interface EditStreamModalProps {
    initialName: string;
    initialThumbnailUrl: string | null;
}

export const EditStreamModal = ({
    initialName,
    initialThumbnailUrl,
}: EditStreamModalProps) => {
    const router = useRouter();
    const closeRef = useRef<ElementRef<"button">>(null);
    const [isPending, startTransition] = useTransition();

    const [name, setName] = useState(initialName);
    const [thumbnailUrl, setThumbnailUrl] = useState(initialThumbnailUrl);

    const [open, setOpen] = useState(false);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        startTransition(() => {
            updateStream({ name })
                .then(() => {
                    toast.success("Stream updated");
                    setOpen(false);
                })
                .catch(() => toast.error("Something went wrong"));
        });
    };

    const onRemoveThumbnail = () => {
        startTransition(() => {
            updateStream({ thumbnailUrl: null })
                .then(() => {
                    toast.success("Thumbnail removed");
                    setThumbnailUrl(null);
                    router.refresh();
                })
                .catch(() => toast.error("Something went wrong"));
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="primary" size="sm">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Info
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Stream Info</DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                            disabled={isPending}
                            placeholder="Stream name"
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Thumbnail</Label>
                        {thumbnailUrl ? (
                            <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10">
                                <div className="absolute top-2 right-2 z-[10]">
                                    <Button
                                        type="button"
                                        disabled={isPending}
                                        onClick={onRemoveThumbnail}
                                        className="h-auto w-auto p-1.5"
                                        size="sm"
                                        variant="destructive"
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Image
                                    src={thumbnailUrl}
                                    alt="Thumbnail"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="rounded-xl border outline-dashed outline-muted">
                                <UploadDropzone
                                    endpoint="thumbnailUploader"
                                    appearance={{
                                        label: {
                                            color: "#FFFFFF",
                                        },
                                        allowedContent: {
                                            color: "#FFFFFF",
                                        },
                                    }}
                                    onClientUploadComplete={(res) => {
                                        console.log("✅ Upload complete:", res);
                                        const uploadedUrl = res?.[0]?.url;
                                        if (uploadedUrl) {
                                            setThumbnailUrl(uploadedUrl);
                                            toast.success("Thumbnail uploaded successfully");
                                            // Wait for server-side database update
                                            setTimeout(() => {
                                                setOpen(false);
                                                window.location.reload();
                                            }, 1000);
                                        }
                                    }}
                                    onUploadError={(error: Error) => {
                                        console.error("❌ Upload error:", error);
                                        toast.error(`Upload failed: ${error.message}`);
                                    }}
                                    onUploadBegin={(fileName: string) => {
                                        console.log("📤 Uploading:", fileName);
                                    }}
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between">
                        <Button disabled={isPending} variant="ghost" type="button" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button disabled={isPending} variant="primary" type="submit">
                            Save
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
