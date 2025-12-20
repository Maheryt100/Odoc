// users/components/StatsCards.tsx - MOBILE OPTIMIZED
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, UserCog, Globe, TrendingUp } from 'lucide-react';
import { UserStats } from '../types';
import { calculateActivePercentage } from '../helpers';

interface StatsCardsProps {
    stats: UserStats;
}

export const StatsCards = ({ stats }: StatsCardsProps) => {
    const activePercentage = calculateActivePercentage(stats.active, stats.total);

    return (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
            {/* Total Utilisateurs */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden col-span-2 sm:col-span-1">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
                        <CardTitle className="text-xs sm:text-sm font-medium">Total Utilisateurs</CardTitle>
                        <div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardHeader>
                </div>
                <CardContent className="pt-3 sm:pt-4 p-3 sm:p-4 lg:p-6">
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {stats.total}
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                        <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-500 shrink-0" />
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            {stats.active} actifs ({activePercentage}%)
                        </p>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2 mt-2 sm:mt-3">
                        <div
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 sm:h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${activePercentage}%` }}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Super Admins */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
                        <CardTitle className="text-xs sm:text-sm font-medium truncate pr-1">Super Admins</CardTitle>
                        <div className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/30 rounded-lg shrink-0">
                            <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                        </div>
                    </CardHeader>
                </div>
                <CardContent className="pt-3 sm:pt-4 p-3 sm:p-4 lg:p-6">
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                        {stats.super_admins}
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 truncate">
                        Lecture seule
                    </p>
                </CardContent>
            </Card>

            {/* Utilisateurs Centraux */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
                        <CardTitle className="text-xs sm:text-sm font-medium truncate pr-1">Users Centraux</CardTitle>
                        <div className="p-1.5 sm:p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg shrink-0">
                            <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-cyan-600 dark:text-cyan-400" />
                        </div>
                    </CardHeader>
                </div>
                <CardContent className="pt-3 sm:pt-4 p-3 sm:p-4 lg:p-6">
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                        {stats.central_users}
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 truncate">
                        Lecture seule
                    </p>
                </CardContent>
            </Card>

            {/* Utilisateurs District */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
                        <CardTitle className="text-xs sm:text-sm font-medium truncate pr-1">Users District</CardTitle>
                        <div className="p-1.5 sm:p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg shrink-0">
                            <UserCog className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </CardHeader>
                </div>
                <CardContent className="pt-3 sm:pt-4 p-3 sm:p-4 lg:p-6">
                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        {stats.admin_district + stats.user_district}
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 truncate">
                        {stats.admin_district} admin · {stats.user_district} users
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};