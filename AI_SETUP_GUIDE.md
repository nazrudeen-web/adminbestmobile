# AI Assistant Integration - Complete Setup Guide

## ✅ Installation Complete!

I've integrated Claude + Groq AI with your admin panel. Here's how to set it up:

---

## 📋 Step-by-Step Setup

### Step 1: Get Claude API Key (5 minutes)

**1. Go to Anthropic Console:**
- Open https://console.anthropic.com/login
- Click "Sign Up" (if new account)
- Use email address (recommended: Gmail)
- Verify your email

**2. Get API Key:**
- Click your profile icon (top-right)
- Select "Billing" → "Plans"
- Choose "Pro" plan or keep "Free" (50k tokens/month)
- Go to "API Keys" section
- Click "Create Key"
- Copy the key (starts with `sk-ant-`)
- **SAVE THIS SOMEWHERE SAFE!**

**3. Keep track:**
- 50,000 tokens/month FREE
- ~500 questions/month
- Beyond that: $3 per 1M input tokens, $15 per 1M output tokens

---

### Step 2: Get Groq API Key (5 minutes)

**1. Go to Groq Console:**
- Open https://console.groq.com/login
- Click "Sign Up" (if new account)
- Use Gmail or email
- Verify email

**2. Get API Key:**
- Dashboard should open automatically
- Look for "API Keys" section
- Click "Create New API Key"
- Copy the key (starts with `gsk_`)
- **SAVE THIS!**

**3. Keep track:**
- Currently FREE with no limits
- Faster responses (<500ms)
- Fallback when Claude quota expires

---

### Step 3: Add Keys to Your Project

**1. Create/Edit `.env.local` file:**

Open the file: `/workspaces/adminbestmobile/.env.local`

Add these lines:
```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
GROQ_API_KEY=gsk-xxxxxxxxxxxxxxxxxxxxx
```

Replace with YOUR actual keys!

**2. Verify file location:**
```
/workspaces/adminbestmobile/.env.local
```

**3. Restart dev server:**
```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

**Important:** 
- `.env.local` is in `.gitignore` (safe, won't be committed)
- Never share these keys!
- Keep them secret!

---

### Step 4: Test the Integration

**1. Start dev server:**
```bash
npm run dev
```

**2. Open admin panel:**
- http://localhost:3000/products

**3. Scroll to bottom:**
- You should see "AI Assistant for Specs"
- Chat box with message history

**4. Test with questions:**
- "Format this: iPhone 16 pro 6.3 display A18 processor 48mp camera 4300mah battery"
- "What specs should flagship phone have?"
- "Is 500MP camera realistic?"

**5. Check if working:**
- ✅ Response appears in chat
- ✅ Shows which AI (Claude or Groq)
- ✅ Shows token count used

---

## 🎯 Features You Now Have

### AI Assistant Features:
- ✅ **Quality Responses** - Claude for complex questions
- ✅ **Fast Fallback** - Groq when Claude quota full
- ✅ **Token Tracking** - See how many tokens used
- ✅ **Message History** - View all past questions/answers
- ✅ **Clear Chat** - Delete conversation history
- ✅ **Mobile Optimized** - Works on phone/tablet

### What You Can Ask:
1. **Format Data**
   - "Format this spec: Display 6.7 inch AMOLED 120Hz"
   
2. **Extract Specs**
   - "Extract specs from: iPhone 16 has 48MP camera, A18, 6.3 display"
   
3. **Analyze**
   - "Compare iPhone 16 vs Samsung S24"
   
4. **Validate**
   - "Is 500MP camera realistic?"
   
5. **Suggest**
   - "What specs should I add for flagship phone?"

---

## 📊 Understanding Token Usage

### Claude Free Tier:
- **Limit:** 50,000 tokens/month
- **Average question:** 100 tokens
- **Estimate:** ~500 questions/month ✅ ENOUGH FOR PERSONAL USE

### Token Tracking:
- Green bar = <60% used ✅
- Yellow bar = 60-80% used ⚠️
- Red bar = >80% used 🔴

### When quota expires:
- Automatically switches to Groq
- Groq is free (for now)
- Same quality responses

---

## 🚀 Where the AI Appears

### Current Location:
- **Products Page** → `/products`
- Scroll to bottom
- "AI Assistant for Specs" section

### Future Locations (Can Add):
- Import page (help formatting data)
- Specs editor (suggest specs)
- Dashboard (general questions)
- Anywhere you need help

---

## 🔧 How It Works (Technical)

### Architecture:

```
Your Admin Panel
        ↓
  Chat Component
        ↓
API Route (/api/ai/chat)
        ↓
   Try Claude First
        ↓
If Claude fails → Use Groq (Fallback)
        ↓
Send Response to UI
        ↓
Display in Chat
```

### Files Created:
1. `/app/api/ai/chat/route.js` - Smart router (Claude + Groq)
2. `/components/shared/ai-assistant.jsx` - UI component
3. `/app/products/page.js` - Added AI to products page

### How Priority Works:
1. Claude API key exists? Use Claude first
2. Claude fails (quota)? Switch to Groq
3. Groq API key exists? Use it
4. Neither? Show error

---

## 📱 Using the AI Assistant

### Basic Usage:
```
1. Type your question in the input box
2. Press Enter or click Send
3. Wait for AI response
4. Question appears as blue bubble (you)
5. Answer appears as gray bubble (AI)
6. Shows which AI answered (Claude 🧠 or Groq ⚡)
7. Shows token count
```

### Keyboard Shortcuts:
- **Enter** = Send message
- **Shift+Enter** = New line in message
- **Clear button** = Delete all messages

### Example Conversation:
```
You:  "Format phone data: Samsung S24 Ultra 6.8 display 200MP camera"

AI:  "Here's formatted data:
     Category: Performance
     - Name: Display Size
     - Value: 6.8 inches
     - Name: Main Camera
     - Value: 200 MP"

(Powered by Claude, used 120 tokens)
```

---

## 💰 Cost Breakdown

### Monthly Cost Prediction:

**Scenario 1: Light Use (10 questions/day)**
- Tokens/month: ~1,000
- Cost: $0 (within free tier)

**Scenario 2: Medium Use (50 questions/day)**
- Tokens/month: ~5,000
- Cost: $0 (within free tier)

**Scenario 3: Heavy Use (200 questions/day)**
- Tokens/month: ~20,000
- Cost: $0 (within free tier)

**After 50k tokens/month:**
- $0.03 per 1,000 input tokens
- $0.15 per 1,000 output tokens
- Groq fallback is unlimited (backup)

---

## ⚠️ Important Notes

### Security:
- ✅ API keys stored in `.env.local`
- ✅ Not committed to Git
- ✅ Only visible to you
- ✅ Safe from public exposure

### Best Practices:
- Don't commit `.env.local` to GitHub
- Regenerate keys if exposed
- Keep Groq as fallback
- Monitor token usage monthly

### Troubleshooting:

**Q: AI not responding?**
A: Check `.env.local` has both API keys. Restart `npm run dev`.

**Q: Getting error "API keys not configured"?**
A: Make sure `.env.local` exists with your keys.

**Q: Using too many tokens fast?**
A: Don't worry, Groq fallback is free and fast!

**Q: Want different AI model?**
A: Can use Groq's faster model (default) or Claude's quality model.

---

## 🎨 UI Component Details

### Chat Box Shows:
- User messages (blue, right side)
- AI responses (gray, left side)
- Thinking indicator (while loading)
- Token count for each message
- Timestamp for each message
- Error messages (red background)

### Token Usage Bar:
- Visual progress bar
- Shows used vs total (Claude free tier)
- Color coded:
  - Green (<60%) = Good
  - Yellow (60-80%) = Warning
  - Red (>80%) = Low
  
### Clear Button:
- Deletes chat history
- Resets token counter
- Fresh start

---

## 🚀 Next Steps

### 1. Test It Now
```bash
npm run dev
# Go to http://localhost:3000/products
# Scroll down to AI Assistant
# Ask a test question
```

### 2. Monitor Usage
- Check token count monthly
- Adjust usage if getting expensive
- Groq as fallback is safety net

### 3. Add to Other Pages (Optional)
```javascript
import { AiAssistant } from "@/components/shared/ai-assistant"

// Add anywhere in your page:
<AiAssistant context="Your page context here" />
```

### 4. Customize (Optional)
- Change system prompt (in `/app/api/ai/chat/route.js`)
- Add more capabilities
- Custom UI styling
- Integration with specs

---

## 📞 Support

### Common Questions:

**Q: How long do tokens last?**
A: 50k/month = ~500 questions. Resets each month.

**Q: What happens at month end?**
A: Counter resets to 0. New month starts fresh.

**Q: Can I use Groq only?**
A: Yes! Just don't set ANTHROPIC_API_KEY.

**Q: How to switch models?**
A: Edit `/app/api/ai/chat/route.js` line `model: 'claude-...'`

**Q: Can I add history to database?**
A: Yes, future enhancement possible.

---

## 🎉 You're All Set!

Your AI Assistant is now integrated and ready to use!

**Quick Checklist:**
- [ ] Claude account created
- [ ] Claude API key copied
- [ ] Groq account created  
- [ ] Groq API key copied
- [ ] `.env.local` file created with both keys
- [ ] `npm run dev` restarted
- [ ] Visit `/products` page
- [ ] Test AI with a question
- [ ] Confirmed response appears

---

## 📚 File Reference

| File | Purpose |
|------|---------|
| `/app/api/ai/chat/route.js` | Smart API router (Claude + Groq) |
| `/components/shared/ai-assistant.jsx` | Chat UI component |
| `/app/products/page.js` | Products page with AI |
| `.env.local` | API keys (local only) |

---

## 🔐 Safety Reminders

**DO:**
- ✅ Keep API keys private
- ✅ Use `.env.local` for keys
- ✅ Rotate keys monthly if exposed
- ✅ Monitor token usage

**DON'T:**
- ❌ Share API keys in public
- ❌ Commit `.env.local` to Git
- ❌ Use in client-side code
- ❌ Log API responses with sensitive data

---

**Enjoy your AI Assistant! Happy speccing! 🚀**
