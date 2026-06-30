// utils/itaErrorHandler.ts

export class ITAError extends Error {
  constructor(
    message: string,
    public code: string,
    public termId?: string
  ) {
    super(message);
    this.name = 'ITAError';
  }
}

export class ITAErrorHandler {
  private errors: Array<{ timestamp: Date; error: ITAError }> = [];

  handle(error: ITAError): void {
    this.errors.push({ timestamp: new Date(), error });
    console.error(`[ITA Error] ${error.code}: ${error.message}`);
    
    // Log to analytics
    this.logToAnalytics(error);
  }

  private logToAnalytics(error: ITAError): void {
    // Send to analytics service
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('ITA_Error', {
        code: error.code,
        message: error.message,
        termId: error.termId
      });
    }
  }

  handleTermNotFound(termId: string): { suggestions: string[]; message: string } {
    const error = new ITAError(
      `Term not found: ${termId}`,
      'TERM_NOT_FOUND',
      termId
    );
    this.handle(error);

    return {
      suggestions: this.findSimilarTerms(termId),
      message: `The term "${termId}" was not found in the WHO ITA database.`
    };
  }

  private findSimilarTerms(termId: string): string[] {
    // Extract chapter from term ID
    const match = termId.match(/ITA-(\d+)/);
    if (!match) return [];
    
    // Return placeholder - actual implementation would search
    return [`ITA-${match[1]}.1.1`, `ITA-${match[1]}.1.2`];
  }

  getRecentErrors(limit: number = 10): Array<{ timestamp: Date; error: ITAError }> {
    return this.errors.slice(-limit);
  }
}

export const itaErrorHandler = new ITAErrorHandler();
