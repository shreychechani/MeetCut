// backend/src/services/recallService.js
import axios from 'axios';

const RECALL_API_BASE = 'https://api.recall.ai/api/v1';

class RecallService {
  constructor() {
    this.apiKey = process.env.RECALL_API_KEY;
    
    if (!this.apiKey) {
      console.warn('RECALL_API_KEY not found in environment variables');
    }

    this.client = axios.create({
      baseURL: RECALL_API_BASE,
      headers: {
        'Authorization': `Token ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async createBot({ meeting_url, bot_name = 'MeetCut Recorder', join_at }) {
    try {
      console.log('🤖 Creating Recall.ai bot for:', meeting_url);

      const response = await this.client.post('/bot', {
        meeting_url,
        bot_name,
        transcription_options: {
          provider: 'default'
        },
        recording_mode: 'speaker_view',
        automatic_leave: {
          waiting_room_timeout: 900,
          noone_joined_timeout: 900
        },
        ...(join_at && { join_at })
      });

      console.log('Bot created successfully:', response.data.id);
      
      return {
        success: true,
        botId: response.data.id,
        status: response.data.status_changes?.[0]?.code || 'created',
        data: response.data
      };

    } catch (error) {
      console.error('Recall.ai bot creation failed:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  async getBotStatus(botId) {
    try {
      const response = await this.client.get(`/bot/${botId}`);
      
      return {
        success: true,
        status: response.data.status_changes?.[0]?.code || 'unknown',
        recordingUrl: response.data.video_url,
        duration: response.data.duration,
        data: response.data
      };

    } catch (error) {
      console.error('Failed to get bot status:', error.response?.data || error.message);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async deleteBot(botId) {
    try {
      await this.client.delete(`/bot/${botId}`);
      console.log('🗑️  Bot deleted:', botId);
      return { success: true };

    } catch (error) {
      console.error('Failed to delete bot:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async listBots() {
    try {
      const response = await this.client.get('/bot');
      
      return {
        success: true,
        bots: response.data.results || [],
        count: response.data.count
      };

    } catch (error) {
      console.error('Failed to list bots:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

export default new RecallService();