import { ConversationSession, TranscriptionResult, ConversationResponse, UserInput } from '../../models/conversation-models';
import { ConversationState, UserInputType } from '../../models/enums';

export interface ConversationMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  confidence?: number;
  isEditable?: boolean;
  isEditing?: boolean;
  originalContent?: string;
}

export class ConversationDisplay {
  private container: HTMLElement;
  private messagesContainer: HTMLElement;
  private inputContainer: HTMLElement;
  private textInput: HTMLTextAreaElement;
  private sendButton: HTMLButtonElement;
  private messages: ConversationMessage[] = [];
  private currentSession: ConversationSession | null = null;
  private onMessageSendCallback: ((message: string) => void) | null = null;
  private onTranscriptionEditCallback: ((messageId: string, newContent: string) => void) | null = null;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with id '${containerId}' not found`);
    }
    
    this.container = container;
    this.createInterface();
    this.setupEventListeners();
  }

  private createInterface(): void {
    this.container.innerHTML = `
      <div class="conversation-display">
        <div class="conversation-header">
          <h3>Conversation</h3>
          <div class="session-info">
            <span id="sessionStatus" class="session-status">No active session</span>
            <span id="iterationCount" class="iteration-count">0/5</span>
          </div>
        </div>
        
        <div id="messagesContainer" class="messages-container">
          <div class="welcome-message">
            <p>Welcome! Start by describing your workflow or process. I'll help you create a comprehensive SOP.</p>
          </div>
        </div>
        
        <div class="conversation-controls">
          <div class="flow-controls">
            <button id="clearBtn" class="control-btn secondary">Clear</button>
            <button id="exportBtn" class="control-btn secondary">Export Chat</button>
            <button id="undoBtn" class="control-btn secondary" disabled>Undo</button>
          </div>
        </div>
        
        <div id="inputContainer" class="input-container">
          <div class="text-input-wrapper">
            <textarea 
              id="textInput" 
              placeholder="Type your message or use voice input..."
              rows="3"
            ></textarea>
            <button id="sendButton" class="send-button" disabled>
              <span>Send</span>
              <span class="send-icon">➤</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Get references to created elements
    this.messagesContainer = this.container.querySelector('#messagesContainer') as HTMLElement;
    this.inputContainer = this.container.querySelector('#inputContainer') as HTMLElement;
    this.textInput = this.container.querySelector('#textInput') as HTMLTextAreaElement;
    this.sendButton = this.container.querySelector('#sendButton') as HTMLButtonElement;

    this.addStyles();
  }

  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .conversation-display {
        display: flex;
        flex-direction: column;
        height: 600px;
        background: white;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        overflow: hidden;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }

      .conversation-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .conversation-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }

      .session-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 5px;
        font-size: 12px;
      }

      .session-status {
        padding: 4px 8px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 12px;
      }

      .iteration-count {
        font-weight: 500;
      }

      .messages-container {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .welcome-message {
        text-align: center;
        color: #666;
        font-style: italic;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 10px;
        border: 2px dashed #ddd;
      }

      .message {
        display: flex;
        flex-direction: column;
        max-width: 80%;
        animation: slideIn 0.3s ease-out;
      }

      .message.user {
        align-self: flex-end;
      }

      .message.agent {
        align-self: flex-start;
      }

      .message-bubble {
        padding: 12px 16px;
        border-radius: 18px;
        position: relative;
        word-wrap: break-word;
      }

      .message.user .message-bubble {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-bottom-right-radius: 6px;
      }

      .message.agent .message-bubble {
        background: #f1f3f4;
        color: #333;
        border-bottom-left-radius: 6px;
      }

      .message-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 5px;
        font-size: 11px;
        color: #666;
      }

      .message.user .message-meta {
        flex-direction: row-reverse;
      }

      .confidence-indicator {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .confidence-bar {
        width: 40px;
        height: 4px;
        background: #e0e0e0;
        border-radius: 2px;
        overflow: hidden;
      }

      .confidence-fill {
        height: 100%;
        background: linear-gradient(90deg, #ff4444, #ffaa00, #44ff44);
        transition: width 0.3s ease;
      }

      .message-actions {
        display: flex;
        gap: 5px;
      }

      .action-btn {
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
        transition: all 0.2s ease;
      }

      .action-btn:hover {
        background: #e0e0e0;
        color: #333;
      }

      .message.editing .message-bubble {
        background: #fff3cd;
        border: 2px solid #ffc107;
      }

      .edit-input {
        width: 100%;
        border: none;
        background: transparent;
        font-family: inherit;
        font-size: inherit;
        color: inherit;
        resize: vertical;
        min-height: 40px;
        outline: none;
      }

      .edit-actions {
        display: flex;
        gap: 10px;
        margin-top: 10px;
      }

      .edit-btn {
        padding: 6px 12px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s ease;
      }

      .edit-btn.save {
        background: #28a745;
        color: white;
      }

      .edit-btn.cancel {
        background: #6c757d;
        color: white;
      }

      .conversation-controls {
        padding: 15px 20px;
        border-top: 1px solid #e0e0e0;
        background: #f8f9fa;
      }

      .flow-controls {
        display: flex;
        gap: 10px;
        justify-content: center;
      }

      .control-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
      }

      .control-btn.secondary {
        background: #e9ecef;
        color: #495057;
      }

      .control-btn.secondary:hover:not(:disabled) {
        background: #dee2e6;
      }

      .control-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .input-container {
        padding: 20px;
        border-top: 1px solid #e0e0e0;
        background: white;
      }

      .text-input-wrapper {
        display: flex;
        gap: 10px;
        align-items: flex-end;
      }

      #textInput {
        flex: 1;
        padding: 12px 16px;
        border: 2px solid #e0e0e0;
        border-radius: 12px;
        font-family: inherit;
        font-size: 14px;
        resize: vertical;
        min-height: 20px;
        max-height: 120px;
        outline: none;
        transition: border-color 0.2s ease;
      }

      #textInput:focus {
        border-color: #667eea;
      }

      .send-button {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
        min-width: 80px;
        justify-content: center;
      }

      .send-button:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .send-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      .send-icon {
        font-size: 16px;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Scrollbar styling */
      .messages-container::-webkit-scrollbar {
        width: 6px;
      }

      .messages-container::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }

      .messages-container::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
      }

      .messages-container::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }

      .feedback-buttons {
        display: flex;
        gap: 10px;
        justify-content: center;
        padding: 15px;
        animation: slideIn 0.3s ease-out;
      }

      .feedback-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s ease;
        min-width: 140px;
        justify-content: center;
      }

      .feedback-btn.approve {
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        color: white;
      }

      .feedback-btn.approve:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
      }

      .feedback-btn.reject {
        background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
        color: white;
      }

      .feedback-btn.reject:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4);
      }
    `;

    document.head.appendChild(style);
  }

  private setupEventListeners(): void {
    // Send button click
    this.sendButton.addEventListener('click', this.handleSendMessage.bind(this));

    // Enter key to send (Shift+Enter for new line)
    this.textInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSendMessage();
      }
    });

    // Enable/disable send button based on input
    this.textInput.addEventListener('input', () => {
      const hasContent = this.textInput.value.trim().length > 0;
      this.sendButton.disabled = !hasContent;
    });

    // Control buttons
    const clearBtn = this.container.querySelector('#clearBtn') as HTMLButtonElement;
    const exportBtn = this.container.querySelector('#exportBtn') as HTMLButtonElement;
    const undoBtn = this.container.querySelector('#undoBtn') as HTMLButtonElement;

    clearBtn.addEventListener('click', this.clearConversation.bind(this));
    exportBtn.addEventListener('click', this.exportConversation.bind(this));
    undoBtn.addEventListener('click', this.undoLastMessage.bind(this));
  }

  private async handleSendMessage(): Promise<void> {
    const content = this.textInput.value.trim();
    if (!content || !this.currentSession) return;

    // Add user message to display
    this.addMessage({
      id: this.generateMessageId(),
      type: 'user',
      content,
      timestamp: new Date(),
      isEditable: true
    });

    // Clear input
    this.textInput.value = '';
    this.sendButton.disabled = true;

    // Notify callback
    if (this.onMessageSendCallback) {
      this.onMessageSendCallback(content);
    }

    // Generate AI summary after user input
    await this.generateAndDisplaySummary();
  }

  private async generateAndDisplaySummary(): Promise<void> {
    if (!this.currentSession) return;

    try {
      // Call the summarization API
      const response = await fetch(`/api/summarization/${this.currentSession.id}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      const summary = data.summary;

      // Display the summary with approve/reject options
      const summaryMessage = this.formatSummaryMessage(summary);
      this.addMessage({
        id: this.generateMessageId(),
        type: 'agent',
        content: summaryMessage,
        timestamp: new Date(),
        isEditable: false
      });

      // Add approve/reject buttons
      this.addFeedbackButtons(summary.id);

    } catch (error) {
      console.error('Failed to generate summary:', error);
      this.addMessage({
        id: this.generateMessageId(),
        type: 'agent',
        content: 'I encountered an issue generating the summary. Please try again.',
        timestamp: new Date(),
        isEditable: false
      });
    }
  }

  private formatSummaryMessage(summary: any): string {
    let message = `📋 **Workflow Summary**\n\n`;
    message += `${summary.description}\n\n`;
    
    if (summary.keySteps && summary.keySteps.length > 0) {
      message += `**Key Steps:**\n`;
      summary.keySteps.forEach((step: string, index: number) => {
        message += `${index + 1}. ${step}\n`;
      });
      message += `\n`;
    }

    if (summary.missingInformation && summary.missingInformation.length > 0) {
      message += `**Missing Information:**\n`;
      summary.missingInformation.forEach((item: string) => {
        message += `• ${item}\n`;
      });
      message += `\n`;
    }

    message += `**Completeness:** ${summary.completenessScore}%\n\n`;
    message += `Is this summary accurate? Please approve or provide feedback.`;

    return message;
  }

  private addFeedbackButtons(summaryId: string): void {
    const feedbackContainer = document.createElement('div');
    feedbackContainer.className = 'feedback-buttons';
    feedbackContainer.innerHTML = `
      <button class="feedback-btn approve" data-summary-id="${summaryId}">
        ✓ Approve
      </button>
      <button class="feedback-btn reject" data-summary-id="${summaryId}">
        ✗ Provide Feedback
      </button>
    `;

    this.messagesContainer.appendChild(feedbackContainer);
    this.scrollToBottom();

    // Add event listeners
    const approveBtn = feedbackContainer.querySelector('.approve') as HTMLButtonElement;
    const rejectBtn = feedbackContainer.querySelector('.reject') as HTMLButtonElement;

    approveBtn.addEventListener('click', () => this.handleFeedback(summaryId, true, feedbackContainer));
    rejectBtn.addEventListener('click', () => this.handleFeedback(summaryId, false, feedbackContainer));
  }

  private async handleFeedback(summaryId: string, isApproved: boolean, container: HTMLElement): Promise<void> {
    if (!this.currentSession) return;

    let userComments = '';
    if (!isApproved) {
      userComments = prompt('What would you like to improve in the summary?') || '';
    }

    try {
      const response = await fetch(`/api/summarization/${this.currentSession.id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          summaryId,
          isApproved,
          userComments
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      const data = await response.json();

      // Remove feedback buttons
      container.remove();

      // Add feedback confirmation message
      this.addMessage({
        id: this.generateMessageId(),
        type: 'agent',
        content: data.message,
        timestamp: new Date(),
        isEditable: false
      });

      // If rejected, display the new summary
      if (!isApproved && data.newSummary) {
        const summaryMessage = this.formatSummaryMessage(data.newSummary);
        this.addMessage({
          id: this.generateMessageId(),
          type: 'agent',
          content: summaryMessage,
          timestamp: new Date(),
          isEditable: false
        });
        this.addFeedbackButtons(data.newSummary.id);
      }

    } catch (error) {
      console.error('Failed to submit feedback:', error);
      this.addMessage({
        id: this.generateMessageId(),
        type: 'agent',
        content: 'Failed to submit feedback. Please try again.',
        timestamp: new Date(),
        isEditable: false
      });
    }
  }

  private getAuthToken(): string {
    // Get token from localStorage or session storage
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public addMessage(message: ConversationMessage): void {
    this.messages.push(message);
    this.renderMessage(message);
    this.scrollToBottom();
    this.updateUndoButton();
  }

  public addTranscriptionResult(result: TranscriptionResult): void {
    const message: ConversationMessage = {
      id: this.generateMessageId(),
      type: 'user',
      content: result.text,
      timestamp: result.timestamp,
      confidence: result.confidence,
      isEditable: true
    };

    this.addMessage(message);
  }

  public addAgentResponse(response: ConversationResponse): void {
    const message: ConversationMessage = {
      id: this.generateMessageId(),
      type: 'agent',
      content: response.message,
      timestamp: new Date(),
      isEditable: false
    };

    this.addMessage(message);
  }

  private renderMessage(message: ConversationMessage): void {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.type}`;
    messageElement.dataset.messageId = message.id;

    const bubbleContent = message.isEditing 
      ? this.createEditableContent(message)
      : this.createMessageContent(message);

    messageElement.innerHTML = `
      <div class="message-bubble">
        ${bubbleContent}
      </div>
      <div class="message-meta">
        <span class="timestamp">${this.formatTimestamp(message.timestamp)}</span>
        ${this.createMessageActions(message)}
      </div>
    `;

    // Remove welcome message if it exists
    const welcomeMessage = this.messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }

    this.messagesContainer.appendChild(messageElement);
    this.setupMessageEventListeners(messageElement, message);
  }

  private createMessageContent(message: ConversationMessage): string {
    let content = `<div class="message-content">${this.escapeHtml(message.content)}</div>`;
    
    if (message.confidence !== undefined) {
      const confidencePercent = Math.round(message.confidence * 100);
      content += `
        <div class="confidence-indicator">
          <span>Confidence:</span>
          <div class="confidence-bar">
            <div class="confidence-fill" style="width: ${confidencePercent}%"></div>
          </div>
          <span>${confidencePercent}%</span>
        </div>
      `;
    }

    return content;
  }

  private createEditableContent(message: ConversationMessage): string {
    return `
      <textarea class="edit-input">${this.escapeHtml(message.content)}</textarea>
      <div class="edit-actions">
        <button class="edit-btn save">Save</button>
        <button class="edit-btn cancel">Cancel</button>
      </div>
    `;
  }

  private createMessageActions(message: ConversationMessage): string {
    if (!message.isEditable) return '';

    return `
      <div class="message-actions">
        <button class="action-btn edit-btn-action" data-action="edit">Edit</button>
        <button class="action-btn copy-btn" data-action="copy">Copy</button>
      </div>
    `;
  }

  private setupMessageEventListeners(element: HTMLElement, message: ConversationMessage): void {
    // Edit button
    const editBtn = element.querySelector('[data-action="edit"]') as HTMLButtonElement;
    if (editBtn) {
      editBtn.addEventListener('click', () => this.startEditMessage(message.id));
    }

    // Copy button
    const copyBtn = element.querySelector('[data-action="copy"]') as HTMLButtonElement;
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyMessageContent(message.content));
    }

    // Save/Cancel buttons for editing
    const saveBtn = element.querySelector('.edit-btn.save') as HTMLButtonElement;
    const cancelBtn = element.querySelector('.edit-btn.cancel') as HTMLButtonElement;
    
    if (saveBtn && cancelBtn) {
      saveBtn.addEventListener('click', () => this.saveMessageEdit(message.id, element));
      cancelBtn.addEventListener('click', () => this.cancelMessageEdit(message.id));
    }
  }

  private startEditMessage(messageId: string): void {
    const message = this.messages.find(m => m.id === messageId);
    if (!message) return;

    message.isEditing = true;
    message.originalContent = message.content;
    this.rerenderMessage(messageId);
  }

  private saveMessageEdit(messageId: string, element: HTMLElement): void {
    const message = this.messages.find(m => m.id === messageId);
    const textarea = element.querySelector('.edit-input') as HTMLTextAreaElement;
    
    if (!message || !textarea) return;

    const newContent = textarea.value.trim();
    if (newContent && newContent !== message.content) {
      message.content = newContent;
      
      if (this.onTranscriptionEditCallback) {
        this.onTranscriptionEditCallback(messageId, newContent);
      }
    }

    message.isEditing = false;
    delete message.originalContent;
    this.rerenderMessage(messageId);
  }

  private cancelMessageEdit(messageId: string): void {
    const message = this.messages.find(m => m.id === messageId);
    if (!message) return;

    if (message.originalContent) {
      message.content = message.originalContent;
    }

    message.isEditing = false;
    delete message.originalContent;
    this.rerenderMessage(messageId);
  }

  private rerenderMessage(messageId: string): void {
    const message = this.messages.find(m => m.id === messageId);
    const element = this.messagesContainer.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement;
    
    if (!message || !element) return;

    const bubbleContent = message.isEditing 
      ? this.createEditableContent(message)
      : this.createMessageContent(message);

    const bubble = element.querySelector('.message-bubble') as HTMLElement;
    bubble.innerHTML = bubbleContent;

    // Update actions
    const actionsContainer = element.querySelector('.message-actions') as HTMLElement;
    if (actionsContainer) {
      actionsContainer.innerHTML = this.createMessageActions(message).replace(/.*<div class="message-actions">|<\/div>.*/g, '');
    }

    this.setupMessageEventListeners(element, message);
  }

  private copyMessageContent(content: string): void {
    navigator.clipboard.writeText(content).then(() => {
      // Could show a toast notification here
      console.log('Message copied to clipboard');
    });
  }

  private clearConversation(): void {
    this.messages = [];
    this.messagesContainer.innerHTML = `
      <div class="welcome-message">
        <p>Welcome! Start by describing your workflow or process. I'll help you create a comprehensive SOP.</p>
      </div>
    `;
    this.updateUndoButton();
  }

  private exportConversation(): void {
    const conversationText = this.messages
      .map(msg => `[${this.formatTimestamp(msg.timestamp)}] ${msg.type.toUpperCase()}: ${msg.content}`)
      .join('\n\n');

    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private undoLastMessage(): void {
    if (this.messages.length > 0) {
      this.messages.pop();
      const lastElement = this.messagesContainer.lastElementChild;
      if (lastElement && !lastElement.classList.contains('welcome-message')) {
        lastElement.remove();
      }
      this.updateUndoButton();

      // Show welcome message if no messages left
      if (this.messages.length === 0) {
        this.messagesContainer.innerHTML = `
          <div class="welcome-message">
            <p>Welcome! Start by describing your workflow or process. I'll help you create a comprehensive SOP.</p>
          </div>
        `;
      }
    }
  }

  private updateUndoButton(): void {
    const undoBtn = this.container.querySelector('#undoBtn') as HTMLButtonElement;
    undoBtn.disabled = this.messages.length === 0;
  }

  private scrollToBottom(): void {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  private formatTimestamp(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Public methods
  public updateSession(session: ConversationSession): void {
    this.currentSession = session;
    
    const statusElement = this.container.querySelector('#sessionStatus') as HTMLElement;
    const iterationElement = this.container.querySelector('#iterationCount') as HTMLElement;
    
    statusElement.textContent = session.isActive ? 'Active Session' : 'Session Paused';
    iterationElement.textContent = `${session.iterationCount}/5`;
    
    statusElement.className = `session-status ${session.isActive ? 'active' : 'paused'}`;
  }

  onMessageSend(callback: (message: string) => void): void {
    this.onMessageSendCallback = callback;
  }

  onTranscriptionEdit(callback: (messageId: string, newContent: string) => void): void {
    this.onTranscriptionEditCallback = callback;
  }

  public getMessages(): ConversationMessage[] {
    return [...this.messages];
  }

  public clearMessages(): void {
    this.clearConversation();
  }
}