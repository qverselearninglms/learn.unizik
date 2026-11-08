'use client';

import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    body: ReactNode;
    confirmLabel: string;
    destructive?: boolean;
    pending?: boolean;
    onConfirm: () => void;
}

/** Stays open while the action runs; the caller closes it on success. */
export default function ConfirmDialog({ open, onOpenChange, title, body, confirmLabel, destructive, pending, onConfirm }: Props) {
    return (
        <AlertDialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-2 text-sm text-muted-foreground">{body}</div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        disabled={pending}
                        className={destructive ? buttonVariants({ variant: 'destructive' }) : undefined}
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                    >
                        {pending && <Loader2 className="animate-spin" />}
                        {confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
