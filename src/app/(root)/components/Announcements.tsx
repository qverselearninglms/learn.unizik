import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, Award01Icon, Calendar03Icon, UserGroupIcon } from '@hugeicons/core-free-icons';
import Link from "next/link";

const announcements = [
    {
        title: "2025/2026 Regular Course Registration Commences",
        date: "April 15, 2025",
        description: "Course registration for the 2025/2026 academic session is now active. All students are advised to register their courses online via the portal to avoid late entry penalties.",
        icon: Calendar03Icon,
        type: "important",
    },
    {
        title: "UNIZIK Research Conference: Call for Abstracts",
        date: "April 12, 2025",
        description: "The University Senate invites submissions for the upcoming multidisciplinary symposium. Submit your abstracts to the faculty secretariat by May 30th, 2025.",
        icon: Award01Icon,
        type: "academic",
    },
    {
        title: "Notice of ICT Portal Maintenance",
        date: "April 10, 2025",
        description: "The UNIZIK digital portal will be down for scheduled maintenance on April 20th. Please complete all pending online registrations before 2:00 AM to avoid data loss.",
        icon: Alert02Icon,
        type: "alert",
    },
    {
        title: "SUG General Elections - E-Voting Schedule",
        date: "April 8, 2025",
        description: "Great Zikites! Cast your votes for the Student Union Government elections. Voting will take place via the e-platform on April 25-26, 2025. Exercise your franchise!",
        icon: UserGroupIcon,
        type: "community",
    },
];

const TONE: Record<string, string> = {
    important: 'bg-accent/10 text-accent',
    academic: 'bg-primary/[0.08] text-primary dark:bg-white/[0.06] dark:text-[oklch(0.8_0.08_250)]',
    alert: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    community: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

export default function Announcements() {
    return (
        <article className="rounded-[28px] border border-[var(--hairline)] bg-card p-7 shadow-soft sm:p-9">
            <header className="flex items-center justify-between">
                <h3 className="font-display text-2xl font-semibold text-foreground">Announcements</h3>
                <Link href="#" className="text-sm font-semibold text-accent hover:underline underline-offset-4">
                    View all
                </Link>
            </header>

            <ul className="mt-6 divide-y divide-[var(--hairline)]">
                {announcements.map(({ title, date, description, icon: Icon, type }) => (
                    <li key={title} className="flex gap-5 py-5 first:pt-2 last:pb-0">
                        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${TONE[type]}`}>
                            <HugeiconsIcon icon={Icon} className="size-[18px]" />
                        </span>
                        <div className="min-w-0">
                            <time className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{date}</time>
                            <h4 className="mt-1 font-semibold leading-snug text-foreground">{title}</h4>
                            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </article>
    );
}
