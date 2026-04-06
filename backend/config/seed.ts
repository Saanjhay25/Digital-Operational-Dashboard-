import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Log from '../models/Log.js';
import Cluster from '../models/Cluster.js';
import NotificationModel from '../models/Notification.js';
import AnalyticsData from '../models/AnalyticsData.js';

const seedAdmin = async () => {
    try {
        const adminExists = await User.findOne({ email: 'admin@opspulse.com' });

        if (!adminExists) {
            console.log('Seeding default administrator...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin@123', salt);

            await User.create({
                email: 'admin@opspulse.com',
                name: 'System Administrator',
                password: hashedPassword,
                role: 'admin',
                status: 'active',
                mustChangePassword: true
            });
            console.log('Default administrator created successfully.');
        }

        // Seed Clusters
        const clusterCount = await Cluster.countDocuments();
        if (clusterCount === 0) {
            console.log('Seeding clusters...');
            await Cluster.insertMany([
                { clusterId: '01', name: 'US-East-Primary', nodes: 12, health: 'Optimal', cpu: 42, ram: 58 },
                { clusterId: '02', name: 'EU-Central-Backup', nodes: 8, health: 'Optimal', cpu: 28, ram: 44 },
                { clusterId: '03', name: 'APAC-Tokyo-Edge', nodes: 24, health: 'High Load', cpu: 82, ram: 71 },
            ]);
        }

        /* 
        // Seed Logs - Removed for real-time logs implementation
        const logCount = await Log.countDocuments();
        if (logCount === 0) {
            console.log('Seeding logs...');
            await Log.insertMany([
                { time: '2023-10-27 14:22:01', svc: 'AUTH-SERVER', msg: 'Authentication requests peaking at 120ms', level: 'WARN', type: 'system' },
                { time: '2023-10-27 14:25:30', svc: 'DATABASE', msg: 'Auto-scaled connection pool to 50 nodes', level: 'INFO', type: 'system' },
                { time: '2023-10-27 14:30:12', svc: 'CDN', msg: 'Global assets refreshed successfully', level: 'INFO', type: 'system' },
                { time: '2023-10-27 15:01:22', svc: 'BACKUP-DAEMON', msg: 'Backup rotation completed successfully', level: 'INFO', type: 'system' },
                { time: '2023-10-27 14:58:10', svc: 'MONITORING', msg: 'Disk threshold exceeded on node-04', level: 'WARN', type: 'system' },
                { time: '2023-10-27 14:45:00', svc: 'DATABASE', msg: 'Postgres connection pool exhausted', level: 'ERROR', type: 'system' },
                // Access Logs
                { time: new Date().toISOString(), ip: '192.168.1.42', location: 'London, UK', status: 'Allowed', level: 'INFO', msg: 'Access granted', type: 'access' },
                { time: new Date().toISOString(), ip: '10.0.4.128', location: 'Tokyo, JP', status: 'Blocked', level: 'WARN', msg: 'Access denied', type: 'access' },
                { time: new Date().toISOString(), ip: '172.16.0.5', location: 'Internal VPN', status: 'Allowed', level: 'INFO', msg: 'Access granted', type: 'access' }
            ]);
        }
        */

        // Seed Notifications
        const notifCount = await NotificationModel.countDocuments();
        if (notifCount === 0) {
            console.log('Seeding notifications...');
            await NotificationModel.insertMany([
                { notificationId: 'notif-1', title: 'High API Latency Alert', message: 'The AUTH-GATEWAY service is experiencing P99 latency above 250ms in US-EAST-1.', timestamp: '2023-10-27 15:45:00', severity: 'error', isRead: false, category: 'performance' },
                { notificationId: 'notif-2', title: 'New User Identity Created', message: 'A new user access profile was generated for the internal audit team.', timestamp: '2023-10-27 15:30:12', severity: 'info', isRead: false, category: 'security' },
                { notificationId: 'notif-3', title: 'Backup Successful', message: 'Daily production database snapshots completed for cluster DB-01.', timestamp: '2023-10-27 12:00:00', severity: 'success', isRead: true, category: 'maintenance' },
                { notificationId: 'notif-4', title: 'Memory Threshold Warning', message: 'Node-04 memory utilization reached 88%. Scaling policy check scheduled.', timestamp: '2023-10-27 11:15:22', severity: 'warning', isRead: true, category: 'resource' }
            ]);
        }

        // Seed Analytics
        const analyticsCount = await AnalyticsData.countDocuments();
        if (analyticsCount === 0) {
            console.log('Seeding analytics data...');
            const performanceData = Array.from({ length: 30 }, (_, i) => {
                const day = 29 - i;
                const date = new Date();
                date.setDate(date.getDate() - day);
                return {
                    day: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                    uptime: 99.9,
                    latency: 40,
                    errors: 0,
                    timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(),
                };
            });

            await AnalyticsData.insertMany([
                {
                    dateRange: '7d',
                    performanceData: performanceData.slice(-7),
                    regionalData: [
                        { name: "US-East-1", used: 50, wasted: 40 },
                        { name: "US-East-2", used: 75, wasted: 25 },
                        { name: "EU-West-1", used: 65, wasted: 35 },
                        { name: "EU-Central-1", used: 88, wasted: 12 },
                        { name: "APAC-Tokyo", used: 91, wasted: 9 },
                        { name: "Global-CDN", used: 45, wasted: 55 },
                    ],
                    errorData: [
                        { name: "Auth Failure", value: 120, color: "#818cf8" },
                        { name: "DB Timeout", value: 85, color: "#f43f5e" },
                        { name: "Network Blip", value: 45, color: "#fbbf24" },
                        { name: "API 5xx", value: 30, color: "#10b981" },
                    ]
                },
                {
                    dateRange: '14d',
                    performanceData: performanceData.slice(-14),
                    regionalData: [
                        { name: "US-East-1", used: 78, wasted: 22 },
                        { name: "US-East-2", used: 72, wasted: 28 },
                        { name: "EU-West-1", used: 60, wasted: 40 },
                        { name: "EU-Central-1", used: 85, wasted: 15 },
                        { name: "APAC-Tokyo", used: 89, wasted: 11 },
                        { name: "Global-CDN", used: 42, wasted: 58 },
                    ],
                    errorData: [
                        { name: "Auth Failure", value: 240, color: "#818cf8" },
                        { name: "DB Timeout", value: 160, color: "#f43f5e" },
                        { name: "Network Blip", value: 95, color: "#fbbf24" },
                        { name: "API 5xx", value: 65, color: "#10b981" },
                    ]
                },
                {
                    dateRange: '30d',
                    performanceData: performanceData,
                    regionalData: [
                        { name: "US-East-1", used: 74, wasted: 26 },
                        { name: "US-East-2", used: 70, wasted: 30 },
                        { name: "EU-West-1", used: 58, wasted: 42 },
                        { name: "EU-Central-1", used: 82, wasted: 18 },
                        { name: "APAC-Tokyo", used: 85, wasted: 15 },
                        { name: "Global-CDN", used: 40, wasted: 60 },
                    ],
                    errorData: [
                        { name: "Auth Failure", value: 480, color: "#818cf8" },
                        { name: "DB Timeout", value: 320, color: "#f43f5e" },
                        { name: "Network Blip", value: 180, color: "#fbbf24" },
                        { name: "API 5xx", value: 140, color: "#10b981" },
                    ]
                },
                {
                    dateRange: 'custom',
                    performanceData: performanceData.slice(-7), // default for custom in initial setup
                    regionalData: [
                        { name: "US-East-1", used: 80, wasted: 20 },
                        { name: "US-East-2", used: 74, wasted: 26 },
                        { name: "EU-West-1", used: 62, wasted: 38 },
                        { name: "EU-Central-1", used: 86, wasted: 14 },
                        { name: "APAC-Tokyo", used: 90, wasted: 10 },
                        { name: "Global-CDN", used: 44, wasted: 56 },
                    ],
                    errorData: [
                        { name: "Auth Failure", value: 180, color: "#818cf8" },
                        { name: "DB Timeout", value: 110, color: "#f43f5e" },
                        { name: "Network Blip", value: 60, color: "#fbbf24" },
                        { name: "API 5xx", value: 45, color: "#10b981" },
                    ]
                }
            ]);
        }

    } catch (error) {
        console.error('Error seeding data:', error);
    }
};

export default seedAdmin;
