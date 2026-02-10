import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// DEMO MODE - set to true to use mock evaluation instead of API
const DEMO_MODE = false;

const app = express();
const port = process.env.PORT || 3001;

// Configure multer for image uploads
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'your-api-key-here',
});

// XP Tiers
const XP_TIERS = {
  COMMON: { name: 'Common', xp: 10, color: '#9ca3af' },
  STRONG_WORK: { name: 'Strong Work', xp: 25, color: '#3b82f6' },
  BUSTING_CHOPS: { name: 'Busting Chops', xp: 50, color: '#8b5cf6' },
  LEGENDARY: { name: 'Legendary', xp: 150, color: '#f59e0b' }
};

// Mock evaluation function for demo mode
function mockEvaluate(description) {
  const desc = description.toLowerCase();

  // Legendary keywords
  if (desc.includes('phd') || desc.includes('job') || desc.includes('marathon') ||
      desc.includes('business') || desc.includes('promotion')) {
    return { tier: 'LEGENDARY', explanation: 'Major life achievement!' };
  }

  // Busting Chops keywords
  if (desc.includes('deep clean') || desc.includes('entire') || desc.includes('major project') ||
      desc.includes('organized') || desc.includes('workout')) {
    return { tier: 'BUSTING_CHOPS', explanation: 'Significant effort and accomplishment!' };
  }

  // Strong Work keywords
  if (desc.includes('laundry') || desc.includes('grocery') || desc.includes('cleaned') ||
      desc.includes('studied') || desc.includes('finished') || desc.includes('completed')) {
    return { tier: 'STRONG_WORK', explanation: 'Good productive work!' };
  }

  // Default to Common
  return { tier: 'COMMON', explanation: 'Basic task completed.' };
}

// Generate verification request endpoint
app.post('/api/generate-verification', async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Task description required' });
    }

    // Call Claude API to generate random verification request
    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `Generate a unique photo verification request for this task: "${description}"

Requirements:
- Include a specific hand gesture or object placement that proves the photo is fresh
- Make it simple but impossible to fake with old photos
- Examples: "show me [task] with your hand making a thumbs up on top", "with a peace sign next to it", "with a coin placed on it"
- Keep it short and clear
- Vary the verification method randomly

Respond with ONLY the verification request, nothing else. Start with "Show me"`
      }]
    });

    const verificationRequest = message.content[0].text.trim();

    res.json({ verificationRequest });

  } catch (error) {
    console.error('Error generating verification:', error);
    res.status(500).json({
      error: 'Failed to generate verification',
      details: error.message
    });
  }
});

app.post('/api/evaluate-task', upload.single('image'), async (req, res) => {
  try {
    const { description, verificationRequest } = req.body;
    const imagePath = req.file?.path;

    if (!description) {
      return res.status(400).json({ error: 'Task description is required' });
    }

    // DEMO MODE - use mock evaluation
    if (DEMO_MODE) {
      const { tier, explanation } = mockEvaluate(description);
      const tierData = XP_TIERS[tier];

      // Clean up image if uploaded
      if (imagePath) {
        fs.unlinkSync(imagePath);
      }

      return res.json({
        tier: tierData.name,
        xp: tierData.xp,
        color: tierData.color,
        explanation: explanation,
        description: description
      });
    }

    let imageContent = null;

    // If image was uploaded, convert it to base64
    if (imagePath) {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');

      // Determine image type from file extension or default to jpeg
      const imageType = req.file.mimetype || 'image/jpeg';

      imageContent = {
        type: 'image',
        source: {
          type: 'base64',
          media_type: imageType,
          data: base64Image,
        },
      };

      // Clean up uploaded file
      fs.unlinkSync(imagePath);
    }

    // Prepare messages for Claude
    const messageContent = [];

    if (imageContent) {
      messageContent.push(imageContent);
    }

    messageContent.push({
      type: 'text',
      text: `You are evaluating a real-life productivity task for an RPG game.

TASK CLAIMED: "${description}"
VERIFICATION REQUIRED: "${verificationRequest || 'No specific verification required'}"

An image has been provided as proof. You must verify TWO things:

1. TASK AUTHENTICITY: Did they actually complete the claimed task shown in the image?
2. VERIFICATION MATCH: Does the photo clearly show the required verification element: "${verificationRequest}"?

CRITICAL: If the verification pose/object is missing, incorrect, or unclear, you MUST respond with: "COMMON: Verification failed - [specific reason]"

If BOTH verifications pass, categorize the task into an XP tier:

1. COMMON (10 XP) - Small routine tasks (made bed, washed dishes, sent email)
2. STRONG_WORK (25 XP) - Meaningful focused effort (laundry, grocery shopping, cleaned room, studied 2+ hours)
3. BUSTING_CHOPS (50 XP) - Significant accomplishment (deep clean entire house, major project, organized event, intense workout)
4. LEGENDARY (150 XP) - Life-changing achievement (PhD thesis, new job, marathon, business launch)

Respond ONLY with: "TIER: explanation"

Be strict on verification - if the pose is wrong or missing, always fail.`
    });

    // Call Claude API - using Claude 3 Opus (most capable, available to all)
    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: messageContent
      }]
    });

    const response = message.content[0].text;

    // Parse the response to extract tier
    let tier = 'COMMON';
    let explanation = response;

    if (response.includes('LEGENDARY:')) {
      tier = 'LEGENDARY';
      explanation = response.split('LEGENDARY:')[1].trim();
    } else if (response.includes('BUSTING_CHOPS:')) {
      tier = 'BUSTING_CHOPS';
      explanation = response.split('BUSTING_CHOPS:')[1].trim();
    } else if (response.includes('STRONG_WORK:')) {
      tier = 'STRONG_WORK';
      explanation = response.split('STRONG_WORK:')[1].trim();
    } else if (response.includes('COMMON:')) {
      tier = 'COMMON';
      explanation = response.split('COMMON:')[1].trim();
    }

    const tierData = XP_TIERS[tier];

    res.json({
      tier: tierData.name,
      xp: tierData.xp,
      color: tierData.color,
      explanation: explanation,
      description: description
    });

  } catch (error) {
    console.error('Error evaluating task:', error);
    res.status(500).json({
      error: 'Failed to evaluate task',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Task evaluation server is running' });
});

app.listen(port, () => {
  console.log(`🎮 Task evaluation server running on http://localhost:${port}`);
  console.log(`📝 API endpoint: http://localhost:${port}/api/evaluate-task`);
});
