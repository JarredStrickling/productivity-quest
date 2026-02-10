# 🎮 Productivity Quest - Setup Guide

## What You Built

A 2D Pokemon-style RPG where real-life accomplishments power your in-game character! Walk around a town, talk to the Task Master NPC, and submit proof of your real-world tasks to gain XP and level up.

## Quick Start

### 1. Add Your API Key

Edit the `.env` file and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

Get your API key from: https://console.anthropic.com/

### 2. Start Both Servers

You need TWO terminals running:

**Terminal 1 - Frontend (Game):**
```bash
cd productivity-game
npm run dev
```

**Terminal 2 - Backend (AI Evaluation):**
```bash
cd productivity-game
npm run server
```

### 3. Play!

Open your browser to: **http://localhost:5174/**

## How to Play

1. **Move**: Use WASD or Arrow Keys to walk around the town
2. **Find the Task Master**: Walk up to the yellow NPC near the blue building
3. **Interact**: Press **E** when you're close to open the task submission form
4. **Submit Task**:
   - Describe what you accomplished
   - Upload a photo as proof (optional but recommended)
   - Click submit
5. **Claude evaluates**: The AI analyzes your task and image to determine XP tier
6. **Gain XP**: Watch your character gain XP with cool visual effects!

## XP Tiers

- **Common (10 XP)**: Small routine tasks (make bed, dishes, email)
- **Strong Work (25 XP)**: Meaningful tasks (laundry, studying, assignments)
- **Busting Chops (50 XP)**: Major accomplishments (deep clean, big project)
- **Legendary (150 XP)**: Life-changing events (PhD defense, new job, marathon)

## Tips

- Take photos of your completed tasks for better XP evaluation
- The AI is honest - it won't give inflated XP for minor tasks
- Your progress is saved in browser localStorage
- Each level requires more XP: Level × 100 (Level 2 needs 200 XP, Level 3 needs 300 XP, etc.)

## Tech Stack

- **Frontend**: React + Phaser.js (2D game engine)
- **Backend**: Express.js
- **AI**: Claude 3.5 Sonnet (vision + text evaluation)
- **Storage**: Browser localStorage (will upgrade to database later for multiplayer)

## Next Steps

Ready to add:
- ✅ Real pixel art sprites
- ✅ More NPCs (shop, quests)
- ✅ Combat system for raids
- ✅ 30-minute daily play limit
- ✅ Multiplayer with friends
- ✅ More towns and areas to explore

Have fun being productive! 🎮⚔️
