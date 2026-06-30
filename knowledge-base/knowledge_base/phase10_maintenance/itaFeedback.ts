// services/itaFeedback.ts

interface TermFeedback {
  term_id: string;
  feedback_type: 'incorrect' | 'missing' | 'suggestion';
  description: string;
  suggested_correction?: string;
  user_id: string;
  timestamp: Date;
  status: 'pending' | 'reviewed' | 'applied' | 'rejected';
}

export class ITAFeedbackService {
  private feedbackQueue: TermFeedback[] = [];

  /**
   * Submit feedback for a term
   */
  async submitFeedback(feedback: Omit<TermFeedback, 'timestamp' | 'status'>): Promise<string> {
    const feedbackEntry: TermFeedback = {
      ...feedback,
      timestamp: new Date(),
      status: 'pending'
    };

    // Store in queue
    this.feedbackQueue.push(feedbackEntry);

    // Send to backend
    try {
      const response = await fetch('/api/v1/ita/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackEntry)
      });
      
      if (!response.ok) throw new Error('Failed to submit feedback');
      
      const result = await response.json();
      return result.feedback_id;
    } catch (error) {
      console.error('Feedback submission failed:', error);
      throw error;
    }
  }

  /**
   * Report incorrect term
   */
  async reportIncorrectTerm(
    termId: string,
    description: string,
    suggestedCorrection?: string
  ): Promise<string> {
    return this.submitFeedback({
      term_id: termId,
      feedback_type: 'incorrect',
      description,
      suggested_correction: suggestedCorrection,
      user_id: this.getCurrentUserId()
    });
  }

  /**
   * Request missing term
   */
  async requestMissingTerm(
    termDescription: string,
    suggestedSanskrit?: string
  ): Promise<string> {
    return this.submitFeedback({
      term_id: 'NEW',
      feedback_type: 'missing',
      description: termDescription,
      suggested_correction: suggestedSanskrit,
      user_id: this.getCurrentUserId()
    });
  }

  private getCurrentUserId(): string {
    // Get from auth context
    return 'current_user_id';
  }
}

export const itaFeedback = new ITAFeedbackService();
