// AI 聊天接口
app.post('/api/ai-chat', async (req, res) => {
  try {
    // 获取请求体中的 messages
    const { messages } = req.body;
    
    // 验证 messages 字段
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages 字段必须是数组' });
    }
    
    // 从环境变量获取智谱 API Key
    const apiKey = process.env.ZHIPU_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: '缺少 ZHIPU_API_KEY 环境变量' });
    }
    
    // 调用智谱 AI API
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: messages
      })
    });
    
    // 解析智谱的响应
    const data = await response.json();
    
    // 返回智谱的回复
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});
