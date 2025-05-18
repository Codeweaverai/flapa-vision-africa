
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    // Get request body
    const { type, userId, courseId, certificateId } = await req.json()

    if (!type || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user email
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email:auth.users!id(email)')
      .eq('id', userId)
      .single()

    if (userError || !user || !user.email) {
      throw new Error(`Error fetching user: ${userError?.message || 'User not found'}`)
    }

    const userEmail = user.email.email

    let emailSubject = ''
    let emailContent = ''
    
    switch (type) {
      case 'enrollment_confirmation':
        if (!courseId) {
          throw new Error('Course ID is required for enrollment confirmation emails')
        }
        
        // Get course details
        const { data: course, error: courseError } = await supabase
          .from('courses')
          .select('title')
          .eq('id', courseId)
          .single()
        
        if (courseError || !course) {
          throw new Error(`Error fetching course: ${courseError?.message || 'Course not found'}`)
        }
        
        emailSubject = `You are now enrolled in ${course.title}`
        emailContent = `Congratulations! You have successfully enrolled in ${course.title}. You can start learning now by logging into your account.`
        break
        
      case 'course_completion':
        if (!courseId || !certificateId) {
          throw new Error('Course ID and Certificate ID are required for course completion emails')
        }
        
        // Get course and certificate details
        const { data: completionDetails, error: completionError } = await supabase
          .from('certificates')
          .select(`
            verification_code,
            course_enrollments!inner(
              courses(title)
            )
          `)
          .eq('id', certificateId)
          .single()
        
        if (completionError || !completionDetails) {
          throw new Error(`Error fetching completion details: ${completionError?.message || 'Details not found'}`)
        }
        
        const courseTitle = completionDetails.course_enrollments.courses.title
        const verificationCode = completionDetails.verification_code
        
        emailSubject = `Congratulations on completing ${courseTitle}!`
        emailContent = `
          Congratulations on completing ${courseTitle}!
          
          You have successfully completed all lessons and passed all quizzes.
          
          Your certificate verification code is: ${verificationCode}
          
          You can view and download your certificate by logging into your account.
        `
        break
        
      case 'payment_receipt':
        if (!courseId) {
          throw new Error('Course ID is required for payment receipt emails')
        }
        
        // Get course details with payment information
        const { data: paidCourse, error: paidCourseError } = await supabase
          .from('courses')
          .select('title, price')
          .eq('id', courseId)
          .single()
        
        if (paidCourseError || !paidCourse) {
          throw new Error(`Error fetching course: ${paidCourseError?.message || 'Course not found'}`)
        }
        
        emailSubject = `Payment Receipt for ${paidCourse.title}`
        emailContent = `
          Thank you for your payment of $${paidCourse.price} for ${paidCourse.title}.
          
          Your payment has been processed successfully and you now have full access to the course.
          
          If you have any questions, please contact our support team.
        `
        break
        
      default:
        throw new Error(`Unsupported email type: ${type}`)
    }

    // Here we would typically connect to an email service like SendGrid or Mailchimp
    // For this demo, we'll just log the email details
    console.log(`Email type: ${type}`)
    console.log(`To: ${userEmail}`)
    console.log(`Subject: ${emailSubject}`)
    console.log(`Content: ${emailContent}`)

    // In a real implementation, you would send the email here
    // For example, using SendGrid:
    // await sendgrid.send({
    //   to: userEmail,
    //   from: 'your-verified-sender@example.com',
    //   subject: emailSubject,
    //   text: emailContent,
    // });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email notification prepared (would be sent in production)'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
