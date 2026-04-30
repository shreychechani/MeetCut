// backend/src/services/recallService.js
import axios from 'axios';

const RECALL_API_BASE = 'https://api.recall.ai/api/v1';

class RecallService {
  getClient() {
    const apiKey = process.env.RECALL_API_KEY;
    // Recall.ai requires a region prefix. Defaulting to us-west-2 if not specified.
    const region = process.env.RECALL_REGION || 'us-west-2';
    const baseURL = process.env.RECALL_REGION ? `https://${process.env.RECALL_REGION}.recall.ai/api/v1` : 'https://us-west-2.recall.ai/api/v1';

    if (!apiKey) {
      console.warn('RECALL_API_KEY not found in environment variables');
    }

    return axios.create({
      baseURL: baseURL,
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async createBot({ meeting_url, bot_name = 'MeetCut Recorder', join_at }) {
    try {
      console.log('🤖 Creating Recall.ai bot for:', meeting_url);

      const client = this.getClient();
      const response = await client.post('/bot', {
        meeting_url,
        bot_name,
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
      const client = this.getClient();
      const response = await client.get(`/bot/${botId}`);
      
      const statusChanges = response.data.status_changes || [];
      const latestStatus = statusChanges.length > 0 
        ? statusChanges[statusChanges.length - 1].code 
        : 'unknown';
      
      return {
        success: true,
        status: latestStatus,
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
      const client = this.getClient();
      await client.delete(`/bot/${botId}`);
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
      const client = this.getClient();
      const response = await client.get('/bot');
      
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