import { NavItem, Feature, Program, Stat, FooterSection, CampusHighlights } from "../types";
import { Atom01Icon, Book01Icon, Briefcase01Icon, ComputerProgramming01Icon, EarthIcon, LaptopIcon, MicroscopeIcon, MortarboardIcon, Clock01Icon } from "@hugeicons/core-free-icons";

export const NAV_ITEMS: NavItem[] = [
    { href: '#home', label: 'Home' },
    { href: '#services', label: 'Services' },
    { href: '#features', label: 'Why UNIZIK' },
    { href: '#programs', label: 'Programmes' },
    { href: '#calender_view', label: 'Updates' },
    { href: '#campus_highlight', label: 'Campus' },
];

export const FEATURES: Feature[] = [
    {
        icon: MortarboardIcon,
        title: 'Taught by UNIZIK faculty',
        description: 'Every course is designed and delivered by the same lecturers who teach on campus, with the same standards.',
    },
    {
        icon: LaptopIcon,
        title: 'Learn from anywhere',
        description: 'Lectures, materials and assessments live in one virtual classroom that works on your phone or laptop.',
    },
    {
        icon: Clock01Icon,
        title: 'Register in minutes',
        description: 'Choose your General Studies courses online and go straight to your classes, no queues or paperwork.',
    },
];

export const PROGRAMS: Program[] = [
    {
        title: "Computer Science",
        description: "Explore cutting-edge technology and software development",
        icon: ComputerProgramming01Icon,
        duration: '2 Years',
    },
    {
        title: "Business Administration",
        description: "Develop leadership skills for the modern business world",
        icon: Briefcase01Icon,
        duration: '4 Years',
    },
    {
        title: "Biology",
        description: "Discover the science of life through innovative research",
        icon: MicroscopeIcon,
        duration: '4 Years',
    },
    {
        title: "Literature",
        description: "Analyze great works and develop critical thinking skills",
        icon: Book01Icon,
        duration: '4 Years',
    },
    {
        title: "Physics",
        description: "Understand the fundamental laws that govern our universe",
        icon: Atom01Icon,
        duration: '4 Years',
    },
    {
        title: "International Relations",
        description: "Study global politics and cross-cultural communication",
        icon: EarthIcon,
        duration: '4 Years',
    },
];

export const CAMPUSHIGHLIGHTS: CampusHighlights[] = [
    {
        title: "Prof. Festus Aghagbo Nwako Library",
        imageUrl: "/campus/ca-1.jpeg",
    },
    {
        title: "Chike Okoli Centre for Entrepreneurial Studies",
        imageUrl: "/campus/ca-2.jpeg",
    },
    {
        title: "UNIZIK Sports Center (Perm Site)",
        imageUrl: "/campus/ca-3.jpeg",
    },
    {
        title: "UNIZIK Halls of Residence",
        imageUrl: "/campus/ca-4.jpeg",
    },
];

export const STATS: Stat[] = [
    { number: '5000+', label: 'Alumni Network' },
    { number: '95%', label: 'Employment Rate' },
    { number: '50+', label: 'Industry Partners' },
    { number: '25', label: 'Years of Excellence' },
];

export const FOOTER_SECTIONS: FooterSection[] = [
    {
        title: 'Quick Links',
        links: [
            { label: 'Programmes', href: '/#programs' },
            { label: 'Course enrollment', href: '/enrollment' },
            { label: 'GS registration', href: '/gs-registration' },
            { label: 'Announcements', href: '/#calender_view' },
            { label: 'Campus', href: '/#campus_highlight' },
        ],
    },
    {
        title: 'Student Resources',
        links: [
            { label: 'Student portal', href: '/auth/signin' },
            { label: 'Create an account', href: '/auth/create-account' },
            { label: 'Reset password', href: '/auth/forgot-password' },
            { label: 'My courses', href: '/enrollment' },
            { label: 'Main university site', href: 'https://unizik.edu.ng' },
        ],
    },
];


// AUTH DASHBOARD CONFIG
import {
    BookOpen,
    DollarSign,
    Flag,
    GraduationCap,
    MapPinHouse,
    PieChart,
    UserRoundPen,
    CalendarCheck,
    School2,
    MessageSquare,
    Settings2,
    LucideIcon,
    School,
    ClipboardList,
    BookOpenCheck,
    Gamepad,
    Gamepad2,
    ShieldUser,
    SendHorizonal,
    BanknoteArrowDown,
    Users,
    CreditCard,
    Atom,
    Book,
    Briefcase,
    Code,
    Globe,
    Microscope,
    LayoutDashboard,
    BadgeDollarSign
} from "lucide-react";
export interface SidebarNavItem {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: { title: string; url: string }[];
    display: boolean;
}

export interface SidebarNavConfig {
    compound: SidebarNavItem[];
    flat?: {
        title: string;
        url: string;
        icon: LucideIcon;
        display: boolean;
    }[];
}

export const AdminNavMain: SidebarNavConfig = {
    compound: [
        {
            title: "DASHBOARD",
            url: "#",
            icon: PieChart,
            isActive: true,
            items: [
                {
                    title: "Statistics",
                    url: "/admin/dashboard",
                },
            ],
            display: true,
        },
        {
            title: "USERS",
            url: "#",
            icon: Users,
            items: [
                {
                    title: "Students Listing",
                    url: "/admin/students",
                },
                {
                    title: "Teachers Listing",
                    url: "/admin/teachers",
                },
                {
                    title: "Parents Listing",
                    url: "/admin/parents",
                },
            ],
            display: true,
        },

        {
            title: "MESSAGES",
            url: "#",
            icon: SendHorizonal,
            items: [
                {
                    title: "Messages",
                    url: "/admin/messages",
                },



            ],
            display: true,
        },
        {
            title: "PAYMENT HISTORY",
            url: "#",
            icon: CreditCard,
            items: [
                {
                    title: "Payments",
                    url: "/admin/payments",
                },
            ],
            display: true,
        },
        {
            title: "STUDENT REPORTS",
            url: "#",
            icon: ClipboardList,
            items: [
                {
                    title: "View Reports",
                    url: "/admin/reports",
                },
            ],
            display: true,
        },
        // {
        //     title: "SETTINGS",
        //     url: "#",
        //     icon: Settings2,
        //     items: [
        //         {
        //             title: "Profile Settings",
        //             url: "/admin/settings",
        //         },
        //     ],
        //     display: true,
        // },
    ]
}

export const DirectorNavMain: SidebarNavConfig = {
    compound: [
        {
            title: "DASHBOARD",
            url: "#",
            icon: LayoutDashboard,
            isActive: true,
            items: [
                {
                    title: "Dashboard",
                    url: "/director/dashboard",
                },
            ],
            display: true,
        },
        {
            title: "USERS",
            url: "#",
            icon: Users,
            items: [
                {
                    title: "Statistical Reports",
                    url: "/director/scholars",
                },
            ],
            display: true,
        },

        {
            title: "Grade Reports",
            url: "#",
            icon: GraduationCap,
            items: [
                {
                    title: "Student Grades",
                    url: "/director/grades",
                },
            ],
            display: true,
        },
        {
            title: "Finance",
            url: "#",
            icon: BadgeDollarSign,
            items: [
                {
                    title: "Financial Reports",
                    url: "/director/financial-reports",
                },
            ],
            display: true,
        },
    ]
}
export const StudentNavMain: SidebarNavConfig = {
    compound: [
        {
            title: "DASHBOARD",
            url: "#",
            icon: PieChart,
            isActive: true,
            items: [
                {
                    title: "Statistics",
                    url: "/student/dashboard",
                },
            ],
            display: true,
        },
        {
            title: "PAYMENTS",
            url: "#",
            icon: DollarSign,
            items: [
                {
                    title: "Pay Acceptance Fee",
                    url: "/history/student-payments/acceptance",
                },
                {
                    title: "Pay Tuition Fee",
                    url: "/history/student-payments/tuition",
                },
            ],
            display: false,
        },
        {
            title: "MY COURSES",
            url: "#",
            icon: School,
            items: [
                {
                    title: "My Courses",
                    url: "/student/classes",
                },

            ],
            display: true,
        },
        {
            title: "HISTORY",
            url: "#",
            icon: DollarSign,
            items: [
                {
                    title: "Payment History",
                    url: "/student/history/student-payments",
                },
                {
                    title: "Result History",
                    url: "/student/history/student-results",
                },
            ],
            display: true,
        },
        {
            title: "LEADERBOARD & PERFORMANCES",
            url: "#",
            icon: Gamepad2,
            items: [
                {
                    title: "Leaderboard & Performances",
                    url: "/student/leaderboard",
                },

            ],
            display: true,
        },
        // {
        //     title: "REPORTS",
        //     url: "#",
        //     icon: Flag,
        //     items: [
        //         {
        //             title: "Grade Report",
        //             url: "/student/grade-report",
        //         },
        //     ],
        //     display: true,
        // },

        {
            title: "PROFILE",
            url: "#",
            icon: ShieldUser,
            items: [
                {
                    title: "Profile Settings",
                    url: "/student/profile",
                },
            ],
            display: true,
        },
    ]
}
export const TeacherNavMain: SidebarNavConfig = {
    compound: [
        {
            title: "DASHBOARD",
            url: "#",
            icon: PieChart,
            isActive: true,
            items: [
                {
                    title: "Overview",
                    url: "/teacher/dashboard",
                },
            ],
            display: true,
        },
    ],
    flat: [

        // {
        //     title: "STUDENTS",
        //     url: "/teacher/students",
        //     icon: GraduationCap,
        //     display: true,
        // },
        {
            title: "COURSES",
            url: "/teacher/classes",
            icon: School,
            display: true,
        },
        {
            title: "STUDENT REPORTS",
            url: "/teacher/grade-reports",
            icon: BookOpenCheck,
            display: true,
        },
        // {
        //     title: "CALENDER",
        //     url: "/teacher/calender",
        //     icon: CalendarCheck,
        //     display: true,
        // },
        {
            title: "ATTENDANCE",
            url: "/teacher/attendance",
            icon: ClipboardList,
            display: true,
        },
        {
            title: "MESSAGES",
            url: "/teacher/messages",
            icon: MessageSquare,
            display: true,
        },

        {
            title: "SETTINGS",
            url: "/teacher/settings",
            icon: Settings2,
            display: false,
        },
    ],
};
export const ParentNavMain: SidebarNavConfig = {
    compound: [
        {
            title: "DASHBOARD",
            url: "#",
            icon: PieChart,
            isActive: true,
            items: [
                {
                    title: "Overview",
                    url: "/parent/dashboard",
                },
            ],
            display: true,
        },
    ],
    flat: [

        // {
        //     title: "MESSAGES",
        //     url: "/parent/messages",
        //     icon: SendHorizonal,
        //     display: true,
        // },


        {

            title: "COURSES",
            url: "/parent/classes",
            icon: BookOpen,
            display: true,
        },
        {
            title: "PAYMENT HISTORY",
            url: "/parent/payments",
            icon: BanknoteArrowDown,
            display: true,
        },
        {
            title: "STUDENT REPORTS",
            url: "/parent/reports",
            icon: MessageSquare,
            display: true,
        },
        {
            title: "SETTINGS",
            url: "/parent/settings",
            icon: Settings2,
            display: false,
        },
    ],
};