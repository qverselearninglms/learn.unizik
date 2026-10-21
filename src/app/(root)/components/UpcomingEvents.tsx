import Link from "next/link";

export default function UpcomingEvents() {
    const events = [
        {
            title: "UNIZIK Graduate Career Fair",
            date: "Apr 22",
            time: "10:00 AM - 4:00 PM",
            location: "Chike Okoli Center for Entrepreneurship",
        },
        {
            title: "Guest Lecture: AI Ethics & Digital Tech",
            date: "Apr 25",
            time: "2:00 PM - 3:30 PM",
            location: "Faculty of Science Lecture Theatre (FSLT)",
        },
        {
            title: "Night of Music & Arts",
            date: "Apr 28",
            time: "7:00 PM - 9:00 PM",
            location: "University Auditorium (Permanent Site)",
        },
        {
            title: "UNIZIK Alumni Home-Coming Mixer",
            date: "May 5",
            time: "6:00 PM - 8:00 PM",
            location: "ASUU Secretariat Hall",
        },
    ];

    return (
        <article className="flex h-full flex-col rounded-[28px] bg-brand-navy p-7 text-white shadow-lift sm:p-9">
            <h3 className="font-display text-2xl font-semibold">Upcoming events</h3>

            <ol className="mt-6 space-y-3">
                {events.map((event) => {
                    const [month, day] = event.date.split(' ');
                    return (
                        <li
                            key={event.title}
                            className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:bg-white/[0.08]"
                        >
                            <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-white text-[var(--navy-950)]">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-accent">{month}</span>
                                <span className="font-display text-xl font-semibold leading-none">{day}</span>
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-semibold leading-snug">{event.title}</h4>
                                <p className="mt-1 text-xs text-white/60">{event.time}</p>
                                <p className="text-xs text-white/60">{event.location}</p>
                            </div>
                        </li>
                    );
                })}
            </ol>

            <div className="mt-auto pt-6">
                <Link
                    href="#"
                    className="inline-flex w-full items-center justify-center rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/15"
                >
                    View full calendar
                </Link>
            </div>
        </article>
    );
}
