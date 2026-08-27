import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface AIRequest {
  operation: 'idea' | 'combine' | 'analyze';
  prompt?: string;
  contents?: string[];
}

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
  }

  try {
    const body: AIRequest = await request.json();
    const { operation, prompt, contents } = body;

    let systemPrompt = '';
    let userPrompt = '';

    switch (operation) {
      case 'idea':
        systemPrompt = `You are a UI/UX design expert. Generate a structured UI idea breakdown based on the user's prompt.
Format your response as:

## Overview
Brief description of the UI concept

## Key Components
- Component 1: Description
- Component 2: Description
- Component 3: Description

## User Flow
1. Step one
2. Step two
3. Step three

## Visual Style
- Color palette suggestions
- Typography recommendations
- Layout approach

## Interactions
- Key interactions and animations
- Microinteractions to consider`;
        userPrompt = prompt || '';
        break;

      case 'combine':
        systemPrompt = `You are a UI/UX design expert. Combine the following two UI concepts into a unified, cohesive design concept.
Format your response as:

## Combined Concept
Brief description of how these concepts merge

## Unified Components
- How elements from both concepts work together

## Synergies
- What makes this combination powerful

## Implementation Approach
- How to build this combined concept`;
        userPrompt = contents?.join('\n\n---\n\n') || '';
        break;

      case 'analyze':
        systemPrompt = `You are a senior UX researcher and design critic. Analyze the following UI concept(s) and provide a thorough critique.
Format your response EXACTLY as:

## UX Tradeoffs
- Tradeoff 1: Description
- Tradeoff 2: Description

## Cognitive Load
- Assessment of mental effort required
- Recommendations for simplification

## Dev Complexity
- Technical implementation challenges
- Estimated complexity (Low/Medium/High)

## Accessibility Risks
- Potential WCAG issues
- Screen reader considerations
- Color contrast concerns

## Scalability Risks
- How the design handles edge cases
- Performance at scale
- Content overflow scenarios`;
        userPrompt = contents?.join('\n\n---\n\n') || '';
        break;

      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || 'OpenAI API error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || '';

    return NextResponse.json({ result });
  } catch (error) {
    console.error('AI route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
