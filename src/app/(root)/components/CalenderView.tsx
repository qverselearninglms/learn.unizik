import Announcements from './Announcements'
import UpcomingEvents from './UpcomingEvents'
import { SectionHeading } from './SectionHeading'

const CalenderView = () => {
    return (
        <section id="calender_view" className="relative bg-[var(--ivory)] py-24 sm:py-28">
            <div className="container-page">
                <SectionHeading
                    eyebrow="News & calendar"
                    title="What’s happening on campus"
                    description="Official notices from the University and the dates you should keep an eye on this session."
                />

                <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
                    <Announcements />
                    <UpcomingEvents />
                </div>
            </div>
        </section>
    )
}

export default CalenderView
