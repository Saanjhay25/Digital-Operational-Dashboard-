/**
 * MetricsTracker Singleton
 * Stores API request counts in memory for real-time error rate calculation.
 */
class MetricsTracker {
    private totalRequests: number = 0;
    private failedRequests: number = 0;

    /**
     * Increments the total number of incoming requests.
     */
    public incrementTotal(): void {
        this.totalRequests++;
    }

    /**
     * Increments the number of failed requests (status >= 400 or exceptions).
     */
    public incrementFailed(): void {
        this.failedRequests++;
    }

    /**
     * Returns the current metrics and calculated error rate.
     * @returns Object containing total, failed, and errorRate percentage.
     */
    public getMetrics() {
        const errorRate = this.totalRequests === 0 
            ? 0 
            : Number(((this.failedRequests / this.totalRequests) * 100).toFixed(2));

        return {
            totalRequests: this.totalRequests,
            failedRequests: this.failedRequests,
            errorRate
        };
    }
}

export const metricsTracker = new MetricsTracker();
