import nodemailer from 'nodemailer';
import { PostmarkWebhook } from '@slack/webhook'; // Wait, requirements say Slack Webhooks
import { IncomingWebhook } from '@slack/webhook';
import twilio from 'twilio';
import NotificationModel from '../models/Notification.js';
import { io } from '../index.js'; // I'll export io from index.ts

// Email setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Slack setup
const slackWebhook = process.env.SLACK_WEBHOOK_URL ? new IncomingWebhook(process.env.SLACK_WEBHOOK_URL) : null;

// WhatsApp setup
const twilioClient = (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN) 
    ? twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN) 
    : null;

export const sendEmailAlert = async (to: string, subject: string, message: string) => {
    // Skip if dummy credentials are used
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your-gmail@gmail.com' || 
        !process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your-gmail-app-password') {
        console.log(`[Email Skipped] Missing valid credentials. Would have sent email to ${to}`);
        return;
    }

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text: message,
            html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #4f46e5;">OpsPulse Alert</h2>
                    <p>${message}</p>
                    <hr style="border: 0; border-top: 1px solid #eee;" />
                    <small style="color: #6b7280;">Timestamp: ${new Date().toLocaleString()}</small>
                   </div>`
        });
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email alert:', error);
    }
};

export const sendSlackAlert = async (message: string) => {
    if (!slackWebhook) return;
    try {
        await slackWebhook.send({
            text: message,
            blocks: [
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*🚨 OpsPulse Alert*\n${message}`
                    }
                },
                {
                    type: "context",
                    elements: [
                        {
                            type: "mrkdwn",
                            text: `*Time:* ${new Date().toLocaleString()}`
                        }
                    ]
                }
            ]
        });
        console.log('Slack alert sent');
    } catch (error) {
        console.error('Error sending Slack alert:', error);
    }
};

export const sendWhatsAppAlert = async (to: string, message: string) => {
    if (!twilioClient || !process.env.TWILIO_WHATSAPP_FROM) return;
    try {
        await twilioClient.messages.create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
            to: `whatsapp:${to}`,
            body: `🚨 OpsPulse Critical Alert: ${message}`
        });
        console.log(`WhatsApp alert sent to ${to}`);
    } catch (error) {
        console.error('Error sending WhatsApp alert:', error);
    }
};

export const createNotification = async (data: { title: string; message: string; type: 'info' | 'warning' | 'critical'; category: string }) => {
    try {
        const notification = await NotificationModel.create({
            ...data,
            timestamp: new Date(),
            isRead: false
        });

        // Emit via Socket.IO
        if (io) {
            io.emit('new_notification', notification);
            
            // Trigger specific events as per requirements
            if (data.type === 'critical') {
                io.emit('system_failure', notification);
            } else if (data.category === 'incident') {
                io.emit('incident_created', notification);
            }
        }

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};
