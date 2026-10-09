import { Category, Enrollment, Course, SubCategory } from '../types/course.types';

// Mock courses for augmentation
export const mockCourses: Course[] = [
    {
        id: 'course-1',
        title: 'React Fundamentals',
        description: 'Unlock this GS Course and begin all course activities for the Course.',
        // price: 99,
        // duration: '8 weeks',
        // level: 'beginner',
        instructor: 'Sarah Johnson',
        rating: 4.8,
        studentsEnrolled: 1250,
        imageUrl: '/api/placeholder/400/200',

        course_group: "",
        course_group_id: 0,
        course_id: 0,
        course_name: "",
        short_name: "",
    },
    {
        id: 'course-2',
        title: 'Advanced React Patterns',
        description: 'Unlock this GS Course and begin all course activities for the Course.',
        // price: 149,
        // duration: '10 weeks',
        // level: 'intermediate',
        instructor: 'Mike Chen',
        rating: 4.9,
        studentsEnrolled: 890,
        imageUrl: '/api/placeholder/400/200',

        course_group: "",
        course_group_id: 0,
        course_id: 0,
        course_name: "",
        short_name: "",
    },
    {
        id: 'course-3',
        title: 'React Performance Optimization',
        description: 'Unlock this GS Course and begin all course activities for the Course.',
        // price: 129,
        // duration: '6 weeks',
        // level: 'advanced',
        instructor: 'Emma Davis',
        rating: 4.7,
        studentsEnrolled: 650,
        imageUrl: '/api/placeholder/400/200',

        course_group: "",
        course_group_id: 0,
        course_id: 0,
        course_name: "",
        short_name: "",
    },
    {
        id: 'course-4',
        title: 'TypeScript for React Developers',
        description: 'Unlock this GS Course and begin all course activities for the Course.',
        // price: 119,
        // duration: '7 weeks',
        // level: 'intermediate',
        instructor: 'Alex Rodriguez',
        rating: 4.8,
        studentsEnrolled: 1100,
        imageUrl: '/api/placeholder/400/200',

        course_group: "",
        course_group_id: 0,
        course_id: 0,
        course_name: "",
        short_name: "",
    },
    {
        id: 'course-5',
        title: 'Node.js Backend Development',
        description: 'Unlock this GS Course and begin all course activities for the Course.',
        // price: 139,
        // duration: '9 weeks',
        // level: 'intermediate',
        instructor: 'David Kim',
        rating: 4.6,
        studentsEnrolled: 950,
        imageUrl: '/api/placeholder/400/200',

        course_group: "",
        course_group_id: 0,
        course_id: 0,
        course_name: "",
        short_name: "",
    },
    {
        id: 'course-6',
        title: 'Python for Data Science',
        description: 'Unlock this GS Course and begin all course activities for the Course.',
        // price: 159,
        // duration: '12 weeks',
        // level: 'beginner',
        instructor: 'Lisa Wang',
        rating: 4.9,
        studentsEnrolled: 2100,
        imageUrl: '/api/placeholder/400/200',

        course_group: "",
        course_group_id: 0,
        course_id: 0,
        course_name: "",
        short_name: "",
    },
    {
        id: 'course-7',
        title: 'Machine Learning Fundamentals',
        description: 'Unlock this GS Course and begin all course activities for the Course.',
        // price: 199,
        // duration: '14 weeks',
        // level: 'intermediate',
        instructor: 'Dr. Robert Brown',
        rating: 4.7,
        studentsEnrolled: 780,
        imageUrl: '/api/placeholder/400/200',

        course_group: "",
        course_group_id: 0,
        course_id: 0,
        course_name: "",
        short_name: "",
    },
    {
        id: 'course-8',
        title: 'DevOps with Docker & Kubernetes',
        description: 'Unlock this GS Course and begin all course activities for the Course.',
        // price: 179,
        // duration: '11 weeks',
        // level: 'advanced',
        instructor: 'Maria Garcia',
        rating: 4.8,
        studentsEnrolled: 520,
        imageUrl: '/api/placeholder/400/200',

        course_group: "",
        course_group_id: 0,
        course_id: 0,
        course_name: "",
        short_name: "",
    }
];

// Mock subcategories for augmentation
export const mockSubCategories: SubCategory[] = [
    {
        id: 'sub-1',
        name: 'React',
        description: '',
        icon: '⚛️',
        courseCount: 3,
        courses: mockCourses.filter(course => course.title.toLowerCase().includes('react'))
    },
    {
        id: 'sub-2',
        name: 'TypeScript',
        description: '',
        icon: '📘',
        courseCount: 1,
        courses: mockCourses.filter(course => course.title.toLowerCase().includes('typescript'))
    },
    {
        id: 'sub-3',
        name: 'JavaScript',
        description: '',
        icon: '📜',
        courseCount: 2,
        courses: mockCourses.filter(course =>
            !course.title.toLowerCase().includes('react') &&
            !course.title.toLowerCase().includes('typescript') &&
            !course.title.toLowerCase().includes('node')
        ).slice(0, 2)
    },
    {
        id: 'sub-4',
        name: 'Node.js',
        description: '',
        icon: '🟢',
        courseCount: 1,
        courses: mockCourses.filter(course => course.title.toLowerCase().includes('node'))
    },
    {
        id: 'sub-5',
        name: 'Python & Data Science',
        description: '',
        icon: '🐍',
        courseCount: 2,
        courses: mockCourses.filter(course =>
            course.title.toLowerCase().includes('python') ||
            course.title.toLowerCase().includes('machine learning')
        )
    },
    {
        id: 'sub-6',
        name: 'DevOps',
        description: '',
        icon: '🐳',
        courseCount: 1,
        courses: mockCourses.filter(course =>
            course.title.toLowerCase().includes('devops') ||
            course.title.toLowerCase().includes('docker') ||
            course.title.toLowerCase().includes('kubernetes')
        )
    }
];

export const mockCategories: Category[] = [
    {
        id: 'cat-1',
        name: 'Frontend Development',
        description: '',
        icon: '🎨',
        color: '#3B82F6',
        subCategories: mockSubCategories.slice(0, 3) // React, TypeScript, JavaScript
    },
    {
        id: 'cat-2',
        name: 'Backend & DevOps',
        description: '',
        icon: '⚙️',
        color: '#10B981',
        subCategories: mockSubCategories.slice(3, 6) // Node.js, Python, DevOps
    }
];

export const mockEnrollments: Enrollment[] = [
    {
        id: 'enroll-1',
        courseId: 'course-1',
        course: mockCourses[0],
        enrolledAt: '2024-01-15T00:00:00Z',
        progress: 75,
        completed: false
    },
    {
        id: 'enroll-2',
        courseId: 'course-4',
        course: mockCourses[3],
        enrolledAt: '2024-02-01T00:00:00Z',
        progress: 30,
        completed: false
    }
];

// Alternative: No enrollments for testing empty state
export const mockEmptyEnrollments: Enrollment[] = [];
