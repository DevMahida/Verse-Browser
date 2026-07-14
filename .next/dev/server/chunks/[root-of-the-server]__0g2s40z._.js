module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/app/api/ai/route.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'meta-llama/llama-3.1-8b-instruct';
async function callOpenRouter(apiKey, systemPrompt, userContent, model = DEFAULT_MODEL) {
    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://verse-browser.app',
            'X-Title': 'Verse Browser AI'
        },
        body: JSON.stringify({
            model: model || DEFAULT_MODEL,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: userContent
                }
            ],
            max_tokens: 1500,
            temperature: 0.7
        })
    });
    if (!response.ok) {
        const errText = await response.text();
        let errJson;
        try {
            errJson = JSON.parse(errText);
        } catch  {
            errJson = {
                error: {
                    message: errText
                }
            };
        }
        const msg = errJson?.error?.message || `OpenRouter error: ${response.status}`;
        throw new Error(msg);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No response received.';
}
function buildPrompt(endpoint, payload) {
    const { text = '', html = '', query = '', title = '', url = '', selected_text = '', extraction_goal = '', platform = '', style = '', target_language = '' } = payload;
    const pageCtx = `Page Title: ${title || 'Unknown'}\nPage URL: ${url || 'Unknown'}`;
    const contentSnippet = (text || '').substring(0, 12000);
    switch(endpoint){
        case '/summarize':
            return {
                system: 'You are a helpful AI assistant that summarizes web page content concisely and clearly. Use markdown formatting with headers and bullet points.',
                user: `${pageCtx}\n\nPage Content:\n${contentSnippet}\n\nPlease provide a clear, concise summary of this page.`,
                key: 'result'
            };
        case '/explain':
            return {
                system: 'You are a helpful AI tutor that explains articles in simple, easy-to-understand language. Use analogies and plain English.',
                user: `${pageCtx}\n\nPage Content:\n${contentSnippet}\n\nPlease explain this article in simple terms.`,
                key: 'result'
            };
        case '/key-points':
            return {
                system: 'You are a helpful assistant that extracts the most important key points from web content. Format as a numbered or bulleted markdown list.',
                user: `${pageCtx}\n\nPage Content:\n${contentSnippet}\n\nList the key points from this page.`,
                key: 'result'
            };
        case '/faqs':
            return {
                system: 'You are a helpful assistant that generates frequently asked questions (FAQs) with answers based on web content. Format as markdown with bold questions.',
                user: `${pageCtx}\n\nPage Content:\n${contentSnippet}\n\nGenerate 5 relevant FAQs with answers based on this page.`,
                key: 'faqs'
            };
        case '/study-notes':
            return {
                system: 'You are a study assistant that creates detailed, well-structured study notes from web content. Use headers, bullet points, and highlight key terms.',
                user: `${pageCtx}\n\nPage Content:\n${contentSnippet}\n\nCreate comprehensive study notes from this page.`,
                key: 'result'
            };
        case '/extract':
            return {
                system: `You are a data extraction assistant. Extract all ${extraction_goal || 'relevant data'} from the provided content. Return them as a clean markdown list.`,
                user: `${pageCtx}\n\nPage Content:\n${contentSnippet}\n\nExtract all ${extraction_goal || 'relevant information'} from this page.`,
                key: 'result'
            };
        case '/generate-post':
            return {
                system: `You are a social media content creator. Create an engaging ${platform || 'social media'} post based on the page content. Be concise, engaging, and use relevant hashtags if appropriate.`,
                user: `${pageCtx}\n\nPage Content:\n${contentSnippet}\n\nCreate a ${platform || 'social media'} post about this page.`,
                key: 'result'
            };
        case '/rewrite':
            return {
                system: `You are a writing assistant that rewrites content in a ${style || 'professional'} style. Maintain the original meaning while improving the tone and clarity.`,
                user: `${pageCtx}\n\nContent to rewrite:\n${contentSnippet}\n\nRewrite this content in a ${style || 'professional'} style.`,
                key: 'result'
            };
        case '/translate':
            return {
                system: `You are a professional translator. Translate the given text accurately to ${target_language || 'Spanish'}. Preserve the meaning and tone.`,
                user: `Translate the following text to ${target_language || 'Spanish'}:\n\n${contentSnippet}`,
                key: 'result'
            };
        case '/rag':
            {
                // Parse and strip HTML for RAG/chat
                const pageText = (text || html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').substring(0, 12000);
                const selectionNote = selected_text ? `\n\nUser has selected this text on the page: "${selected_text.substring(0, 1000)}"` : '';
                return {
                    system: 'You are a helpful AI assistant embedded in a web browser. You have access to the current web page content and can answer questions about it accurately. Be concise but thorough. Use markdown formatting where appropriate.',
                    user: `${pageCtx}\n\nPage Content:\n${pageText}${selectionNote}\n\nUser Question: ${query}`,
                    key: 'answer'
                };
            }
        default:
            return {
                system: 'You are a helpful AI assistant.',
                user: `${pageCtx}\n\nContent:\n${contentSnippet}\n\nQuery: ${query || 'Please help with this content.'}`,
                key: 'result'
            };
    }
}
async function POST(req) {
    try {
        const body = await req.json();
        const { endpoint, payload } = body;
        if (!endpoint || !payload) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Missing endpoint or payload'
            }, {
                status: 400
            });
        }
        // API key is always taken from the server environment
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey || apiKey.trim() === '') {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Server API key not configured.'
            }, {
                status: 500
            });
        }
        const { system, user, key } = buildPrompt(endpoint, payload);
        const answer = await callOpenRouter(apiKey.trim(), system, user, payload.model);
        // Return keyed response so frontend handles it correctly
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            [key]: answer,
            answer,
            result: answer
        });
    } catch (error) {
        console.error('AI Route Error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message || 'An unexpected error occurred.'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0g2s40z._.js.map