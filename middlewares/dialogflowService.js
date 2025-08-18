const dialogflow = require('@google-cloud/dialogflow');
const Message = require('../models/chatModel');
const User = require('../models/userModel');
require('dotenv').config();
const { default: mongoose } = require('mongoose');

class DialogflowService {
  constructor() {
    // Validate environment variables
    this.projectId = process.env.DIALOGFLOW_PROJECT_ID || 'talkrio-eqxn';
    
    if (!process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_CLIENT_EMAIL) {
      throw new Error('Google Cloud credentials not configured in environment variables');
    }

    // Create credentials object from environment variables
    const credentials = {
      type: 'service_account',
      project_id: this.projectId,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
      universe_domain: 'googleapis.com'
    };

    this.sessionClient = new dialogflow.SessionsClient({ credentials });
  }

  async sendMessageToDialogflow(message, sessionId, roomId, senderId) {
    try {
      // Validate inputs
      if (!message || !sessionId || !roomId || !senderId) {
        throw new Error('Missing required parameters');
      }

      const sessionPath = this.sessionClient.projectAgentSessionPath(
        this.projectId,
        sessionId
      );

      const request = {
        session: sessionPath,
        queryInput: {
          text: {
            text: message,
            languageCode: 'en-US',
          },
        },
      };

      // Save user message to MongoDB
      let username = 'Guest';
      if (mongoose.Types.ObjectId.isValid(senderId)) {
        const user = await User.findById(senderId).select('username');
        if (user) username = user.username;
      }

      const userMessage = new Message({
        roomId,
        senderId,
        receiverId: 'bot',
        message,
        username,
        timestamp: Date.now(),
      });
      await userMessage.save();

      // Call Dialogflow
      const [response] = await this.sessionClient.detectIntent(request);
      const result = response.queryResult;

      // Prepare bot response
      const botResponse = {
        text: result.fulfillmentText || 'Sorry, I didn\'t understand that.',
        intent: result.intent?.displayName || 'UNKNOWN',
        confidence: result.intentDetectionConfidence || 0,
        payload: result.fulfillmentMessages?.find((m) => m.payload)?.payload || {},
      };

      // Save bot response to MongoDB
      const botMessage = new Message({
        roomId,
        senderId: 'bot',
        receiverId: senderId,
        message: botResponse.text,
        username: 'Talkrio AI',
        timestamp: Date.now(),
      });
      await botMessage.save();

      // Add message ID to response
      botResponse.messageId = botMessage._id;

      return botResponse;
    } catch (error) {
      console.error('Dialogflow Error:', error.message);

      // Prepare error response based on error type
      let errorMessage = 'Sorry, I\'m having trouble understanding. Please try again.';
      
      if (error.code === 7) {
        errorMessage = 'Permission denied. Please contact the administrator.';
      } else if (error.code === 5) {
        errorMessage = 'Resource not found. Check the project configuration.';
      } else if (error.message.includes('credentials')) {
        errorMessage = 'Authentication error. Please check server configuration.';
      } else if (error.message.includes('Missing required parameters')) {
        errorMessage = 'System error: Missing required parameters.';
      }

      // Save error message to MongoDB
      const botMessage = new Message({
        roomId,
        senderId: 'bot',
        receiverId: senderId,
        message: errorMessage,
        username: 'Talkrio AI',
        timestamp: Date.now(),
      });
      await botMessage.save();

      return {
        text: errorMessage,
        intent: 'ERROR',
        confidence: 0,
        messageId: botMessage._id,
      };
    }
  }

  // Additional utility methods can be added here
  async getSessionPath(sessionId) {
    return this.sessionClient.projectAgentSessionPath(this.projectId, sessionId);
  }

  async detectIntent(text, sessionId) {
    const sessionPath = this.getSessionPath(sessionId);
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: text,
          languageCode: 'en-US',
        },
      },
    };
    const [response] = await this.sessionClient.detectIntent(request);
    return response.queryResult;
  }
}

module.exports = new DialogflowService();