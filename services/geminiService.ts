import { GoogleGenAI } from "@google/genai";
import { Citation, SearchResult, UploadedFile, SEOMetadata, AuthorProfile } from "../types";

// CRITICAL FIX: Use import.meta.env for Vite compatibility. 
// process.env causes a crash in the browser.
const apiKey = import.meta.env.VITE_API_KEY;

const ai = new GoogleGenAI({ apiKey: apiKey || 'DUMMY_KEY_FOR_BUILD' });

/**
 * Helper to clean and parse JSON from AI responses.
 * Handles markdown code blocks, extra text, and standard JSON formatting.
 */
const cleanAndParseJSON = (text: string): any => {
  if (!text) return null;
  
  // 1. Remove Markdown code blocks (```json ... ```)
  let clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch (e) {
    // 2. If direct parse fails, try to extract the JSON object/array substring
    const firstBrace = clean.indexOf('{');
    const firstBracket = clean.indexOf('[');
    
    let start = -1;
    let end = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      start = firstBrace;
      end = clean.lastIndexOf('}') + 1;
    } else if (firstBracket !== -1) {
      start = firstBracket;
      end = clean.lastIndexOf(']') + 1;
    }

    if (start !== -1 && end > start) {
      try {
        const extracted = clean.substring(start, end);
        return JSON.parse(extracted);
      } catch (e2) {
        console.warn("Failed to parse extracted JSON:", e2);
      }
    }
    
    console.warn("JSON parse failed for text:", text);
    return null;
  }
};

/**
 * Phase 1: Research the topic using Google Search Grounding.
 * Strictly prioritizes authoritative domains (IRS.gov) for YMYL compliance.
 */
export const performTaxResearch = async (topic: string, category: string): Promise<SearchResult> => {
  try {
    // YMYL SAFETGUARD: We append specific site search operators to the invisible prompt
    // to ensure the model retrieves high-authority data first.
    const prompt = `I need to write a compliant, factual US Taxation blog post for ${category}. 
    Topic: "${topic}".
    
    Step 1: Search for official IRS sources, Tax Code (IRC), and authoritative news.
    Priority Sources: site:irs.gov OR site:taxpayeradvocate.irs.gov OR site:congress.gov.
    
    Step 2: Find the latest limits, deadlines, and inflation adjustments for the current tax year.
    
    Provide a comprehensive summary of the facts found, referencing the sources.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "No summary available.";
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const citations: Citation[] = groundingChunks
      .filter((chunk: any) => chunk.web?.uri && chunk.web?.title)
      .map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri,
        source: 'Google Search',
      }));

    return { text, citations };
  } catch (error) {
    console.error("Research error:", error);
    throw new Error("Failed to gather research data from Google.");
  }
};

/**
 * Phase 1.5: Generate SEO Keywords using RAG.
 */
export const generateSEOKeywords = async (topic: string): Promise<string[]> => {
  try {
    const prompt = `You are an expert SEO strategist using Retrieval-Augmented Generation (RAG).
    Topic: "${topic}" (US Taxation).
    Identify 6-10 "high-quality" keywords based on current search volume and intent.
    Return ONLY a raw JSON array of strings.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    const parsed = cleanAndParseJSON(text || '');
    return Array.isArray(parsed) ? parsed : [];

  } catch (error) {
    console.error("Keyword generation error:", error);
    return []; 
  }
};

/**
 * Phase 2: Write the blog post using Thinking Mode.
 * Includes Author Profile integration for E-E-A-T.
 */
export const generateBlogContent = async (
  topic: string, 
  category: string, 
  researchData: SearchResult, 
  author: AuthorProfile,
  files: UploadedFile[] = [],
  tone: string = "Expert Tax Advisor",
  wordCount: string = "Standard (800-1200 words)",
  keywords: string[] = []
): Promise<string> => {
  try {
    // Fallback mechanism: If thinkingBudget (Pro 3.0) fails (500 error), try without thinking config or lower model.
    const runGeneration = async (useThinking: boolean) => {
        const researchContext = `
        Research Summary from Google Search (Prioritizing IRS.gov):
        ${researchData.text}
        
        Available Web Source URLs:
        ${researchData.citations.map(c => `- ${c.title}: ${c.uri}`).join('\n')}
        `;

        const keywordsInstruction = keywords.length > 0 
          ? `SEO Optimization: Naturally integrate these keywords (NO stuffing): ${keywords.join(', ')}.` 
          : '';

        const promptText = `Write a professional, accurate blog post about "${topic}" for a US ${category} audience.
        
        Primary Sources: Google Search Research Summary & Attached Documents.
        Author Persona: ${tone}.
        Target Length: ${wordCount}.
        
        ${keywordsInstruction}
        
        Instructions:
        - Prioritize official IRS guidelines over third-party blogs (YMYL Standard).
        - Cite attached documents if used.
        
        Structure (HTML5):
        1. <h1>Title</h1>
        2. Introduction
        3. Key Takeaways (<ul> list) - Target Featured Snippet.
        4. Detailed Body (MUST include 4-6 detailed examples/scenarios and 1-2 <table>s with width="100%").
        5. Common Pitfalls & Mistakes (Actionable advice).
        6. FAQ Section (3-4 Q&A).
        7. Conclusion.
        
        Constraint: Do NOT include a "References" list.
        
        OUTPUT FORMAT:
        - Raw SEO-optimized semantic HTML5.
        - <h1> first. No <article> wrapper.
        - LCP/CLS Optimization: Simple structure, proper table headers.
        - No inline styles (except table width).
        
        ${researchContext}`;

        const parts: any[] = [];
        
        files.forEach(file => {
          parts.push({
            inlineData: {
              mimeType: file.mimeType,
              data: file.data
            }
          });
        });

        parts.push({ text: promptText });

        const config: any = {
             // Lower budget to prevent timeouts/500 errors while maintaining quality
             thinkingConfig: { thinkingBudget: 10240 }, 
        };

        // If not using thinking (fallback), remove the config
        if (!useThinking) {
            delete config.thinkingConfig;
        }

        const response = await ai.models.generateContent({
          model: useThinking ? 'gemini-3-pro-preview' : 'gemini-2.5-flash', // Fallback model
          contents: { parts },
          config: useThinking ? config : undefined,
        });

        return response.text || "Failed to generate content.";
    };

    let text = "";
    try {
        text = await runGeneration(true);
    } catch (e) {
        console.warn("Thinking model failed, falling back to standard generation.", e);
        text = await runGeneration(false);
    }
    
    text = text.replace(/```html|```/g, '').trim();
    
    // E-E-A-T ENHANCEMENT: Author Box
    const authorBoxHTML = `
    <div class="author-box">
       <div style="flex: 1;">
          <h4>About the Author</h4>
          <p class="name">${author.name}, ${author.credentials}</p>
          <p class="bio">${author.bio}</p>
       </div>
    </div>
    `;

    const disclaimerHTML = `
    <div class="disclaimer-box">
    <p>
      <strong>Disclaimer:</strong> The information provided in this article is for educational and informational purposes only and does not constitute professional financial or tax advice. Tax laws are subject to change. We recommend consulting with a qualified tax professional regarding your specific situation.
    </p>
    </div>
    `;

    return text + authorBoxHTML + disclaimerHTML;
  } catch (error) {
    console.error("Generation error:", error);
    throw new Error("Failed to generate blog content.");
  }
};

/**
 * Phase 3: Generate SEOMetadata including E-E-A-T Author Schema and Citations.
 */
export const generateSEOMetadata = async (
  topic: string, 
  blogContent: string, 
  author: AuthorProfile,
  citations: Citation[] = []
): Promise<SEOMetadata> => {
  try {
    const prompt = `Analyze the blog post HTML about "${topic}".
    
    Generate a comprehensive SEO Strategy with strict JSON output.
    
    REQUIREMENTS:
    1. "metaTitle": SEO title (max 60 chars).
    2. "metaDescription": SEO description (max 160 chars).
    3. "slug": URL slug (kebab-case).
    4. "imageIdeas": EXACTLY 3 distinct AI image ideas.
       - "prompt": Detailed prompt for Imagen 3.
       - "altText": SEO optimized alt text.
       - "description": Short label.
    5. "relatedTopics": EXACTLY 3-5 semantically related topics for internal linking.
       - "title": Blog title.
       - "slug": URL slug.
    
    OUTPUT JSON FORMAT EXAMPLE:
    {
      "metaTitle": "...",
      "metaDescription": "...",
      "slug": "...",
      "imageIdeas": [
         { "description": "Office", "prompt": "A modern office...", "altText": "Tax office" },
         { "description": "Form", "prompt": "A close up...", "altText": "IRS Form" },
         { "description": "Concept", "prompt": "Growth...", "altText": "Finance" }
      ],
      "socialPosts": { "linkedin": "...", "twitter": "..." },
      "relatedTopics": [
         { "title": "Topic 1", "slug": "topic-1" },
         { "title": "Topic 2", "slug": "topic-2" },
         { "title": "Topic 3", "slug": "topic-3" }
      ]
    }
    
    Blog Preview:
    ${blogContent.substring(0, 3000)}...`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text;
    // FIX: Handle text being undefined by passing empty string default
    const data = cleanAndParseJSON(text || '');
    if (!data) throw new Error("Failed to parse SEO JSON");

    const metaTitle = data.metaTitle || `${topic} - Tax Guide`;
    const metaDescription = data.metaDescription || `Read our detailed guide on ${topic}.`;
    const currentSlug = data.slug || topic.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const permalink = `https://ourtaxpartner.com/${currentSlug}`;

    // --- PROGRAMMATIC SCHEMA CONSTRUCTION (Graph Structure) ---
    
    // 1. Organization (Brand)
    const orgSchema = {
      "@type": "Organization",
      "@id": "https://ourtaxpartner.com/#organization",
      "name": "Our Tax Partner",
      "url": "https://ourtaxpartner.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://peakbcs.com/assets/images/logo.jpg",
        "width": 192,
        "height": 192
      }
    };

    // 2. Person (Author) - E-E-A-T Critical
    const authorSchema = {
      "@type": "Person",
      "@id": `https://ourtaxpartner.com/#person/${author.name.replace(/\s+/g, '-').toLowerCase()}`,
      "name": author.name,
      "description": author.bio,
      "jobTitle": "Tax Professional",
      "worksFor": { "@id": "https://ourtaxpartner.com/#organization" }
    };

    // 3. Citations List (Trust Signal)
    const citationList = citations.map(c => c.uri);

    // 4. Breadcrumbs
    const breadcrumbSchema = {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://ourtaxpartner.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Blog",
          "item": "https://ourtaxpartner.com/blog"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": metaTitle,
          "item": permalink
        }
      ]
    };

    // 5. Main Article
    const articleSchema = {
      "@context": "https://schema.org",
      "@graph": [
        orgSchema,
        breadcrumbSchema,
        {
          "@type": "Article",
          "@id": `${permalink}#article`,
          "isPartOf": { "@id": permalink },
          "author": authorSchema,
          "headline": metaTitle,
          "datePublished": new Date().toISOString(),
          "dateModified": new Date().toISOString(),
          "mainEntityOfPage": { "@id": permalink },
          "publisher": { "@id": "https://ourtaxpartner.com/#organization" },
          "image": {
             "@type": "ImageObject",
             "url": "https://ourtaxpartner.com/assets/default-tax.jpg" // Fallback or generated image URL
          },
          "description": metaDescription,
          // INJECTING RESEARCH CITATIONS directly into Schema
          "citation": citationList
        }
      ]
    };

    const schemaString = JSON.stringify(articleSchema);
    
    // --- End Programmatic Schema ---

    const socialMetaTags = `
<meta property="og:title" content="${metaTitle}" />
<meta property="og:description" content="${metaDescription}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="${permalink}" />
<meta property="og:site_name" content="Our Tax Partner" />
<meta name="author" content="${author.name}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${metaTitle}" />
<meta name="twitter:description" content="${metaDescription}" />
`.trim();

    const relatedTopics = Array.isArray(data.relatedTopics) 
      ? data.relatedTopics.map((t: any) => ({
          title: t.title,
          slug: t.slug,
          url: `https://ourtaxpartner.com/${t.slug}`
        }))
      : [];

    return {
      metaTitle,
      metaDescription,
      slug: currentSlug,
      schemaJSON: schemaString,
      socialMetaTags,
      imageIdeas: Array.isArray(data.imageIdeas) ? data.imageIdeas : [],
      socialPosts: data.socialPosts || { linkedin: '', twitter: '' },
      relatedTopics
    };

  } catch (error) {
    console.error("SEO Metadata error", error);
    return {
      metaTitle: `${topic} - Tax Guide`,
      metaDescription: `Read our detailed guide on ${topic}.`,
      slug: topic.toLowerCase().replace(/\s+/g, '-'),
      schemaJSON: '{}',
      socialMetaTags: '',
      imageIdeas: [],
      socialPosts: { linkedin: '', twitter: '' },
      relatedTopics: []
    };
  }
};

export const generateBlogImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '16:9',
      },
    });

    // FIX: TypeScript safety check using proper null checks or optional chaining
    const img = response.generatedImages?.[0];
    if (!img || !img.image?.imageBytes) {
      throw new Error("No image generated.");
    }

    const base64ImageBytes = img.image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
  } catch (error) {
    console.error("Image generation error:", error);
    throw new Error("Failed to generate image.");
  }
};
