import { useCourseStore } from '../stores/course-store';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, BookOpen01Icon, ComputerVideoIcon, PlusSignIcon, RefreshIcon } from '@hugeicons/core-free-icons';
import { motion } from 'framer-motion';
import { useCourseQueries } from '../hooks/use-course-queries';
import { courseService } from '../services/course-service';
import { ConfirmModal } from '@/components/global/confirm-modal';
import Link from 'next/link';
import { useLocalStorage } from '@/hooks/use-local-storage';

export function DashboardView({ userId }: { userId: string }) {
    const { enrolledCourses, toggleShowAllCategories } = useCourseStore();
    const [ssoLink] = useLocalStorage<string>('sso_link', '');
    // const { user } = useAuthContext();
    const {
        reloadCategoriesAndCourses,
        isLoading,
        isFetching,
        unenrollFromCourseMutation,
        isUnenrollmentProcessing,
        user,
        unenrollModalOpen,
        setUnenrollModalOpen,
        courseToUnenroll,
        setCourseToUnenroll,
    } = useCourseQueries(userId);
    const userIdentity = user?.reg_number ?? user?.school_reg_number;
    // const handleUnenroll = (courseId: string, courseGroupId: number) => {
    //     unenrollFromCourseMutation.mutate({
    //         courseGroupId: courseGroupId,
    //         courseId: parseInt(courseId)
    //     });
    // };

    const handleUnenrollClick = (courseId: string, courseGroupId: number, courseName: string) => {
        setCourseToUnenroll({ courseId, courseGroupId, courseName });
        setUnenrollModalOpen(true);
    };

    const handleConfirmUnenroll = () => {
        if (courseToUnenroll) {
            unenrollFromCourseMutation.mutate({
                courseGroupId: courseToUnenroll.courseGroupId,
                courseId: parseInt(courseToUnenroll.courseId)
            });
            setUnenrollModalOpen(false);
            setCourseToUnenroll(null);
        }
    };

    // if (enrolledCourses.length === 0) {
    //     return (
    //         <div className="text-center space-y-8 py-12">
    //             <motion.div
    //                 initial={{ scale: 0.8, opacity: 0 }}
    //                 animate={{ scale: 1, opacity: 1 }}
    //                 transition={{ duration: 0.5 }}
    //                 className="space-y-6"
    //             >
    //                 <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
    //                     <Rocket className="w-16 h-16 text-white" />
    //                 </div>

    //                 <div className="space-y-4">
    //                     <h1 className="text-4xl font-bold text-gray-900  dark:text-white">
    //                         Start Your Learning Journey!
    //                     </h1>
    //                     <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed dark:text-white">
    //                         Discover amazing courses tailored for your career growth.
    //                         Learn from industry experts and join a community of passionate learners.
    //                     </p>
    //                 </div>
    //             </motion.div>

    //             <motion.div
    //                 initial={{ y: 20, opacity: 0 }}
    //                 animate={{ y: 0, opacity: 1 }}
    //                 transition={{ delay: 0.3, duration: 0.5 }}
    //                 className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12"
    //             >
    //                 <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-700/30 dark:border-gray-700">
    //                     <Target className="w-12 h-12 text-blue-500 dark:text-blue-400 mx-auto mb-4" />
    //                     <h3 className="font-semibold text-lg mb-2 dark:text-white">Set Your Goals</h3>
    //                     <p className="text-gray-600 dark:text-gray-300">Choose from 100+ courses aligned with your career objectives</p>
    //                 </div>

    //                 <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-700/30 dark:border-gray-700">
    //                     <BookOpen className="w-12 h-12 text-green-500 dark:text-green-400 mx-auto mb-4" />
    //                     <h3 className="font-semibold text-lg mb-2 dark:text-white">Learn by Doing</h3>
    //                     <p className="text-gray-600 dark:text-gray-300">Hands-on projects and real-world scenarios</p>
    //                 </div>

    //                 <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-700/30 dark:border-gray-700">
    //                     <Award className="w-12 h-12 text-yellow-500 dark:text-yellow-400 mx-auto mb-4" />
    //                     <h3 className="font-semibold text-lg mb-2 dark:text-white">Get Certified</h3>
    //                     <p className="text-gray-600 dark:text-gray-300">Earn certificates to showcase your skills</p>
    //                 </div>
    //             </motion.div>

    //             <motion.div
    //                 initial={{ y: 20, opacity: 0 }}
    //                 animate={{ y: 0, opacity: 1 }}
    //                 transition={{ delay: 0.6, duration: 0.5 }}
    //                 className="pt-8"
    //             >
    //                 <div className="flex flex-col space-x-5 md:flex-row justify-center items-center gap-4">
    //                     <Button
    //                         size="lg"
    //                         onClick={reloadCategoriesAndCourses}
    //                         disabled={isLoading || isFetching}
    //                         className="bg-gradient-to-r from-green-600 to-yellow-600 hover:from-green-700 hover:to-yellow-700 text-white px-12 py-4 text-lg font-semibold rounded-full shadow-lg"
    //                     >
    //                         <RefreshCcw className={`w-6 h-6 mr-3 ${isLoading || isFetching ? ' animate-spin' : ''}`} />
    //                         Reload Courses
    //                     </Button>

    //                     <Button
    //                         size="lg"
    //                         onClick={toggleShowAllCategories}
    //                         className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-lg font-semibold rounded-full shadow-lg"
    //                     >
    //                         <Plus className="w-6 h-6 mr-3" />
    //                         Explore All Courses
    //                     </Button>
    //                 </div>

    //                 <p className="text-gray-500 mt-4 text-sm">
    //                     Join 50,000+ students already learning with us
    //                 </p>
    //             </motion.div>
    //         </div>
    //     );
    // }
    const firstName = (user as { first_name?: string } | null)?.first_name;
    const openLms = () => courseService.redirectToCourseWarePlatform(String(userIdentity), ssoLink);
    const courseCount = enrolledCourses.length;

    return (
        <>
            <div className="space-y-10">
                {/* Welcome banner */}
                <motion.section
                    initial={{ y: -16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="relative isolate overflow-hidden rounded-[28px] bg-[#030b1e] p-7 text-white shadow-lift sm:p-10"
                >
                    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                        <div className="absolute -bottom-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-[conic-gradient(from_248deg_at_62%_60%,rgba(242,106,27,0.6),rgba(31,95,209,0.35),rgba(3,11,30,0)_58%)] blur-3xl" />
                        <div className="absolute -bottom-24 -left-24 h-48 w-[36rem] rotate-[-13deg] rounded-[100%] border border-[#f26a1b]/30" />
                        <div className="absolute right-8 top-8 h-16 w-24 bg-[radial-gradient(circle,rgba(255,255,255,0.28)_1.2px,transparent_1.2px)] [background-size:10px_10px] opacity-30" />
                    </div>
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-sm font-medium text-white/70">My learning</p>
                            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                                Welcome{firstName ? ', ' : ' '}
                                <span className="bg-gradient-to-r from-[#ff8a2a] via-[#f26a1b] to-[#ff9d4d] bg-clip-text text-transparent">
                                    {firstName ?? 'back'}
                                </span>
                            </h1>
                            <p className="mt-3 max-w-xl text-slate-200/85">
                                {courseCount > 0
                                    ? `You are enrolled in ${courseCount} ${courseCount === 1 ? 'course' : 'courses'}. Head to the LMS to start learning.`
                                    : 'Your enrolled courses will appear here.'}
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button
                                onClick={openLms}
                                className="h-12 rounded-full bg-gradient-to-r from-[#f26a1b] via-[#c2410c] to-[#1f5fd1] px-6 text-base font-semibold text-white shadow-[0_12px_36px_rgba(242,106,27,0.4)] hover:opacity-95"
                            >
                                <HugeiconsIcon icon={ComputerVideoIcon} className="size-5" />
                                Go to LMS
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={reloadCategoriesAndCourses}
                                disabled={isLoading || isFetching}
                                className="h-12 rounded-full border border-white/20 px-5 text-white hover:bg-white/10 hover:text-white"
                            >
                                <HugeiconsIcon icon={RefreshIcon} className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </motion.section>

                {/* Courses */}
                <section aria-labelledby="my-courses-heading">
                    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h2 id="my-courses-heading" className="text-2xl font-bold text-foreground">My courses</h2>
                            <p className="text-sm text-muted-foreground">Everything you are enrolled in this session.</p>
                        </div>
                        <Button variant="outline" onClick={toggleShowAllCategories} className="rounded-full">
                            <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
                            Enroll in more programmes
                        </Button>
                    </div>

                    {courseCount === 0 ? (
                        <div className="flex flex-col items-center rounded-3xl border border-dashed border-[var(--hairline)] bg-card px-6 py-16 text-center">
                            <span className="grid size-14 place-items-center rounded-2xl bg-accent/10 text-accent">
                                <HugeiconsIcon icon={BookOpen01Icon} className="size-6" />
                            </span>
                            <h3 className="mt-5 text-lg font-bold text-foreground">No courses yet</h3>
                            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                Complete your General Studies enrollment to see your courses here.
                            </p>
                            <Button asChild variant="gradient" className="mt-6 h-11 rounded-full px-6">
                                <Link href="/gs-registration">Complete enrollment</Link>
                            </Button>
                        </div>
                    ) : (
                        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {enrolledCourses.map((enrollment, index) => (
                                <motion.li
                                    key={enrollment.id}
                                    initial={{ y: 16, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: index * 0.06 }}
                                    className="group flex flex-col rounded-3xl border border-[var(--hairline)] bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="grid size-12 place-items-center rounded-2xl bg-primary/[0.07] text-primary transition-colors group-hover:bg-primary group-hover:text-white dark:bg-white/[0.06] dark:text-[oklch(0.8_0.08_250)]">
                                            <HugeiconsIcon icon={BookOpen01Icon} className="size-5" />
                                        </span>
                                        {enrollment.course.course_group && (
                                            <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-accent">
                                                {enrollment.course.course_group}
                                            </span>
                                        )}
                                    </div>
                                    {enrollment.course.short_name && (
                                        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                            {enrollment.course.short_name}
                                        </p>
                                    )}
                                    <h3 className="mt-1 text-lg font-bold leading-snug text-foreground">
                                        {enrollment.course.course_name || enrollment.course.title}
                                    </h3>
                                    <div className="mt-auto pt-6">
                                        <Button onClick={openLms} variant="gradient" className="h-11 w-full rounded-full">
                                            Continue learning
                                            <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
                                        </Button>
                                    </div>
                                </motion.li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
            <ConfirmModal
                open={unenrollModalOpen}
                onOpenChange={setUnenrollModalOpen}
                onConfirm={handleConfirmUnenroll}
                title="Unenroll from Course"
                description={`Are you sure you want to unenroll from "${courseToUnenroll?.courseName}"? `}
                confirmText="Yes, Unenroll"
                cancelText="Cancel"
                variant="destructive"
            />
        </>
    );
}