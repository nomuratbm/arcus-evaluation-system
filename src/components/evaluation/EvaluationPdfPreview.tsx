"use client";

import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type EvaluationPdfPreviewProps = {
  open: boolean;
  previewUrl: string | null;
  isFiling: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function EvaluationPdfPreview({
  open,
  previewUrl,
  isFiling,
  onOpenChange,
  onConfirm,
}: EvaluationPdfPreviewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-4xl sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Review your evaluation</DialogTitle>
          <DialogDescription>
            This is how FM-SA-05-01 will look when filed. Go back to edit, or
            submit to store it.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="px-6 pt-1 pb-1">
          {previewUrl ? (
            <iframe
              title="FM-SA-05-01 preview"
              src={previewUrl}
              className="h-[min(70vh,40rem)] w-full rounded-md border border-stone-200 bg-stone-100"
            />
          ) : (
            <p className="text-sm text-stone-500">Preparing preview…</p>
          )}
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            Back to form
          </DialogClose>
          <Button
            type="button"
            disabled={isFiling || !previewUrl}
            loading={isFiling}
            onClick={onConfirm}
          >
            Submit evaluation
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
