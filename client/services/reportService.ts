export class ReportService {
    static async generateReport(reportType: 'incident' | 'weekly', incidentId?: string, dateRange?: any) {
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/reports/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    report_type: reportType,
                    incident_id: incidentId,
                    date_range: dateRange
                })
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to generate report');
            }

            // Create a blob from the PDF Stream
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            
            // Create a hidden link and trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            
            // Extract filename from Content-Disposition if present
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `OpsPulse_${reportType}_report.pdf`;
            if (contentDisposition && contentDisposition.includes('filename=')) {
                filename = contentDisposition.split('filename=')[1].replace(/["']/g, '');
            }
            
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            // Clean up
            window.URL.revokeObjectURL(downloadUrl);
            
            return { success: true };
        } catch (error) {
            console.error('Report Service Error:', error);
            throw error;
        }
    }
}
