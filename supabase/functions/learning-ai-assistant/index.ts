import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { ChatOpenAI } from "https://esm.sh/langchain/chat_models/openai";
import { OpenAIEmbeddings } from "https://esm.sh/langchain/embeddings/openai";
import { LLMChain } from "https://esm.sh/langchain/chains";
import { PromptTemplate } from "https://esm.sh/langchain/prompts";
import { StringOutputParser } from "https://esm.sh/langchain/schema/output_parser";
import { Document } from "https://esm.sh/langchain/document";
import { SupabaseVectorStore } from "https://esm.sh/langchain/vectorstores/supabase";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { message, courseId, courseName, userId, conversationHistory = [] } = await req.json();

    console.log('Learning AI Assistant request:', { message, courseId, courseName, userId });

    // Initialize OpenAI with LangChain
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured in environment variables');
    }

    const model = new ChatOpenAI({
      openAIApiKey: openAIApiKey,
      modelName: "gpt-4-1106-preview", // or "gpt-3.5-turbo-16k" for longer context
      temperature: 0.7,
      maxTokens: 1500,
    });

    // Fetch user context and course data
    const { userContext, courseContext } = await fetchLearningContext(
      supabaseClient, 
      userId, 
      courseId
    );

    // Perform semantic search using RAG
    const relevantContent = await performSemanticSearch(
      supabaseClient,
      message,
      courseId,
      openAIApiKey
    );

    // Create enhanced prompt template with RAG context
    const promptTemplate = PromptTemplate.fromTemplate(`
You are a Learning AI Assistant specialized in helping students with their educational journey.

CONTEXTUAL INFORMATION:
{userContext}
{courseContext}

RETRIEVED RELEVANT CONTENT (Use this for accurate, course-specific answers):
{relevantContent}

CONVERSATION HISTORY:
{conversationHistory}

STUDENT'S CURRENT QUESTION: {message}

YOUR ROLE & GUIDELINES:
1. PRIMARY FOCUS: Use the RETRIEVED RELEVANT CONTEXT above to provide accurate, specific answers
2. Be helpful, encouraging, and educational
3. Explain complex topics in simple, digestible terms
4. Provide practical examples and real-world applications
5. Suggest related topics and next learning steps
6. If the answer isn't in the context, be honest and offer to help find the information
7. Reference specific lessons, modules, or concepts from the course materials when possible
8. Encourage active learning and critical thinking

RESPONSE FORMAT:
- Start with a direct answer to the question
- Provide detailed explanations using course content
- Include examples or analogies when helpful
- Suggest practical exercises or review materials
- End with an encouraging note and offer further help

Generate your response based on the available context:`);

    // Format conversation history for context
    const formattedHistory = conversationHistory
      .map((msg: any) => `${msg.role}: ${msg.content}`)
      .join('\n');

    // Create LLM chain
    const chain = new LLMChain({
      llm: model,
      prompt: promptTemplate,
      outputParser: new StringOutputParser(),
    });

    // Generate response using LangChain with RAG context
    const response = await chain.call({
      message,
      userContext: userContext || "No specific user context available",
      courseContext: courseContext || "No specific course context available",
      relevantContent: relevantContent || "No specific relevant content found for this query",
      conversationHistory: formattedHistory || "No previous conversation",
    });

    // Store the interaction for learning and analytics
    await storeInteraction(supabaseClient, {
      userId,
      courseId,
      userMessage: message,
      aiResponse: response.text,
      relevantContentUsed: relevantContent ? true : false
    });

    console.log('AI Response generated successfully with RAG');

    return new Response(JSON.stringify({ 
      success: true,
      response: response.text,
      sourcesUsed: !!relevantContent
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in learning-ai-assistant function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Enhanced context fetching function
async function fetchLearningContext(supabaseClient: any, userId: string, courseId: string) {
  let userContext = '';
  let courseContext = '';

  // Get user's enrolled courses and progress
  if (userId) {
    const { data: enrollments } = await supabaseClient
      .from('course_enrollments')
      .select(`
        progress,
        last_accessed,
        completed_lessons,
        courses (
          id,
          title,
          description,
          category,
          difficulty_level
        )
      `)
      .eq('user_id', userId);

    // Get user's learning preferences and history
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('learning_style, preferred_difficulty, total_learning_time')
      .eq('id', userId)
      .single();

    // Get recent user activity
    const { data: recentActivity } = await supabaseClient
      .from('user_learning_activities')
      .select('activity_type, lesson_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    userContext = `
USER PROFILE:
- Learning Style: ${userProfile?.learning_style || 'Not specified'}
- Preferred Difficulty: ${userProfile?.preferred_difficulty || 'Not specified'}
- Total Learning Time: ${userProfile?.total_learning_time || '0'} hours

ENROLLED COURSES:
${enrollments?.map((enrollment: any) => `
Course: ${enrollment.courses?.title}
Progress: ${enrollment.progress || 0}%
Completed Lessons: ${enrollment.completed_lessons || 0}
Last Accessed: ${enrollment.last_accessed || 'Never'}
`).join('\n') || 'No enrolled courses'}

RECENT ACTIVITY:
${recentActivity?.map((activity: any) => 
  `- ${activity.activity_type} on lesson ${activity.lesson_id} at ${activity.created_at}`
).join('\n') || 'No recent activity'}
`;
  }

  // Get detailed course content if courseId is provided
  if (courseId) {
    const { data: courseDetails } = await supabaseClient
      .from('courses')
      .select(`
        title,
        description,
        learning_objectives,
        prerequisites,
        target_audience,
        estimated_duration
      `)
      .eq('id', courseId)
      .single();

    const { data: modules } = await supabaseClient
      .from('course_modules')
      .select(`
        title,
        description,
        order_index,
        learning_outcomes,
        lessons (
          id,
          title,
          description,
          content_type,
          duration,
          difficulty,
          lesson_transcripts (
            content
          ),
          quizzes (
            title,
            questions (
              question_text,
              options,
              correct_answer
            )
          )
        )
      `)
      .eq('course_id', courseId)
      .order('order_index');

    courseContext = `
CURRENT COURSE DETAILS:
Title: ${courseDetails?.title}
Description: ${courseDetails?.description}
Learning Objectives: ${courseDetails?.learning_objectives}
Prerequisites: ${courseDetails?.prerequisites}
Target Audience: ${courseDetails?.target_audience}
Estimated Duration: ${courseDetails?.estimated_duration}

COURSE CONTENT STRUCTURE:
${modules?.map((module: any) => `
MODULE: ${module.title}
Description: ${module.description || 'No description'}
Learning Outcomes: ${module.learning_outcomes || 'Not specified'}
Lessons:
${module.lessons?.map((lesson: any) => `
- ${lesson.title} (${lesson.content_type}, ${lesson.duration}min, ${lesson.difficulty})
  Description: ${lesson.description || 'No description'}
  ${lesson.lesson_transcripts?.length ? `Transcript Available: Yes` : 'No transcript'}
  ${lesson.quizzes?.length ? `Quizzes: ${lesson.quizzes.length}` : 'No quizzes'}
`).join('\n') || 'No lessons'}
`).join('\n') || 'No modules available'}
`;
  }

  return { userContext, courseContext };
}

// Enhanced RAG with Semantic Search
async function performSemanticSearch(
  supabaseClient: any, 
  query: string, 
  courseId?: string, 
  openAIApiKey?: string
) {
  try {
    if (!openAIApiKey) {
      console.log('No OpenAI API key for embeddings');
      return null;
    }

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: openAIApiKey,
      modelName: "text-embedding-ada-002"
    });

    // Create vector store connection
    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabaseClient,
      tableName: 'document_embeddings',
      queryName: 'match_documents',
    });

    // Build metadata filter for course-specific search
    const filter: any = {};
    if (courseId) {
      filter.course_id = courseId;
    }

    // Perform similarity search
    const relevantDocs = await vectorStore.similaritySearch(query, 4, filter);
    
    if (relevantDocs.length === 0) {
      console.log('No relevant documents found for query:', query);
      return null;
    }

    console.log(`Found ${relevantDocs.length} relevant documents`);

    // Format the relevant content with source information
    const formattedContent = relevantDocs.map((doc, index) => 
      `[Source ${index + 1} - ${doc.metadata?.source || 'Unknown'}]
Content: ${doc.pageContent}
Relevance: ${doc.metadata?.relevance_score || 'High'}
---
`).join('\n');

    return formattedContent;

  } catch (error) {
    console.error('Error in semantic search:', error);
    return null;
  }
}

// Function to store interactions for analytics and improvement
async function storeInteraction(supabaseClient: any, interaction: {
  userId?: string;
  courseId?: string;
  userMessage: string;
  aiResponse: string;
  relevantContentUsed: boolean;
}) {
  try {
    const { error } = await supabaseClient
      .from('ai_assistant_interactions')
      .insert({
        user_id: interaction.userId,
        course_id: interaction.courseId,
        user_message: interaction.userMessage,
        ai_response: interaction.aiResponse,
        relevant_content_used: interaction.relevantContentUsed,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error storing interaction:', error);
    }
  } catch (error) {
    console.error('Error in storeInteraction:', error);
  }
}

// Optional: Function to generate embeddings for new content
async function generateEmbeddingsForContent(
  content: string,
  metadata: any,
  openAIApiKey: string
) {
  try {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: openAIApiKey,
      modelName: "text-embedding-ada-002"
    });

    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_KEY') ?? '',
      ),
      tableName: 'document_embeddings',
    });

    const doc = new Document({
      pageContent: content,
      metadata: {
        ...metadata,
        created_at: new Date().toISOString(),
        content_type: metadata.content_type || 'lesson_content'
      }
    });

    await vectorStore.addDocuments([doc]);
    console.log('Successfully generated and stored embeddings');

  } catch (error) {
    console.error('Error generating embeddings:', error);
  }
}
