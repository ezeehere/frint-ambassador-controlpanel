import {
    BarChart3,
    Building2,
    ClipboardCheck,
    FileText,
    Flag,
    LayoutDashboard,
    Link2,
    Megaphone,
    Settings,
    ShieldCheck,
    Trophy,
    UploadCloud,
    UserRound,
    Users,
} from 'lucide-react'

export const adminMenuItems = [
    {
        label: 'Dashboard',
        path: '/admin/dashboard',
        icon: LayoutDashboard,
    },
    {
        label: 'Ambassadors',
        path: '/admin/ambassadors',
        icon: Users,
    },
    {
        label: 'Colleges',
        path: '/admin/colleges',
        icon: Building2,
    },
    {
        label: 'Campaigns',
        path: '/admin/campaigns',
        icon: Megaphone,
    },
    {
        label: 'Leads',
        path: '/admin/leads',
        icon: Flag,
    },
    {
        label: 'Tasks',
        path: '/admin/tasks',
        icon: ClipboardCheck,
    },
    {
        label: 'Proofs',
        path: '/admin/proofs',
        icon: UploadCloud,
    },
    {
        label: 'Leaderboard',
        path: '/admin/leaderboard',
        icon: Trophy,
    },
    {
        label: 'Reports',
        path: '/admin/reports',
        icon: FileText,
    },
    {
        label: 'Settings',
        path: '/admin/settings',
        icon: Settings,
    },
]

export const ambassadorMenuItems = [
    {
        label: 'Dashboard',
        path: '/ambassador/dashboard',
        icon: LayoutDashboard,
    },
    {
        label: 'Campaigns',
        path: '/ambassador/campaigns',
        icon: Megaphone,
    },
    {
        label: 'Referral Links',
        path: '/ambassador/referrals',
        icon: Link2,
    },
    {
        label: 'My Leads',
        path: '/ambassador/leads',
        icon: Flag,
    },
    {
        label: 'My Tasks',
        path: '/ambassador/tasks',
        icon: ClipboardCheck,
    },
    {
        label: 'Upload Proof',
        path: '/ambassador/proofs',
        icon: UploadCloud,
    },
    {
        label: 'Leaderboard',
        path: '/ambassador/leaderboard',
        icon: Trophy,
    },
    {
        label: 'Profile',
        path: '/ambassador/profile',
        icon: UserRound,
    },
]

export const roleLabels = {
    admin: {
        label: 'Admin',
        icon: ShieldCheck,
    },
    ambassador: {
        label: 'Ambassador',
        icon: UserRound,
    },
}