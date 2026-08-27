import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface ImageRequest {
  prompt: string;
  count?: number;
}

const SYSTEM_PROMPT = `You are an elite UI/UX designer who creates stunning, pixel-perfect interfaces. Generate a complete HTML page that looks like a premium, production-ready design.

CRITICAL SETUP - Include this EXACT head section:
\`\`\`
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }
        }
      }
    }
  </script>
  <style>
    * { font-family: 'Inter', system-ui, sans-serif; }
    body { width: 1200px; height: 800px; margin: 0; padding: 0; overflow: hidden; }
  </style>
</head>
\`\`\`

CRITICAL: Add this script tag at the END of the body to initialize icons:
<script>lucide.createIcons();</script>

DESIGN REQUIREMENTS:
1. LAYOUT: Create a complete UI with sidebar/navigation, main content, and proper hierarchy. Never just a centered card.
2. COLORS: Use sophisticated palettes. For dark themes: zinc-900/950 backgrounds, zinc-800 cards, zinc-700 borders. For light: white/zinc-50 backgrounds with subtle zinc borders. Always use vibrant accent colors (violet-500, blue-500, emerald-500, etc.) for CTAs and highlights.
3. TYPOGRAPHY: Use font-medium/font-semibold for headings. Use text-zinc-400 for secondary text (dark mode) or text-zinc-500 (light mode). Proper text hierarchy with text-2xl/text-xl/text-sm sizing.
4. SPACING: Use generous padding (p-6, p-8), proper gaps (gap-4, gap-6), and breathing room. Cramped designs look cheap.
5. SHADOWS & DEPTH: Use shadow-sm, shadow-md, shadow-lg. Add ring-1 ring-white/10 for subtle borders in dark mode.
6. IMAGES/AVATARS: NEVER use <img> tags with URLs. Instead create colorful gradient placeholders:
   - For avatars: <div class="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-semibold text-sm">JD</div>
   - For image placeholders: <div class="aspect-video rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center"><i data-lucide="image" class="w-8 h-8 text-zinc-600"></i></div>

7. ICONS - CRITICAL RULES:
   ALWAYS use Lucide icons with this exact syntax: <i data-lucide="icon-name" class="w-5 h-5"></i>
   
   NEVER use:
   - Unicode symbols (✓, ✕, →, ★, etc.) - these render as random characters
   - Icon font classes without the library loaded
   - Empty icon elements
   
   Common Lucide icon names to use:
   - Navigation: home, menu, x, chevron-right, chevron-down, arrow-left, arrow-right
   - Actions: plus, minus, edit, trash-2, copy, download, upload, share, external-link
   - UI: search, settings, bell, user, users, mail, calendar, clock, filter
   - Status: check, x, alert-circle, info, alert-triangle
   - Media: image, play, pause, volume-2, mic
   - Files: file, folder, file-text, paperclip
   - Communication: message-circle, send, phone
   - Commerce: shopping-cart, credit-card, package
   - Charts: bar-chart-2, trending-up, trending-down, pie-chart
   - Social: heart, star, bookmark, thumbs-up
   
   Example button with icon: <button class="flex items-center gap-2"><i data-lucide="plus" class="w-4 h-4"></i>Add Item</button>
   Example icon button: <button class="p-2 rounded-lg hover:bg-zinc-800"><i data-lucide="settings" class="w-5 h-5"></i></button>

8. BUTTONS: Styled with bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium transition-colors. Secondary buttons: bg-zinc-800 hover:bg-zinc-700 border border-zinc-700.
9. CARDS: Use bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl p-6 for dark mode glass effect.
10. TABLES: Style with divide-y divide-zinc-800, hover:bg-zinc-800/50 on rows, px-6 py-4 cells. Use colored status badges with rounded-full px-2.5 py-0.5 text-xs font-medium.
11. INPUTS: bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-violet-500 focus:border-transparent.

CONTENT: Use realistic placeholder content. Real names (Alex Chen, Sarah Miller), real metrics ($12,450, 2,847 users), real dates (Mar 15, 2024).

OUTPUT: Return ONLY valid HTML. No markdown, no code blocks, no explanations. Just the complete <!DOCTYPE html> document. Remember to include <script>lucide.createIcons();</script> at the end of the body.`;

async function generateHTMLFromPrompt(prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Create a UI design for: ${prompt}` }
      ],
      max_tokens: 8192,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || 'Failed to generate HTML');
  }

  const data = await response.json();
  let html = data.choices?.[0]?.message?.content;

  if (!html) {
    throw new Error('No HTML returned from API');
  }

  // Clean up if wrapped in code blocks
  html = html.replace(/^```html\n?/i, '').replace(/\n?```$/i, '');
  html = html.replace(/^```\n?/, '').replace(/\n?```$/, '');

  return html.trim();
}

async function renderHTMLToImage(html: string): Promise<string> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    
    await page.setViewport({
      width: 1200,
      height: 800,
      deviceScaleFactor: 2, // High DPI for crisp images
    });

    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait for Tailwind CDN, fonts, and Lucide icons to fully load
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        // Wait for document fonts to be ready
        const fontPromise = document.fonts?.ready || Promise.resolve();
        
        fontPromise.then(() => {
          // Check if Lucide is loaded and initialize icons
          const checkLucide = () => {
            if (typeof (window as Window & { lucide?: { createIcons: () => void } }).lucide !== 'undefined') {
              (window as Window & { lucide?: { createIcons: () => void } }).lucide!.createIcons();
              resolve();
            } else {
              // Lucide not loaded yet, wait a bit and try again
              setTimeout(checkLucide, 100);
            }
          };
          
          // Start checking for Lucide after a small delay
          setTimeout(checkLucide, 200);
        });
      });
    });
    
    // Additional delay to ensure Tailwind CSS and icons are fully rendered
    await new Promise(resolve => setTimeout(resolve, 2000));

    const screenshot = await page.screenshot({
      type: 'png',
      encoding: 'base64',
    });

    return `data:image/png;base64,${screenshot}`;
  } finally {
    await browser.close();
  }
}

async function generateSingleUIImage(prompt: string): Promise<string> {
  const html = await generateHTMLFromPrompt(prompt);
  const imageDataUrl = await renderHTMLToImage(html);
  return imageDataUrl;
}

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  try {
    const body: ImageRequest = await request.json();
    const { prompt, count = 1 } = body;

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const imageCount = Math.min(Math.max(1, count), 4);

    if (imageCount === 1) {
      const imageUrl = await generateSingleUIImage(prompt);
      return NextResponse.json({ imageUrl, imageUrls: [imageUrl] });
    }

    // Generate multiple variations with distinct design directions
    const prompts = [
      prompt,
      `${prompt} - Use a sleek dark theme with zinc/slate colors and violet accents`,
      `${prompt} - Use a clean light theme with white backgrounds and blue accents`,
      `${prompt} - Use a bold modern style with gradients and vibrant colors`,
    ].slice(0, imageCount);

    const promises = prompts.map(p => generateSingleUIImage(p));
    const results = await Promise.allSettled(promises);
    
    const imageUrls = results
      .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
      .map(r => r.value);

    if (imageUrls.length === 0) {
      return NextResponse.json({ error: 'All image generations failed' }, { status: 500 });
    }

    return NextResponse.json({ 
      imageUrl: imageUrls[0], 
      imageUrls 
    });
  } catch (error) {
    console.error('Image route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
