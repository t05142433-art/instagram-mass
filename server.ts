import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Background Tasks State
  const tasks = new Map<string, {
    id: string;
    target: string;
    message: string;
    count: number;
    delay: number;
    status: 'running' | 'completed' | 'failed' | 'stopped';
    progress: number;
    logs: any[];
    startTime: string;
  }>();

  // 1. Start Background Task
  app.post('/api/tasks/start', (req, res) => {
    const { threadId, message, count, delay, headers, baseData } = req.body;
    const taskId = Math.random().toString(36).substring(7);

    tasks.set(taskId, {
      id: taskId,
      target: threadId,
      message,
      count,
      delay,
      status: 'running',
      progress: 0,
      logs: [],
      startTime: new Date().toLocaleTimeString()
    });

    // Start detached execution
    (async () => {
      const task = tasks.get(taskId)!;
      try {
        for (let i = 0; i < count; i++) {
          if (task.status !== 'running') break;

          const threadingId = Date.now().toString();
          const payloadVariables = {
            "ig_thread_igid": threadId,
            "offline_threading_id": threadingId,
            "text": { "sensitive_string_value": message },
            "send_attribution": "igd_web_chat_tab:in_thread"
          };

          const finalData = {
            ...baseData,
            variables: JSON.stringify(payloadVariables)
          };

          const logRequest = { timestamp: new Date().toLocaleTimeString(), type: 'request', payload: finalData };
          task.logs.push(logRequest);

          try {
            const response = await axios.post('https://www.instagram.com/api/graphql', finalData, {
              headers: headers,
              validateStatus: () => true,
            });
            task.logs.push({ 
              timestamp: new Date().toLocaleTimeString(), 
              type: 'response', 
              status: response.status, 
              data: response.data 
            });
          } catch (err: any) {
            task.logs.push({ 
              timestamp: new Date().toLocaleTimeString(), 
              type: 'error', 
              message: err.message 
            });
          }

          task.progress = Math.round(((i + 1) / count) * 100);
          
          if (i < count - 1) {
            await new Promise(resolve => setTimeout(resolve, delay * 1000));
          }
        }
        task.status = 'completed';
      } catch (error: any) {
        task.status = 'failed';
        task.logs.push({ timestamp: new Date().toLocaleTimeString(), type: 'error', message: 'Task failed globally' });
      }
    })();

    res.json({ taskId });
  });

  // 2. Get Task Status
  app.get('/api/tasks/:id', (req, res) => {
    const task = tasks.get(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  });

  // 3. Stop Task
  app.post('/api/tasks/:id/stop', (req, res) => {
    const task = tasks.get(req.params.id);
    if (task) task.status = 'stopped';
    res.json({ success: true });
  });

  // 4. List Tasks
  app.get('/api/tasks', (req, res) => {
    res.json(Array.from(tasks.values()).reverse());
  });

  // 5. Clear Tasks
  app.delete('/api/tasks', (req, res) => {
    tasks.clear();
    res.json({ success: true });
  });

  // API Proxy for Instagram (Keeping as fallback/individual tests)
  app.post('/api/ig-send', async (req, res) => {
    const { url, headers, data } = req.body;
    
    try {
      console.log('--- [ PROXY: SENDING TO INSTAGRAM ] ---');
      const response = await axios.post(url, data, {
        headers: headers,
        // Critical: Ensure we don't follow redirects or throw on 4xx if we want to debug
        validateStatus: () => true,
      });

      console.log(`--- [ PROXY: INSTAGRAM RESPONSE ${response.status} ] ---`);
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error('--- [ PROXY: ERROR ] ---', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Fetch Bot Profile Info (The one sending messages)
  app.post('/api/ig-bot-info', async (req, res) => {
    const { headers } = req.body;
    // Extract user ID from cookies (ds_user_id)
    const cookies = headers['cookie'] || '';
    const userIdMatch = cookies.match(/ds_user_id=([0-9]+)/);
    const userId = userIdMatch ? userIdMatch[1] : null;

    if (!userId) {
      return res.status(400).json({ error: 'User ID not found in cookies' });
    }

    try {
      // Use mobile-like endpoint or internal info endpoint
      const response = await axios.get(`https://www.instagram.com/api/v1/users/${userId}/info/`, {
        headers: headers
      });
      const user = response.data.user;
      res.json({
        id: userId,
        username: user.username,
        full_name: user.full_name,
        profile_pic: user.profile_pic_url
      });
    } catch (error: any) {
      console.error('Error fetching bot info:', error.message);
      res.status(500).json({ error: 'Could not fetch bot info' });
    }
  });

  // Fetch Target Profile Info (The receiver)
  app.post('/api/ig-thread-info', async (req, res) => {
    const { threadId, headers, baseData } = req.body;
    
    if (!threadId) return res.status(400).json({ error: 'Thread ID or Username required' });

    const isNumeric = /^[0-9]+$/.test(threadId);

    try {
      // 1. Try GraphQL Thread Query first if it looks like a thread ID
      if (isNumeric && (threadId.length > 15)) {
        try {
          const threadQueryData = {
            ...baseData,
            fb_api_req_friendly_name: "IGDirectThreadDataQuery",
            variables: JSON.stringify({
              "thread_id": threadId,
              "visual_message_return_type": "none"
            }),
            doc_id: "7154942091217688"
          };

          const response = await axios.post('https://www.instagram.com/api/graphql', threadQueryData, {
            headers: headers,
            timeout: 5000,
            validateStatus: () => true
          });

          const thread = response.data?.data?.viewer?.message_thread;
          if (thread && thread.participants && thread.participants.length > 0) {
            const viewerIdMatch = headers['cookie']?.match(/ds_user_id=([0-9]+)/);
            const viewerId = viewerIdMatch ? viewerIdMatch[1] : null;
            const target = thread.participants.find((p: any) => p.user_id !== viewerId) || thread.participants[0];
            
            return res.json({
              name: target.name || target.username,
              username: target.username,
              profile_pic: target.profile_pic_url
            });
          }
        } catch (e) { console.log('GraphQL Thread query failed, trying fallbacks...'); }
      }

      // 2. Try User Info API if it's a numeric ID
      if (isNumeric) {
        try {
          const userResponse = await axios.get(`https://www.instagram.com/api/v1/users/${threadId}/info/`, {
            headers: headers,
            timeout: 5000,
            validateStatus: () => true
          });
          
          if (userResponse.data && userResponse.data.user) {
            const user = userResponse.data.user;
            return res.json({
              name: user.full_name || user.username,
              username: user.username,
              profile_pic: user.profile_pic_url
            });
          }
        } catch (e) { console.log('User Info API failed...'); }
      }

      // 3. Try Username Search/Visit if not numeric or others failed
      try {
        // We can try to fetch the profile page and scrape or use the web info endpoint
        const webUserRes = await axios.get(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${threadId}`, {
          headers: {
            ...headers,
            'x-ig-app-id': '936619743392459', // Web app ID
            'referer': `https://www.instagram.com/${threadId}/`
          },
          timeout: 5000,
          validateStatus: () => true
        });

        if (webUserRes.data?.data?.user) {
          const user = webUserRes.data.data.user;
          return res.json({
            name: user.full_name || user.username,
            username: user.username,
            profile_pic: user.profile_pic_url
          });
        }
      } catch (e) { console.log('Web Profile Info failed...'); }

      // 4. Final Fallback: Search
      try {
        const searchRes = await axios.get(`https://www.instagram.com/api/v1/web/search/topsearch/?context=blended&query=${threadId}&rank_token=0.1`, {
          headers: headers,
          timeout: 5000
        });
        const firstUser = searchRes.data?.users?.[0]?.user;
        if (firstUser) {
          return res.json({
            name: firstUser.full_name || firstUser.username,
            username: firstUser.username,
            profile_pic: firstUser.profile_pic_url
          });
        }
      } catch (e) { console.log('Topsearch failed...'); }

      res.status(404).json({ error: 'Target not found after multiple attempts' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
